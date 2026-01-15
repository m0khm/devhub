package main

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"github.com/m0khm/devhub/backend/internal/auth"
	"github.com/m0khm/devhub/backend/internal/config"
	"github.com/m0khm/devhub/backend/internal/database"
	"github.com/m0khm/devhub/backend/internal/middleware"
	"github.com/m0khm/devhub/backend/internal/project" // NEW
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

	// Initialize repositories
	projectRepo := project.NewRepository(db) // NEW

	// Initialize services
	authService := auth.NewService(db, jwtManager)
	projectService := project.NewService(projectRepo) // NEW

	// Initialize handlers
	authHandler := auth.NewHandler(authService)
	projectHandler := project.NewHandler(projectService) // NEW

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

	// Protected routes
	protected := api.Group("/", middleware.Auth(jwtManager))

	// Project routes (NEW)
	projectRoutes := protected.Group("/projects")
	projectRoutes.Post("/", projectHandler.Create)
	projectRoutes.Get("/", projectHandler.GetUserProjects)
	projectRoutes.Get("/:id", projectHandler.GetByID)
	projectRoutes.Put("/:id", projectHandler.Update)
	projectRoutes.Delete("/:id", projectHandler.Delete)

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
