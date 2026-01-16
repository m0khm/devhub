package message

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
)

// Client represents a WebSocket client
type Client struct {
	ID        string
	UserID    uuid.UUID
	TopicID   uuid.UUID
	Conn      *websocket.Conn
	Hub       *Hub
	Send      chan []byte
	mu        sync.Mutex
}

// Hub maintains active clients and broadcasts messages
type Hub struct {
	// Registered clients per topic
	topics map[uuid.UUID]map[*Client]bool

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Broadcast message to all clients in a topic
	broadcast chan *BroadcastMessage

	mu sync.RWMutex
}

type BroadcastMessage struct {
	TopicID uuid.UUID
	Data    []byte
}

// WebSocket message types
type WSMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type WSMessagePayload struct {
	Message MessageWithUser `json:"message"`
}

type WSTypingPayload struct {
	UserID uuid.UUID `json:"user_id"`
	Name   string    `json:"name"`
	IsTyping bool    `json:"is_typing"`
}

type WSReactionPayload struct {
	MessageID uuid.UUID       `json:"message_id"`
	Reactions []ReactionGroup `json:"reactions"`
}

// NewHub creates a new Hub
func NewHub() *Hub {
	return &Hub{
		topics:     make(map[uuid.UUID]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *BroadcastMessage, 256),
	}
}

// Run starts the hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if _, ok := h.topics[client.TopicID]; !ok {
				h.topics[client.TopicID] = make(map[*Client]bool)
			}
			h.topics[client.TopicID][client] = true
			h.mu.Unlock()
			log.Printf("Client %s registered to topic %s", client.ID, client.TopicID)

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.topics[client.TopicID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.Send)
					if len(clients) == 0 {
						delete(h.topics, client.TopicID)
					}
				}
			}
			h.mu.Unlock()
			log.Printf("Client %s unregistered from topic %s", client.ID, client.TopicID)

		case message := <-h.broadcast:
			h.mu.RLock()
			clients := h.topics[message.TopicID]
			h.mu.RUnlock()

			for client := range clients {
				select {
				case client.Send <- message.Data:
				default:
					close(client.Send)
					h.mu.Lock()
					delete(h.topics[message.TopicID], client)
					h.mu.Unlock()
				}
			}
		}
	}
}

// BroadcastToTopic sends a message to all clients in a topic
func (h *Hub) BroadcastToTopic(topicID uuid.UUID, msgType string, payload interface{}) error {
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	message := WSMessage{
		Type:    msgType,
		Payload: payloadJSON,
	}

	messageJSON, err := json.Marshal(message)
	if err != nil {
		return err
	}

	h.broadcast <- &BroadcastMessage{
		TopicID: topicID,
		Data:    messageJSON,
	}

	return nil
}

// ReadPump pumps messages from the websocket connection to the hub
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Parse incoming message
		var wsMsg WSMessage
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			log.Printf("Failed to parse WebSocket message: %v", err)
			continue
		}

		// Handle different message types
		switch wsMsg.Type {
		case "typing":
			// Broadcast typing indicator to other clients
			var typingPayload WSTypingPayload
			if err := json.Unmarshal(wsMsg.Payload, &typingPayload); err != nil {
				continue
			}
			typingPayload.UserID = c.UserID
			c.Hub.BroadcastToTopic(c.TopicID, "typing", typingPayload)

		case "ping":
			// Respond with pong
			c.Send <- []byte(`{"type":"pong"}`)
		}
	}
}

// WritePump pumps messages from the hub to the websocket connection
func (c *Client) WritePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to the current websocket message
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
