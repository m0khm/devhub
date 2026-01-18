package notification

import (
	"time"

	"github.com/google/uuid"
)

type Notification struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID    uuid.UUID  `json:"user_id" gorm:"not null"`
	MessageID uuid.UUID  `json:"message_id" gorm:"not null"`
	TopicID   uuid.UUID  `json:"topic_id" gorm:"not null"`
	Type      string     `json:"type" gorm:"not null;default:'mention'"`
	ReadAt    *time.Time `json:"read_at"`
	CreatedAt time.Time  `json:"created_at"`
}

func (Notification) TableName() string {
	return "notifications"
}
