package video

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

// CreateRoom creates a Jitsi room
// POST /api/topics/:topicId/video/room
func (h *Handler) CreateRoom(c *fiber.Ctx) error {
	topicID := c.Params("topicId")
	if _, err := uuid.Parse(topicID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid topic ID",
		})
	}

	// Generate random room name
	roomName := generateRoomName()

	// Jitsi domain (можно вынести в конфиг)
	jitsiDomain := "meet.jit.si"

	roomURL := fmt.Sprintf("https://%s/%s", jitsiDomain, roomName)

	return c.JSON(fiber.Map{
		"room_name": roomName,
		"room_url":  roomURL,
		"domain":    jitsiDomain,
	})
}

func generateRoomName() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return "devhub-" + hex.EncodeToString(bytes)
}
