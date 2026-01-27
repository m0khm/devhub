package user

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/m0khm/devhub/backend/internal/auth"
	"github.com/m0khm/devhub/backend/internal/storage"
	"github.com/m0khm/devhub/backend/pkg/validator"
)

type Handler struct {
	service    *Service
	s3Client   *storage.S3Client
	uploadRoot string
}

func NewHandler(service *Service, s3Client *storage.S3Client) *Handler {
	return &Handler{
		service:    service,
		s3Client:   s3Client,
		uploadRoot: filepath.Join("uploads", "avatars"),
	}
}

// Search users by name or email
// GET /api/users?query=
func (h *Handler) Search(c *fiber.Ctx) error {
	query := strings.TrimSpace(c.Query("query"))
	if query == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Query is required",
		})
	}

	users, err := h.service.Search(query)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to search users",
		})
	}

	return c.JSON(users)
}

// UpdateMe updates current authenticated user
// PATCH /api/users/me
func (h *Handler) UpdateMe(c *fiber.Ctx) error {
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

	var req UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	req.Handle = NormalizeHandle(req.Handle)

	if errs := validator.Validate(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"details": errs,
		})
	}

	updatedUser, err := h.service.Update(userUUID, req)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update user",
		})
	}

	return c.JSON(updatedUser)
}

// UploadAvatar uploads a new avatar for the current user
// POST /api/users/me/avatar
func (h *Handler) UploadAvatar(c *fiber.Ctx) error {
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

	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No file provided",
		})
	}

	const maxSize = int64(5 * 1024 * 1024) // 5MB
	if file.Size > maxSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "File size exceeds 5MB limit",
		})
	}

	fileReader, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to read file",
		})
	}
	defer fileReader.Close()

	head := make([]byte, 512)
	n, _ := io.ReadFull(fileReader, head)
	head = head[:n]
	detectedType := http.DetectContentType(head)
	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = detectedType
	}

	if !strings.HasPrefix(detectedType, "image/") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Only image uploads are allowed",
		})
	}

	var avatarURL string
	if h.s3Client != nil && h.s3Client.IsReady() {
		reader := io.MultiReader(bytes.NewReader(head), fileReader)
		uploadResult, err := h.s3Client.Upload(context.Background(), reader, file.Filename, file.Size, contentType)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to upload avatar",
			})
		}
		avatarURL = uploadResult.URL
	} else {
		ext := filepath.Ext(file.Filename)
		if ext == "" {
			if exts, err := mime.ExtensionsByType(contentType); err == nil && len(exts) > 0 {
				ext = exts[0]
			}
		}
		if ext == "" {
			ext = ".png"
		}

		uploadDir := filepath.Join(h.uploadRoot, userUUID.String())
		if err := os.MkdirAll(uploadDir, 0o755); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to store avatar",
			})
		}

		filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
		dstPath := filepath.Join(uploadDir, filename)
		if err := c.SaveFile(file, dstPath); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to store avatar",
			})
		}

		avatarURL = fmt.Sprintf("/%s/%s/%s", h.uploadRoot, userUUID.String(), filename)
		avatarURL = filepath.ToSlash(avatarURL)
	}

	updatedUser, err := h.service.UpdateAvatar(userUUID, avatarURL)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update avatar",
		})
	}

	return c.JSON(updatedUser)
}

// DeleteMe soft deletes current authenticated user
// DELETE /api/users/me
func (h *Handler) DeleteMe(c *fiber.Ctx) error {
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

	if err := h.service.Delete(userUUID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete user",
		})
	}

	return c.Status(fiber.StatusNoContent).Send(nil)
}

// StartEmailChange sends a verification code to a new email
// POST /api/users/me/email
func (h *Handler) StartEmailChange(c *fiber.Ctx) error {
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

	var req ChangeEmailRequest
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

	resp, err := h.service.StartEmailChange(userUUID, req)
	if err != nil {
		switch {
		case errors.Is(err, auth.ErrInvalidCredentials):
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid password",
			})
		case errors.Is(err, auth.ErrEmailAlreadyExists):
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Email already exists",
			})
		case errors.Is(err, gorm.ErrRecordNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to start email change",
			})
		}
	}

	return c.JSON(resp)
}

// ConfirmEmailChange verifies the code and updates the email
// POST /api/users/me/email/confirm
func (h *Handler) ConfirmEmailChange(c *fiber.Ctx) error {
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

	var req ConfirmEmailChangeRequest
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

	updatedUser, token, err := h.service.ConfirmEmailChange(userUUID, req)
	if err != nil {
		switch {
		case errors.Is(err, auth.ErrEmailAlreadyExists):
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Email already exists",
			})
		case errors.Is(err, auth.ErrConfirmationNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Confirmation not found",
			})
		case errors.Is(err, auth.ErrCodeExpired):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Verification code expired",
			})
		case errors.Is(err, auth.ErrTooManyAttempts):
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Too many verification attempts",
			})
		case errors.Is(err, auth.ErrInvalidCode):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid verification code",
			})
		case errors.Is(err, gorm.ErrRecordNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to confirm email change",
			})
		}
	}

	return c.JSON(LoginResponse{
		Token: token,
		User:  *updatedUser,
	})
}
