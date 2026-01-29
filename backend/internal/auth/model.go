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

type PasswordResetToken struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID    uuid.UUID  `json:"user_id" gorm:"type:uuid;not null;index"`
	CodeHash  string     `json:"code_hash" gorm:"not null"`
	ExpiresAt time.Time  `json:"expires_at" gorm:"not null"`
	UsedAt    *time.Time `json:"used_at"`
	RequestIP *string    `json:"request_ip"`
	CreatedAt time.Time  `json:"created_at"`
}

func (PasswordResetToken) TableName() string {
	return "password_reset_tokens"
}

type RegisterConfirmRequest struct {
	Email    string  `json:"email" validate:"required,email"`
	Password string  `json:"password" validate:"required,min=8"`
	Name     string  `json:"name" validate:"required,min=2"`
	Handle   *string `json:"handle" validate:"required,alphanum,min=3,max=20"`
	Code     string  `json:"code" validate:"required,len=6"`
}

type RegisterResendRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type RegisterStartResponse struct {
	ExpiresAt time.Time `json:"expires_at"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Code     string `json:"code" validate:"required,len=6"`
	Password string `json:"password" validate:"required,min=8"`
}
