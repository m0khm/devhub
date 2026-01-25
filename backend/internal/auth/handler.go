package auth

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/m0khm/devhub/backend/internal/user"
	"github.com/m0khm/devhub/backend/pkg/validator"
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
	req.Handle = user.NormalizeHandle(req.Handle)

	// Validate request
	if errs := validator.Validate(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"details": errs,
		})
	}

	result, err := h.service.StartRegistration(req)
	if err != nil {
		if errors.Is(err, ErrEmailAlreadyExists) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Email already exists",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to start registration",
		})
	}

	return c.Status(fiber.StatusAccepted).JSON(result)
}

// ConfirmRegister handler
// POST /api/auth/register/confirm
func (h *Handler) ConfirmRegister(c *fiber.Ctx) error {
	var req RegisterConfirmRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}
	req.Handle = user.NormalizeHandle(req.Handle)

	if errs := validator.Validate(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"details": errs,
		})
	}

	newUser, token, err := h.service.ConfirmRegistration(req)
	if err != nil {
		switch {
		case errors.Is(err, ErrEmailAlreadyExists):
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Email already exists",
			})
		case errors.Is(err, ErrConfirmationNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Confirmation not found",
			})
		case errors.Is(err, ErrCodeExpired):
			return c.Status(fiber.StatusGone).JSON(fiber.Map{
				"error": "Verification code expired",
			})
		case errors.Is(err, ErrTooManyAttempts):
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Too many verification attempts",
			})
		case errors.Is(err, ErrInvalidCode):
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid verification code",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to confirm registration",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(user.LoginResponse{
		Token: token,
		User:  *newUser,
	})
}

// ResendRegister handler
// POST /api/auth/register/resend
func (h *Handler) ResendRegister(c *fiber.Ctx) error {
	var req RegisterResendRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if errs := validator.Validate(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"details": errs,
		})
	}

	result, err := h.service.ResendRegistrationCode(req.Email)
	if err != nil {
		if errors.Is(err, ErrEmailAlreadyExists) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Email already exists",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to resend code",
		})
	}

	return c.JSON(result)
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

	// Validate request
	if errs := validator.Validate(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"details": errs,
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
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	userIDStr, ok := userID.(string)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Invalid user ID format",
		})
	}

	userUUID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	foundUser, err := h.service.GetUserByID(userUUID)
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
