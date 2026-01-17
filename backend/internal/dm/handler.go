package dm

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/m0khm/devhub/backend/pkg/validator"
	"gorm.io/gorm"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Create or get direct message thread
// POST /api/dm
// POST /api/projects/:projectId/dm
func (h *Handler) CreateOrGet(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	var req CreateDirectMessageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.ProjectID == uuid.Nil {
		projectID, err := uuid.Parse(c.Params("projectId"))
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid project ID",
			})
		}
		req.ProjectID = projectID
	}

	if errs := validator.Validate(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"details": errs,
		})
	}

	thread, err := h.service.CreateOrGetThread(req.ProjectID, userID, req.UserID)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotProjectMember):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Not a project member",
			})
		case errors.Is(err, ErrInvalidUser):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
			})
		case errors.Is(err, ErrInvalidThread):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid direct message",
			})
		case errors.Is(err, gorm.ErrRecordNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Direct thread not found",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to create direct thread",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(thread)
}

// List direct message threads
// GET /api/dm?projectId=...
// GET /api/projects/:projectId/dm
func (h *Handler) List(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	projectIDParam := c.Query("projectId")
	if projectIDParam == "" {
		projectIDParam = c.Params("projectId")
	}

	projectID, err := uuid.Parse(projectIDParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid project ID",
		})
	}

	threads, err := h.service.ListThreads(projectID, userID)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Not a project member",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to load direct threads",
		})
	}
	if threads == nil {
		threads = []DirectMessageThread{}
	}

	return c.JSON(threads)
}

func getUserIDFromContext(c *fiber.Ctx) (uuid.UUID, error) {
	userIDStr := c.Locals("userID")
	if userIDStr == nil {
		return uuid.Nil, errors.New("user not found in context")
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return uuid.Nil, err
	}

	return userID, nil
}
