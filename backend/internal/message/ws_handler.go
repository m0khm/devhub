package message

import (
	"log"

	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
)

type WSHandler struct {
	hub     *Hub
	service *Service
}

func NewWSHandler(hub *Hub, service *Service) *WSHandler {
	return &WSHandler{
		hub:     hub,
		service: service,
	}
}

// HandleWebSocket handles WebSocket connections
// GET /api/topics/:topicId/ws
func (h *WSHandler) HandleWebSocket(c *websocket.Conn) {
	// Get user ID from query params (set by middleware)
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		log.Printf("Invalid user ID: %v", err)
		c.Close()
		return
	}

	// Get topic ID from params
	topicIDStr := c.Params("topicId")
	topicID, err := uuid.Parse(topicIDStr)
	if err != nil {
		log.Printf("Invalid topic ID: %v", err)
		c.Close()
		return
	}

	// TODO: Check if user has access to topic
	// For now, we'll skip this check

	// Create client
	client := &Client{
		ID:      uuid.New().String(),
		UserID:  userID,
		TopicID: topicID,
		Conn:    c,
		Hub:     h.hub,
		Send:    make(chan []byte, 256),
	}

	// Register client
	h.hub.register <- client

	// Start pumps
	go client.WritePump()
	client.ReadPump() // This blocks until connection closes
}

// BroadcastNewMessage broadcasts a new message to all clients in the topic
func (h *WSHandler) BroadcastNewMessage(message *MessageWithUser) {
	payload := WSMessagePayload{
		Message: *message,
	}
	h.hub.BroadcastToTopic(message.TopicID, "new_message", payload)
}

// BroadcastMessageUpdate broadcasts message update
func (h *WSHandler) BroadcastMessageUpdate(message *MessageWithUser) {
	payload := WSMessagePayload{
		Message: *message,
	}
	h.hub.BroadcastToTopic(message.TopicID, "message_updated", payload)
}

// BroadcastMessageDelete broadcasts message deletion
func (h *WSHandler) BroadcastMessageDelete(topicID, messageID uuid.UUID) {
	payload := map[string]string{
		"message_id": messageID.String(),
	}
	h.hub.BroadcastToTopic(topicID, "message_deleted", payload)
}

// BroadcastReactionUpdate broadcasts reaction update
func (h *WSHandler) BroadcastReactionUpdate(topicID, messageID uuid.UUID, reactions []ReactionGroup) {
	payload := WSReactionPayload{
		MessageID: messageID,
		Reactions: reactions,
	}
	h.hub.BroadcastToTopic(topicID, "reaction_updated", payload)
}
