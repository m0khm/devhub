package dm

import (
	"time"

	"github.com/google/uuid"
)

type DirectParticipant struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	TopicID   uuid.UUID `json:"topic_id" gorm:"not null"`
	UserID    uuid.UUID `json:"user_id" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateDirectMessageRequest struct {
	ProjectID uuid.UUID `json:"project_id" validate:"required"`
	UserID    uuid.UUID `json:"user_id" validate:"required"`
}

type DirectMessageThread struct {
	ID          uuid.UUID  `json:"id"`
	ProjectID   uuid.UUID  `json:"project_id"`
	Name        string     `json:"name"`
	Description *string    `json:"description"`
	Type        string     `json:"type"`
	Icon        *string    `json:"icon"`
	Position    int        `json:"position"`
	CreatedBy   uuid.UUID  `json:"created_by"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	User        ThreadUser `json:"user"`
}

type ThreadUser struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	AvatarURL *string   `json:"avatar_url"`
}

type UserSummary struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	AvatarURL *string   `json:"avatar_url"`
}

func (DirectParticipant) TableName() string {
	return "direct_participants"
}
