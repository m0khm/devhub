package notification

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateMentionNotifications(messageID, topicID uuid.UUID, userIDs []uuid.UUID) error {
	if len(userIDs) == 0 {
		return nil
	}

	notifications := make([]Notification, 0, len(userIDs))
	for _, userID := range userIDs {
		notifications = append(notifications, Notification{
			UserID:    userID,
			MessageID: messageID,
			TopicID:   topicID,
			Type:      "mention",
		})
	}

	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "message_id"}, {Name: "type"}},
		DoNothing: true,
	}).Create(&notifications).Error
}
