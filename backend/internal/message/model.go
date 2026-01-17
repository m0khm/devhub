package message

import (
	"time"

	"github.com/google/uuid"
)

type Message struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	TopicID   uuid.UUID  `json:"topic_id" gorm:"not null"`
	UserID    *uuid.UUID `json:"user_id"` // NULL for system messages
	Content   string     `json:"content" gorm:"not null"`
	Type      string     `json:"type" gorm:"not null;default:'text'"` // text, file, system, code, integration
	Metadata  *string    `json:"metadata" gorm:"type:jsonb"`           // For files, code blocks, etc
	ParentID  *uuid.UUID `json:"parent_id"`                            // For threads
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

type File struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	MessageID  uuid.UUID `json:"message_id" gorm:"not null"`
	Filename   string    `json:"filename" gorm:"not null"`
	FileSize   int64     `json:"file_size" gorm:"not null"`
	MimeType   string    `json:"mime_type" gorm:"not null"`
	StorageKey string    `json:"storage_key" gorm:"not null"`
	UploadedBy uuid.UUID `json:"uploaded_by" gorm:"not null"`
	CreatedAt  time.Time `json:"created_at"`
}

func (File) TableName() string {
	return "files"
}

type MessageReaction struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	MessageID uuid.UUID `json:"message_id" gorm:"not null"`
	UserID    uuid.UUID `json:"user_id" gorm:"not null"`
	Emoji     string    `json:"emoji" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
}

// DTOs
type CreateMessageRequest struct {
	Content  string     `json:"content" validate:"required,min=1,max=10000"`
	Type     string     `json:"type" validate:"omitempty,oneof=text file system code integration"`
	Metadata *string    `json:"metadata"`
	ParentID *uuid.UUID `json:"parent_id"`
}

type UpdateMessageRequest struct {
	Content string `json:"content" validate:"required,min=1,max=10000"`
}

type MessageWithUser struct {
	Message
	User *struct {
		ID        uuid.UUID `json:"id"`
		Name      string    `json:"name"`
		Email     string    `json:"email"`
		AvatarURL *string   `json:"avatar_url"`
	} `json:"user,omitempty"`
	Reactions []ReactionGroup `json:"reactions,omitempty"`
}

type ReactionGroup struct {
	Emoji  string      `json:"emoji"`
	Count  int         `json:"count"`
	Users  []uuid.UUID `json:"users"` // User IDs who reacted
	HasSelf bool       `json:"has_self"` // Did current user react with this emoji
}

func (Message) TableName() string {
	return "messages"
}

func (MessageReaction) TableName() string {
	return "message_reactions"
}
