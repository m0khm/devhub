package calendar

import (
	"time"

	"github.com/google/uuid"
)

type Event struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ProjectID   uuid.UUID  `json:"project_id" gorm:"not null"`
	Title       string     `json:"title" gorm:"not null"`
	Description *string    `json:"description"`
	StartsAt    time.Time  `json:"starts_at" gorm:"not null"`
	EndsAt      *time.Time `json:"ends_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type CreateEventRequest struct {
	Title       string  `json:"title" validate:"required"`
	Description *string `json:"description"`
	StartsAt    string  `json:"starts_at" validate:"required"`
	EndsAt      *string `json:"ends_at"`
}

type UpdateEventRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	StartsAt    *string `json:"starts_at"`
	EndsAt      *string `json:"ends_at"`
}

func (Event) TableName() string {
	return "calendar_events"
}
