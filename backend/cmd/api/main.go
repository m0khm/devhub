package main

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/websocket/v2"

	"github.com/m0khm/devhub/backend/internal/admin"
	"github.com/m0khm/devhub/backend/internal/auth"
	"github.com/m0khm/devhub/backend/internal/config"
	"github.com/m0khm/devhub/backend/internal/database"
	"github.com/m0khm/devhub/backend/internal/dm"
	"github.com/m0khm/devhub/backend/internal/message"
	"github.com/m0khm/devhub/backend/internal/metrics"
	"github.com/m0khm/devhub/backend/internal/middleware"
	"github.com/m0khm/devhub/backend/internal/notification"
	"github.com/m0khm/devhub/backend/internal/project"
	"github.com/m0khm/devhub/backend/internal/storage"
	"github.com/m0khm/devhub/backend/internal/topic"
	"github.com/m0khm/devhub/backend/internal/user"
	"github.com/m0khm/devhub/backend/internal/video" // NEW
)

func main() {
	// Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to PostgreSQL
	db, err := database.ConnectPostgres(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Connect to Redis
	redisClient, err := database.ConnectRedis(&cfg.Redis)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	// Initialize JWT manager
	jwtManager := auth.NewJWTManager(cfg.JWT.Secret, cfg.JWT.ExpireHours)

	// Initialize WebSocket hub
	wsHub := message.NewHub()
	go wsHub.Run()

	// Initialize S3 client
	s3Client, err := storage.NewS3Client(
		cfg.S3.Endpoint,
		cfg.S3.AccessKey,
		cfg.S3.SecretKey,
		cfg.S3.Bucket,
		cfg.S3.UseSSL,
	)
	if err != nil {
		log.Printf("S3 storage unavailable: %v", err)
	}

	// Initialize repositories
	projectRepo := project.NewRepository(db)
	topicRepo := topic.NewRepository(db)
	messageRepo := message.NewRepository(db)
	notificationRepo := notification.NewRepository(db)
	dmRepo := dm.NewRepository(db)

	// Initialize services
	authService := auth.NewService(db, jwtManager)
	adminService := admin.NewService(
		cfg.Admin.User,
		cfg.Admin.Password,
		time.Duration(cfg.Admin.SessionTTLInMinute)*time.Minute,
	)
	projectService := project.NewService(projectRepo)
	topicService := topic.NewService(topicRepo, projectRepo)
	messageService := message.NewService(messageRepo, topicRepo, projectRepo, notificationRepo)
	userService := user.NewService(db)
	dmService := dm.NewService(dmRepo, projectRepo)
	notificationService := notification.NewService(notificationRepo, projectRepo, topicRepo)

	// Initialize handlers
	authHandler := auth.NewHandler(authService)
	adminHandler := admin.NewHandler(adminService)
	projectHandler := project.NewHandler(projectService)
	topicHandler := topic.NewHandler(topicService)
	messageHandler := message.NewHandler(messageService)
	dmHandler := dm.NewHandler(dmService)
	wsHandler := message.NewWSHandler(wsHub, messageService)
	messageHandler.SetWSHandler(wsHandler)
	messageHandler.SetNotificationService(notificationService)
	fileHandler := message.NewFileHandler(messageService, s3Client)
	fileHandler.SetWSHandler(wsHandler)
	userHandler := user.NewHandler(userService)
	notificationHandler := notification.NewHandler(notificationService)

	videoHandler := video.NewHandler() // NEW

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "DevHub API",
		ServerHeader: "DevHub",
		ErrorHandler: customErrorHandler,
	})

	// Global middleware
	app.Use(recover.New())
	app.Use(middleware.Logger())
	app.Use(middleware.CORS(cfg.Server.AllowOrigins))
	app.Use(metrics.Middleware())

	app.Get("/metrics", metrics.Handler)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "devhub-api",
		})
	})

	// API routes
	api := app.Group("/api")

	// Auth routes (public)
	authRoutes := api.Group("/auth")
	authRoutes.Post("/register", authHandler.Register)
	authRoutes.Post("/login", authHandler.Login)
	authRoutes.Get("/me", middleware.Auth(jwtManager), authHandler.GetMe)

	// Admin routes (public login + protected dashboard)
	adminRoutes := api.Group("/admin")
	adminRoutes.Post("/login", adminHandler.Login)
	adminRoutes.Get("/", middleware.Admin(adminService), adminHandler.Dashboard)

	// ---- WebSocket routes (НЕ через protected) ----
	wsRoutes := api.Group("/topics")

	wsRoutes.Use("/:topicId/ws", func(c *fiber.Ctx) error {
		if !websocket.IsWebSocketUpgrade(c) {
			return fiber.ErrUpgradeRequired
		}

		// token from query or header
		token := c.Query("token")
		if token == "" {
			authHeader := c.Get("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") {
				token = strings.TrimPrefix(authHeader, "Bearer ")
			}
		}

		if token == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing token"})
		}

		claims, err := jwtManager.Verify(token)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
		}

		c.Locals("userID", claims.UserID.String())
		return c.Next()
	})

	wsRoutes.Get("/:topicId/ws", websocket.New(wsHandler.HandleWebSocket))

	// ---- Protected routes (JWT middleware) ----
	protected := api.Group("/", middleware.Auth(jwtManager))

	// Project routes
	projectRoutes := protected.Group("/projects")
	projectRoutes.Post("/", projectHandler.Create)
	projectRoutes.Get("/", projectHandler.GetUserProjects)
	projectRoutes.Get("/:id", projectHandler.GetByID)
	projectRoutes.Put("/:id", projectHandler.Update)
	projectRoutes.Delete("/:id", projectHandler.Delete)
	projectRoutes.Get("/:id/members", projectHandler.GetMembers)
	projectRoutes.Post("/:id/members", projectHandler.AddMember)
	projectRoutes.Delete("/:id/members/:userId", projectHandler.RemoveMember)
	projectRoutes.Post("/:projectId/dm", dmHandler.CreateOrGet)
	projectRoutes.Get("/:projectId/dm", dmHandler.List)

	// Topic routes (внутри проекта)
	projectRoutes.Post("/:projectId/topics", topicHandler.Create)
	projectRoutes.Get("/:projectId/topics", topicHandler.GetByProjectID)

	// Topic routes (по id)
	topicRoutes := protected.Group("/topics")
	topicRoutes.Get("/:id", topicHandler.GetByID)
	topicRoutes.Put("/:id", topicHandler.Update)
	topicRoutes.Delete("/:id", topicHandler.Delete)

	// Message routes (внутри топика)
	topicRoutes.Post("/:topicId/messages", messageHandler.Create)
	topicRoutes.Get("/:topicId/messages", messageHandler.GetByTopicID)
	topicRoutes.Get("/:topicId/pins", messageHandler.GetPinnedByTopicID)
	topicRoutes.Get("/:topicId/search", messageHandler.SearchMessages)
	topicRoutes.Post("/:topicId/upload", fileHandler.UploadFile)

	// Video routes (внутри топика) // NEW
	topicRoutes.Post("/:topicId/video/room", videoHandler.CreateRoom)

	// Message routes (по id)
	messageRoutes := protected.Group("/messages")
	messageRoutes.Put("/:id", messageHandler.Update)
	messageRoutes.Delete("/:id", messageHandler.Delete)
	messageRoutes.Post("/:id/reactions", messageHandler.ToggleReaction)
	messageRoutes.Post("/:id/pin", messageHandler.PinMessage)
	messageRoutes.Delete("/:id/pin", messageHandler.UnpinMessage)

	// Direct message routes
	dmRoutes := protected.Group("/dm")
	dmRoutes.Post("/", dmHandler.CreateOrGet)
	dmRoutes.Get("/", dmHandler.List)

	// User search routes
	userRoutes := protected.Group("/users")
	userRoutes.Get("/", userHandler.Search)
	userRoutes.Patch("/me", userHandler.UpdateMe)

	// Notification routes
	notificationRoutes := protected.Group("/notifications")
	notificationRoutes.Get("/", notificationHandler.List)
	notificationRoutes.Patch("/:id/read", notificationHandler.MarkRead)

	// Start server
	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	log.Printf("🚀 Server starting on %s (environment: %s)", addr, cfg.Server.Environment)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	return c.Status(code).JSON(fiber.Map{
		"error": message,
	})
}
