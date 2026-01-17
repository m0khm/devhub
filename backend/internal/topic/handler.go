package topic

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/m0khm/devhub/backend/pkg/validator"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Create topic
// POST /api/projects/:projectId/topics
func (h *Handler) Create(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid project ID",
		})
	}

	var req CreateTopicRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate
	if errs := validator.Validate(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"details": errs,
		})
	}

	topic, err := h.service.Create(projectID, userID, req)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Not a project member",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create topic",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(topic)
}

// Get topics by project
// GET /api/projects/:projectId/topics?withStats=true
func (h *Handler) GetByProjectID(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid project ID",
		})
	}

	// Check if withStats query param is present
	withStats := false
	if statsParam := c.Query("withStats"); statsParam != "" {
		withStats, _ = strconv.ParseBool(statsParam)
	}

	topics, err := h.service.GetByProjectID(projectID, userID, withStats)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Not a project member",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get topics",
		})
	}
	switch typed := topics.(type) {
	case []Topic:
		if typed == nil {
			topics = []Topic{}
		}
	case []TopicWithStats:
		if typed == nil {
			topics = []TopicWithStats{}
		}
	}

	return c.JSON(topics)
}

// Get topic by ID
// GET /api/topics/:id
func (h *Handler) GetByID(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	topicID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid topic ID",
		})
	}

	topic, err := h.service.GetByID(topicID, userID)
	if err != nil {
		if errors.Is(err, ErrTopicNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Topic not found",
			})
		}
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Not a project member",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get topic",
		})
	}

	return c.JSON(topic)
}

// Update topic
// PUT /api/topics/:id
func (h *Handler) Update(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	topicID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid topic ID",
		})
	}

	var req UpdateTopicRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate
	if errs := validator.Validate(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"details": errs,
		})
	}

	topic, err := h.service.Update(topicID, userID, req)
	if err != nil {
		if errors.Is(err, ErrTopicNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Topic not found",
			})
		}
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Not a project member",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update topic",
		})
	}

	return c.JSON(topic)
}

// Delete topic
// DELETE /api/topics/:id
func (h *Handler) Delete(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	topicID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid topic ID",
		})
	}

	if err := h.service.Delete(topicID, userID); err != nil {
		if errors.Is(err, ErrTopicNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Topic not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete topic",
		})
	}

	return c.Status(fiber.StatusNoContent).Send(nil)
}

// Helper
func getUserIDFromContext(c *fiber.Ctx) (uuid.UUID, error) {
	userIDStr, ok := c.Locals("userID").(string)
	if !ok {
		return uuid.Nil, errors.New("user ID not found in context")
	}
	return uuid.Parse(userIDStr)
}
