package message

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/m0khm/devhub/backend/internal/storage"
)

type FileHandler struct {
	service   *Service
	wsHandler *WSHandler
	s3Client  *storage.S3Client
}

func NewFileHandler(service *Service, s3Client *storage.S3Client) *FileHandler {
	return &FileHandler{
		service:  service,
		s3Client: s3Client,
	}
}

func (h *FileHandler) SetWSHandler(wsHandler *WSHandler) {
	h.wsHandler = wsHandler
}

// UploadFile handles file upload
// POST /api/topics/:topicId/upload
func (h *FileHandler) UploadFile(c *fiber.Ctx) error {
	if h.s3Client == nil || !h.s3Client.IsReady() {
		log.Printf("file upload: storage unavailable for topic %s", c.Params("topicId"))
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Storage is unavailable, please try again later",
		})
	}

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

	// Get file from form
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No file provided",
		})
	}

	// Check file size (max 10MB)
	maxSize := int64(10 * 1024 * 1024) // 10MB
	if file.Size > maxSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "File size exceeds 10MB limit",
		})
	}

	// Open file
	fileReader, err := file.Open()
	if err != nil {
		log.Printf("file upload: failed to open file %s: %v", file.Filename, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to read file",
		})
	}
	defer fileReader.Close()

	// Upload to S3
	ctx := context.Background()
	uploadResult, err := h.s3Client.Upload(ctx, fileReader, file.Filename, file.Size, file.Header.Get("Content-Type"))
	if err != nil {
		log.Printf("file upload: failed to upload file %s: %v", file.Filename, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to upload file",
		})
	}

	// Create file metadata
	metadata := map[string]interface{}{
		"filename":  file.Filename,
		"size":      uploadResult.Size,
		"mime_type": uploadResult.MimeType,
		"url":       uploadResult.URL,
	}
	metadataJSON, _ := json.Marshal(metadata)
	metadataStr := string(metadataJSON)

	// Create message with file
	messageReq := CreateMessageRequest{
		Content:  fmt.Sprintf("📎 %s", file.Filename),
		Type:     "file",
		Metadata: &metadataStr,
	}

	message, err := h.service.Create(topicID, userID, messageReq)
	if err != nil {
		// Clean up uploaded file
		if deleteErr := h.s3Client.Delete(ctx, uploadResult.Key); deleteErr != nil {
			log.Printf("file upload: failed to delete uploaded file %s after message create error: %v", uploadResult.Key, deleteErr)
		}
		log.Printf("file upload: failed to create message for topic %s user %s: %v", topicID, userID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create message",
		})
	}

	// Broadcast via WebSocket
	if h.wsHandler != nil {
		h.wsHandler.BroadcastNewMessage(message)
	}

	return c.JSON(message)
}
