package admin

import (
	"errors"

	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	service *Service
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Login(c *fiber.Ctx) error {
	var payload LoginRequest
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	token, expiresAt, err := h.service.Login(payload.Username, payload.Password)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create session"})
	}

	return c.JSON(fiber.Map{
		"token":     token,
		"expiresAt": expiresAt,
	})
}

func (h *Handler) Dashboard(c *fiber.Ctx) error {
	response, err := h.service.GetDashboard()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to load admin dashboard",
		})
	}

	return c.JSON(response)
}
