package auth

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/YOUR_USERNAME/devhub/backend/internal/user"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Register handler
// POST /api/auth/register
func (h *Handler) Register(c *fiber.Ctx) error {
	var req user.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// TODO: Add validation here (we'll do this next)

	newUser, token, err := h.service.Register(req)
	if err != nil {
		if errors.Is(err, ErrEmailAlreadyExists) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Email already exists",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to register user",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(user.LoginResponse{
		Token: token,
		User:  *newUser,
	})
}

// Login handler
// POST /api/auth/login
func (h *Handler) Login(c *fiber.Ctx) error {
	var req user.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	foundUser, token, err := h.service.Login(req)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid email or password",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to login",
		})
	}

	return c.JSON(user.LoginResponse{
		Token: token,
		User:  *foundUser,
	})
}

// GetMe handler - returns current authenticated user
// GET /api/auth/me
func (h *Handler) GetMe(c *fiber.Ctx) error {
	// Get user ID from context (set by auth middleware)
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	foundUser, err := h.service.GetUserByID(userID.(string))
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get user",
		})
	}

	return c.JSON(foundUser)
}

// Helper to extract token from Authorization header
func extractToken(c *fiber.Ctx) string {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return ""
	}

	// Format: "Bearer <token>"
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}

	return parts[1]
}
