package notification

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

func (r *Repository) Create(notification *Notification) error {
	return r.db.Create(notification).Error
}

func (r *Repository) CreateMany(notifications []Notification) error {
	if len(notifications) == 0 {
		return nil
	}
	return r.db.Create(&notifications).Error
}

func (r *Repository) ListByUser(userID uuid.UUID, limit int, unreadOnly bool) ([]Notification, error) {
	var notifications []Notification
	query := r.db.Where("user_id = ?", userID)
	if unreadOnly {
		query = query.Where("is_read = false")
	}

	err := query.
		Order("created_at DESC").
		Limit(limit).
		Find(&notifications).Error

	return notifications, err
}

func (r *Repository) MarkRead(id, userID uuid.UUID) (*Notification, error) {
	var notification Notification
	if err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&notification).Error; err != nil {
		return nil, err
	}

	if notification.IsRead {
		return &notification, nil
	}

	now := time.Now()
	if err := r.db.Model(&notification).Updates(map[string]interface{}{
		"is_read": true,
		"read_at": &now,
	}).Error; err != nil {
		return nil, err
	}

	notification.IsRead = true
	notification.ReadAt = &now
	return &notification, nil
}

func (r *Repository) CreateMentionNotifications(messageID uuid.UUID, topicID uuid.UUID, userIDs []uuid.UUID) error {
	link := "/topics/" + topicID.String()
	if messageID != uuid.Nil {
		link = link + "?message=" + messageID.String()
	}

	notifications := make([]Notification, 0, len(userIDs))
	for _, uid := range userIDs {
		l := link
		notifications = append(notifications, Notification{
			UserID: uid,
			Title:  "Mention",
			Body:   "You were mentioned in a message.",
			Link:   &l,
			Type:   "mention",
		})
	}

	return r.CreateMany(notifications)
}
