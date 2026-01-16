package main

import (
	"fmt"
	"log"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/websocket/v2"

	"github.com/m0khm/devhub/backend/internal/auth"
	"github.com/m0khm/devhub/backend/internal/config"
	"github.com/m0khm/devhub/backend/internal/database"
	"github.com/m0khm/devhub/backend/internal/message"
	"github.com/m0khm/devhub/backend/internal/middleware"
	"github.com/m0khm/devhub/backend/internal/project"
	"github.com/m0khm/devhub/backend/internal/topic"
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

	// Initialize repositories
	projectRepo := project.NewRepository(db)
	topicRepo := topic.NewRepository(db)
	messageRepo := message.NewRepository(db)

	// Initialize services
	authService := auth.NewService(db, jwtManager)
	projectService := project.NewService(projectRepo)
	topicService := topic.NewService(topicRepo, projectRepo)
	messageService := message.NewService(messageRepo, topicRepo, projectRepo)

	// Initialize handlers
	authHandler := auth.NewHandler(authService)
	projectHandler := project.NewHandler(projectService)
	topicHandler := topic.NewHandler(topicService)
	messageHandler := message.NewHandler(messageService)
	wsHandler := message.NewWSHandler(wsHub, messageService)
        messageHandler.SetWSHandler(wsHandler)

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

	// ---- WebSocket routes (ВАЖНО: НЕ через protected!) ----
	// ws://host:8080/api/topics/:topicId/ws?token=JWT
	// или с заголовком Authorization: Bearer JWT
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

	// Message routes (по id)
	messageRoutes := protected.Group("/messages")
	messageRoutes.Put("/:id", messageHandler.Update)
	messageRoutes.Delete("/:id", messageHandler.Delete)
	messageRoutes.Post("/:id/reactions", messageHandler.ToggleReaction)

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
