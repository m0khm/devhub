package notification

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Notification struct {
	ID        uuid.UUID       `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID    uuid.UUID       `json:"user_id" gorm:"not null;index"`
	Title     string          `json:"title" gorm:"not null"`
	Body      string          `json:"body" gorm:"not null"`
	Link      *string         `json:"link"`
	Type      string          `json:"type" gorm:"not null;default:'message'"`
	Metadata  json.RawMessage `json:"metadata,omitempty" gorm:"type:jsonb;default:'{}'"`
	IsRead    bool            `json:"is_read" gorm:"not null;default:false"`
	ReadAt    *time.Time      `json:"read_at"`
	CreatedAt time.Time       `json:"created_at"`
}

func (Notification) TableName() string {
	return "notifications"
}
