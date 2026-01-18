package user

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Email          string    `json:"email" gorm:"uniqueIndex;not null"`
	PasswordHash   *string   `json:"-" gorm:"column:password_hash"`
	Name           string    `json:"name" gorm:"not null"`
	Handle         *string   `json:"handle" gorm:"column:handle;uniqueIndex"`
	AvatarURL      *string   `json:"avatar_url"`
	Bio            *string   `json:"bio" gorm:"type:text"`
	Company        *string   `json:"company"`
	Location       *string   `json:"location"`
	Phone          *string   `json:"phone"`
	Handle         *string   `json:"handle"`
	GitHubID       *string   `json:"github_id" gorm:"column:github_id;uniqueIndex"`
	GitHubUsername *string   `json:"github_username" gorm:"column:github_username"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Request/Response DTOs
type RegisterRequest struct {
	Email    string  `json:"email" validate:"required,email"`
	Password string  `json:"password" validate:"required,min=8"`
	Name     string  `json:"name" validate:"required,min=2"`
	Handle   *string `json:"handle" validate:"omitempty,min=2,max=32"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type UpdateUserRequest struct {
	Name      *string `json:"name" validate:"omitempty,min=2"`
	Handle    *string `json:"handle" validate:"omitempty,min=2,max=32"`
	AvatarURL *string `json:"avatar_url" validate:"omitempty,url"`
	Bio       *string `json:"bio" validate:"omitempty,max=500"`
	Company   *string `json:"company" validate:"omitempty,max=255"`
	Location  *string `json:"location" validate:"omitempty,max=255"`
	Phone     *string `json:"phone" validate:"omitempty,max=50"`
	Handle    *string `json:"handle" validate:"omitempty,max=50"`
}

func (User) TableName() string {
	return "users"
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
