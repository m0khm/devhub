package topic

import (
	"time"

	"github.com/google/uuid"
)

type Topic struct {
	ID                 uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ProjectID          uuid.UUID `json:"project_id" gorm:"not null"`
	Name               string    `json:"name" gorm:"not null"`
	Description        *string   `json:"description"`
	Type               string    `json:"type" gorm:"not null;default:'chat'"` // chat, code, deploy, bugs, planning, custom, direct
	Icon               *string   `json:"icon"`                                // emoji
	AccessLevel        string    `json:"access_level" gorm:"not null;default:'members'"`
	Visibility         string    `json:"visibility" gorm:"not null;default:'visible'"`
	NotificationsMuted bool      `json:"notifications_muted" gorm:"not null;default:false"`
	Position           int       `json:"position" gorm:"not null;default:0"`
	CreatedBy          uuid.UUID `json:"created_by" gorm:"not null"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// DTOs
type CreateTopicRequest struct {
	Name               string  `json:"name" validate:"required,min=2,max=100"`
	Description        *string `json:"description" validate:"omitempty,max=500"`
	Type               string  `json:"type" validate:"required,oneof=chat code deploy bugs planning custom direct"`
	Icon               *string `json:"icon" validate:"omitempty,max=10"`
	AccessLevel        *string `json:"access_level" validate:"omitempty,oneof=members admins public"`
	Visibility         *string `json:"visibility" validate:"omitempty,oneof=visible hidden archived"`
	NotificationsMuted *bool   `json:"notifications_muted"`
}

type UpdateTopicRequest struct {
	Name               *string `json:"name" validate:"omitempty,min=2,max=100"`
	Description        *string `json:"description" validate:"omitempty,max=500"`
	Icon               *string `json:"icon" validate:"omitempty,max=10"`
	Position           *int    `json:"position"`
	AccessLevel        *string `json:"access_level" validate:"omitempty,oneof=members admins public"`
	Visibility         *string `json:"visibility" validate:"omitempty,oneof=visible hidden archived"`
	NotificationsMuted *bool   `json:"notifications_muted"`
}

type TopicWithStats struct {
	Topic
	MessageCount  int        `json:"message_count"`
	LastMessageAt *time.Time `json:"last_message_at"`
}

func (Topic) TableName() string {
	return "topics"
}
