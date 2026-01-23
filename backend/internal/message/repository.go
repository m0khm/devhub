package message

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// Create message
func (r *Repository) Create(message *Message) error {
	return r.db.Create(message).Error
}

// Get message by ID
func (r *Repository) GetByID(id uuid.UUID) (*Message, error) {
	var message Message
	err := r.db.First(&message, "id = ?", id).Error
	return &message, err
}

// Get message by ID with user info
func (r *Repository) GetByIDWithUser(id uuid.UUID) (*MessageWithUser, error) {
	var message MessageWithUser

	err := r.db.Table("messages").
		Select(`
			messages.*,
			users.id as "user__id",
			users.name as "user__name",
			users.email as "user__email",
			users.avatar_url as "user__avatar_url"
		`).
		Joins("LEFT JOIN users ON users.id = messages.user_id").
		Where("messages.id = ?", id).
		Take(&message).Error

	return &message, err
}

// Get messages by topic with pagination
func (r *Repository) GetByTopicID(topicID uuid.UUID, limit, offset int, before *time.Time) ([]MessageWithUser, error) {
	var messages []MessageWithUser

	query := r.db.Table("messages").
		Select(`
			messages.*,
			users.id as "user__id",
			users.name as "user__name",
			users.email as "user__email",
			users.avatar_url as "user__avatar_url"
		`).
		Joins("LEFT JOIN users ON users.id = messages.user_id").
		Where("messages.topic_id = ?", topicID)

	if before != nil {
		query = query.Where("messages.created_at < ?", before)
	}

	err := query.
		Order("messages.created_at DESC").
		Limit(limit).
		Offset(offset).
		Scan(&messages).Error

	return messages, err
}

// Update message
func (r *Repository) Update(message *Message) error {
	return r.db.Save(message).Error
}

// Delete message
func (r *Repository) Delete(id uuid.UUID) error {
	return r.db.Delete(&Message{}, "id = ?", id).Error
}

// Add reaction
func (r *Repository) AddReaction(reaction *MessageReaction) error {
	return r.db.Create(reaction).Error
}

// Remove reaction
func (r *Repository) RemoveReaction(messageID, userID uuid.UUID, emoji string) error {
	return r.db.
		Where("message_id = ? AND user_id = ? AND emoji = ?", messageID, userID, emoji).
		Delete(&MessageReaction{}).Error
}

// Get reactions for message
func (r *Repository) GetReactions(messageID uuid.UUID, currentUserID uuid.UUID) ([]ReactionGroup, error) {
	var reactions []struct {
		Emoji  string
		UserID uuid.UUID
	}

	err := r.db.Table("message_reactions").
		Select("emoji, user_id").
		Where("message_id = ?", messageID).
		Scan(&reactions).Error

	if err != nil {
		return nil, err
	}

	// Group by emoji
	groups := make(map[string]*ReactionGroup)
	for _, r := range reactions {
		if _, exists := groups[r.Emoji]; !exists {
			groups[r.Emoji] = &ReactionGroup{
				Emoji:   r.Emoji,
				Count:   0,
				Users:   []uuid.UUID{},
				HasSelf: false,
			}
		}
		groups[r.Emoji].Count++
		groups[r.Emoji].Users = append(groups[r.Emoji].Users, r.UserID)
		if r.UserID == currentUserID {
			groups[r.Emoji].HasSelf = true
		}
	}

	// Convert map to slice
	result := make([]ReactionGroup, 0, len(groups))
	for _, group := range groups {
		result = append(result, *group)
	}

	return result, nil
}

// Pin message
func (r *Repository) PinMessage(topicID, messageID uuid.UUID) error {
	return r.db.Exec(
		"INSERT INTO pinned_messages (topic_id, message_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
		topicID,
		messageID,
	).Error
}

// Unpin message
func (r *Repository) UnpinMessage(topicID, messageID uuid.UUID) error {
	return r.db.Exec(
		"DELETE FROM pinned_messages WHERE topic_id = ? AND message_id = ?",
		topicID,
		messageID,
	).Error
}

// Get pinned messages by topic
func (r *Repository) GetPinnedByTopicID(topicID uuid.UUID) ([]MessageWithUser, error) {
	var messages []MessageWithUser

	err := r.db.Table("pinned_messages").
		Select(`
			messages.*,
			users.id as "user__id",
			users.name as "user__name",
			users.email as "user__email",
			users.avatar_url as "user__avatar_url"
		`).
		Joins("JOIN messages ON messages.id = pinned_messages.message_id").
		Joins("LEFT JOIN users ON users.id = messages.user_id").
		Where("pinned_messages.topic_id = ?", topicID).
		Order("messages.created_at DESC").
		Scan(&messages).Error

	return messages, err
}

// Search messages
func (r *Repository) Search(topicID uuid.UUID, query string, limit int) ([]MessageWithUser, error) {
	var messages []MessageWithUser

	err := r.db.Table("messages").
		Select(`
			messages.*,
			users.id as "user__id",
			users.name as "user__name",
			users.email as "user__email",
			users.avatar_url as "user__avatar_url"
		`).
		Joins("LEFT JOIN users ON users.id = messages.user_id").
		Where("messages.topic_id = ?", topicID).
		Where("to_tsvector('english', messages.content) @@ plainto_tsquery('english', ?)", query).
		Order("messages.created_at DESC").
		Limit(limit).
		Scan(&messages).Error

	return messages, err
}
