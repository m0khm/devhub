package favorite

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) ListTopics(projectID, userID uuid.UUID) ([]FavoriteTopic, error) {
	var topics []FavoriteTopic
	err := r.db.Table("favorite_topics").
		Select("topics.id, topics.name, topics.project_id, favorite_topics.created_at as favorited_at").
		Joins("JOIN topics ON topics.id = favorite_topics.topic_id").
		Where("favorite_topics.user_id = ? AND topics.project_id = ?", userID, projectID).
		Order("favorite_topics.created_at DESC").
		Scan(&topics).Error
	return topics, err
}

func (r *Repository) ListMessages(projectID, userID uuid.UUID) ([]FavoriteMessage, error) {
	var messages []FavoriteMessage
	err := r.db.Table("favorite_messages").
		Select("messages.id, messages.content, messages.topic_id, topics.name as topic_name, favorite_messages.created_at as favorited_at").
		Joins("JOIN messages ON messages.id = favorite_messages.message_id").
		Joins("JOIN topics ON topics.id = messages.topic_id").
		Where("favorite_messages.user_id = ? AND topics.project_id = ?", userID, projectID).
		Order("favorite_messages.created_at DESC").
		Scan(&messages).Error
	return messages, err
}
