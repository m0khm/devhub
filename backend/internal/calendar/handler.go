package calendar

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) ListEvents(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	events, err := h.service.ListEvents(projectID, userID)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to load events"})
	}

	if events == nil {
		events = []Event{}
	}

	return c.JSON(events)
}

func (h *Handler) CreateEvent(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	var req CreateEventRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	if req.Title == "" || req.StartsAt == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Title and starts_at are required"})
	}

	event, err := h.service.CreateEvent(projectID, userID, req)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Failed to create event"})
	}

	return c.JSON(event)
}

func (h *Handler) UpdateEvent(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid event ID"})
	}

	var req UpdateEventRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	event, err := h.service.UpdateEvent(projectID, userID, eventID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotProjectMember):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		case errors.Is(err, ErrEventNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Event not found"})
		default:
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Failed to update event"})
		}
	}

	return c.JSON(event)
}

func (h *Handler) DeleteEvent(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	eventID, err := uuid.Parse(c.Params("eventId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid event ID"})
	}

	if err := h.service.DeleteEvent(projectID, userID, eventID); err != nil {
		switch {
		case errors.Is(err, ErrNotProjectMember):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		case errors.Is(err, ErrEventNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Event not found"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete event"})
		}
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func getUserIDFromContext(c *fiber.Ctx) (uuid.UUID, error) {
	userIDStr, ok := c.Locals("userID").(string)
	if !ok {
		return uuid.Nil, errors.New("user not authenticated")
	}
	return uuid.Parse(userIDStr)
}
