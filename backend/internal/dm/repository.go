package dm

import (
	"log"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/m0khm/devhub/backend/internal/topic"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetThreadByUsers(projectID, userID, otherUserID uuid.UUID) (*DirectMessageThread, error) {
	var thread DirectMessageThread
	err := r.db.Table("topics").
		Select(`
			topics.*,
			users.id as "user__id",
			users.email as "user__email",
			users.name as "user__name",
			users.handle as "user__handle",
			users.avatar_url as "user__avatar_url"
		`).
		Joins("JOIN direct_participants dp_self ON dp_self.topic_id = topics.id AND dp_self.user_id = ?", userID).
		Joins("JOIN direct_participants dp_other ON dp_other.topic_id = topics.id AND dp_other.user_id = ?", otherUserID).
		Joins("JOIN users ON users.id = dp_other.user_id").
		Where("topics.project_id = ? AND topics.type = 'direct'", projectID).
		Take(&thread).Error
	if err != nil {
		log.Printf("dm repo: GetThreadByUsers failed project %s users %s/%s: %v", projectID, userID, otherUserID, err)
		return nil, err
	}
	return &thread, nil
}

func (r *Repository) ListThreads(projectID, userID uuid.UUID) ([]DirectMessageThread, error) {
	var threads []DirectMessageThread
	err := r.db.Table("topics").
		Select(`
			topics.*,
			users.id as "user__id",
			users.email as "user__email",
			users.name as "user__name",
			users.handle as "user__handle",
			users.avatar_url as "user__avatar_url"
		`).
		Joins("JOIN direct_participants dp_self ON dp_self.topic_id = topics.id AND dp_self.user_id = ?", userID).
		Joins("JOIN direct_participants dp_other ON dp_other.topic_id = topics.id AND dp_other.user_id <> ?", userID).
		Joins("JOIN users ON users.id = dp_other.user_id").
		Where("topics.project_id = ? AND topics.type = 'direct'", projectID).
		Order("topics.updated_at DESC").
		Scan(&threads).Error
	if err != nil {
		log.Printf("dm repo: ListThreads failed project %s user %s: %v", projectID, userID, err)
		return nil, err
	}
	return threads, nil
}

func (r *Repository) CreateThread(projectID, userID, otherUserID uuid.UUID, threadName string) (*topic.Topic, error) {
	var created topic.Topic
	err := r.db.Transaction(func(tx *gorm.DB) error {
		newTopic := topic.Topic{
			ProjectID: projectID,
			Name:      threadName,
			Type:      "direct",
			CreatedBy: userID,
		}
		if err := tx.Create(&newTopic).Error; err != nil {
			return err
		}

		participants := []DirectParticipant{
			{
				TopicID: newTopic.ID,
				UserID:  userID,
			},
			{
				TopicID: newTopic.ID,
				UserID:  otherUserID,
			},
		}
		if err := tx.Create(&participants).Error; err != nil {
			return err
		}

		created = newTopic
		return nil
	})
	if err != nil {
		log.Printf("dm repo: CreateThread failed project %s users %s/%s: %v", projectID, userID, otherUserID, err)
		return nil, err
	}
	return &created, nil
}

func (r *Repository) GetUserSummary(userID uuid.UUID) (*UserSummary, error) {
	var user UserSummary
	err := r.db.Table("users").
		Select("id, email, name, handle, avatar_url").
		Where("id = ?", userID).
		Take(&user).Error
	if err != nil {
		log.Printf("dm repo: GetUserSummary failed user %s: %v", userID, err)
		return nil, err
	}
	return &user, nil
}
