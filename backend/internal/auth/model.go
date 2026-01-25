package auth

import (
	"time"

	"github.com/google/uuid"
)

type EmailConfirmation struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Email     string    `json:"email" gorm:"uniqueIndex;not null"`
	Code      string    `json:"code" gorm:"not null"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null"`
	Attempts  int       `json:"attempts" gorm:"not null;default:0"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (EmailConfirmation) TableName() string {
	return "email_confirmations"
}

type RegisterConfirmRequest struct {
	Email    string  `json:"email" validate:"required,email"`
	Password string  `json:"password" validate:"required,min=8"`
	Name     string  `json:"name" validate:"required,min=2"`
	Handle   *string `json:"handle" validate:"omitempty,min=2,max=32"`
	Code     string  `json:"code" validate:"required,len=6"`
}

type RegisterResendRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type RegisterStartResponse struct {
	ExpiresAt time.Time `json:"expires_at"`
}
