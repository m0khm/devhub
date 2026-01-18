package message

import (
	"errors"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/m0khm/devhub/backend/internal/notification"
	"github.com/m0khm/devhub/backend/pkg/validator"
)

type Handler struct {
	service             *Service
	wsHandler           *WSHandler // optional
	notificationService *notification.Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

// SetWSHandler sets the WebSocket handler (called from main.go)
func (h *Handler) SetWSHandler(wsHandler *WSHandler) {
	h.wsHandler = wsHandler
}

// SetNotificationService sets the notification service (called from main.go)
func (h *Handler) SetNotificationService(notificationService *notification.Service) {
	h.notificationService = notificationService
}

// Create message
// POST /api/topics/:topicId/messages
func (h *Handler) Create(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	topicID, err := uuid.Parse(c.Params("topicId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid topic ID",
		})
	}

	var req CreateMessageRequest
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

	message, err := h.service.Create(topicID, userID, req)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Not a project member",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create message",
		})
	}

	// Broadcast new message
	if h.wsHandler != nil {
		h.wsHandler.BroadcastNewMessage(message)
	}

	if h.notificationService != nil {
		notifications, err := h.notificationService.CreateMessageNotifications(
			topicID,
			userID,
			message.Content,
		)
		if err != nil {
			log.Printf("failed to create notifications for message %s: %v", message.ID, err)
		} else if h.wsHandler != nil {
			for _, item := range notifications {
				h.wsHandler.BroadcastNotificationCreated(topicID, item)
			}
		}
	}

	return c.Status(fiber.StatusCreated).JSON(message)
}

// Get messages by topic
// GET /api/topics/:topicId/messages?limit=50&offset=0&before=2024-01-01T00:00:00Z&query=search
func (h *Handler) GetByTopicID(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	topicID, err := uuid.Parse(c.Params("topicId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid topic ID",
		})
	}

	// Parse query params
	limit := 50
	if limitParam := c.Query("limit"); limitParam != "" {
		if l, err := strconv.Atoi(limitParam); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	offset := 0
	if offsetParam := c.Query("offset"); offsetParam != "" {
		if o, err := strconv.Atoi(offsetParam); err == nil && o >= 0 {
			offset = o
		}
	}

	var before *time.Time
	if beforeParam := c.Query("before"); beforeParam != "" {
		if t, err := time.Parse(time.RFC3339, beforeParam); err == nil {
			before = &t
		}
	}

	query := strings.TrimSpace(c.Query("query"))
	if query == "" {
		query = strings.TrimSpace(c.Query("q"))
	}

	var (
		messages []MessageWithUser
	)

	if query != "" {
		messages, err = h.service.SearchByTopicID(topicID, userID, query, limit)
	} else {
		messages, err = h.service.GetByTopicID(topicID, userID, limit, offset, before)
	}
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Not a project member",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get messages",
		})
	}

	return c.JSON(messages)
}

// Get pinned messages by topic
// GET /api/topics/:topicId/pins
func (h *Handler) GetPinnedByTopicID(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	topicID, err := uuid.Parse(c.Params("topicId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid topic ID",
		})
	}

	messages, err := h.service.GetPinnedByTopicID(topicID, userID)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Not a project member",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get pinned messages",
		})
	}

	return c.JSON(messages)
}

// Search messages
// GET /api/topics/:topicId/search?q=query
func (h *Handler) SearchMessages(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	topicID, err := uuid.Parse(c.Params("topicId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid topic ID",
		})
	}

	query := c.Query("q")
	if query == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Search query is required",
		})
	}

	// Search
	messages, err := h.service.SearchByTopicID(topicID, userID, query, 50)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Not a project member",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to search messages",
		})
	}

	return c.JSON(messages)
}

// Pin message
// POST /api/messages/:id/pin
func (h *Handler) PinMessage(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	messageID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid message ID",
		})
	}

	if err := h.service.PinMessage(messageID, userID); err != nil {
		if errors.Is(err, ErrMessageNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Message not found",
			})
		}
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Not a project member",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to pin message",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
	})
}

// Unpin message
// DELETE /api/messages/:id/pin
func (h *Handler) UnpinMessage(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	messageID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid message ID",
		})
	}

	if err := h.service.UnpinMessage(messageID, userID); err != nil {
		if errors.Is(err, ErrMessageNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Message not found",
			})
		}
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Not a project member",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to unpin message",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
	})
}

// Update message
// PUT /api/messages/:id
func (h *Handler) Update(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	messageID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid message ID",
		})
	}

	var req UpdateMessageRequest
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

	message, err := h.service.Update(messageID, userID, req)
	if err != nil {
		if errors.Is(err, ErrMessageNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Message not found",
			})
		}
		if errors.Is(err, ErrNotMessageAuthor) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Only message author can update",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update message",
		})
	}

	// Broadcast message update
	if h.wsHandler != nil {
		h.wsHandler.BroadcastMessageUpdate(message)
	}

	return c.JSON(message)
}

// Delete message
// DELETE /api/messages/:id
func (h *Handler) Delete(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	messageID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid message ID",
		})
	}

	// If we want to broadcast deletion we need topicID.
	// We try to read it before deleting.
	var topicID uuid.UUID
	if h.wsHandler != nil {
		if msg, err := h.service.repo.GetByID(messageID); err == nil {
			topicID = msg.TopicID
		}
	}

	if err := h.service.Delete(messageID, userID); err != nil {
		if errors.Is(err, ErrMessageNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Message not found",
			})
		}
		if errors.Is(err, ErrNotMessageAuthor) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Only message author or admin can delete",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete message",
		})
	}

	// Broadcast message deletion
	if h.wsHandler != nil && topicID != uuid.Nil {
		h.wsHandler.BroadcastMessageDelete(topicID, messageID)
	}

	return c.Status(fiber.StatusNoContent).Send(nil)
}

// Toggle reaction
// POST /api/messages/:id/reactions
// Body: {"emoji": "👍"}
func (h *Handler) ToggleReaction(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	messageID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid message ID",
		})
	}

	var req struct {
		Emoji string `json:"emoji" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Need topicID for ws broadcast
	var topicID uuid.UUID
	if h.wsHandler != nil {
		msg, err := h.service.repo.GetByID(messageID)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Message not found",
			})
		}
		topicID = msg.TopicID
	}

	if err := h.service.ToggleReaction(messageID, userID, req.Emoji); err != nil {
		if errors.Is(err, ErrMessageNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Message not found",
			})
		}
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Not a project member",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to toggle reaction",
		})
	}

	// Broadcast reaction update (best-effort)
	if h.wsHandler != nil && topicID != uuid.Nil {
		// NOTE: Если у тебя другая сигнатура — подгони под свою.
		if reactions, err := h.service.repo.GetReactions(messageID, userID); err == nil {
			h.wsHandler.BroadcastReactionUpdate(topicID, messageID, reactions)
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
	})
}

// Helper
func getUserIDFromContext(c *fiber.Ctx) (uuid.UUID, error) {
	userIDStr, ok := c.Locals("userID").(string)
	if !ok {
		return uuid.Nil, errors.New("user ID not found in context")
	}
	return uuid.Parse(userIDStr)
}
