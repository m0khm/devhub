package topic

import (
	"time"

	"github.com/google/uuid"
)

type Topic struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ProjectID   uuid.UUID  `json:"project_id" gorm:"not null"`
	Name        string     `json:"name" gorm:"not null"`
	Description *string    `json:"description"`
	Type        string     `json:"type" gorm:"not null;default:'chat'"` // chat, code, deploy, bugs, planning, custom
	Icon        *string    `json:"icon"`                                 // emoji
	Position    int        `json:"position" gorm:"not null;default:0"`
	CreatedBy   uuid.UUID  `json:"created_by" gorm:"not null"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// DTOs
type CreateTopicRequest struct {
	Name        string  `json:"name" validate:"required,min=2,max=100"`
	Description *string `json:"description" validate:"omitempty,max=500"`
	Type        string  `json:"type" validate:"required,oneof=chat code deploy bugs planning custom"`
	Icon        *string `json:"icon" validate:"omitempty,max=10"`
}

type UpdateTopicRequest struct {
	Name        *string `json:"name" validate:"omitempty,min=2,max=100"`
	Description *string `json:"description" validate:"omitempty,max=500"`
	Icon        *string `json:"icon" validate:"omitempty,max=10"`
	Position    *int    `json:"position"`
}

type TopicWithStats struct {
	Topic
	MessageCount  int       `json:"message_count"`
	LastMessageAt *time.Time `json:"last_message_at"`
}

func (Topic) TableName() string {
	return "topics"
}
