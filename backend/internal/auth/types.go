package auth

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	Email        string    `json:"email" gorm:"unique;not null"`
	Name         string    `json:"name"`
	Handle       *string   `json:"handle" gorm:"unique;not null"`
	AvatarURL    *string   `json:"avatar_url" gorm:"column:avatar_url"`
	PasswordHash *string   `json:"-" gorm:"column:password_hash"`
	CreatedAt    time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

type RegisterRequest struct {
	Email    string  `json:"email" validate:"required,email"`
	Password string  `json:"password" validate:"required,min=8"`
	Handle   *string `json:"handle" validate:"required,alphanum,min=3,max=20"`
	Name     string  `json:"name,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

func NormalizeHandle(handle *string) *string {
	if handle == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*handle)
	trimmed = strings.TrimPrefix(trimmed, "@")
	trimmed = strings.TrimSpace(trimmed)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}
