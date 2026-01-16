package topic

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

// Create topic
func (r *Repository) Create(topic *Topic) error {
	return r.db.Create(topic).Error
}

// Get topic by ID
func (r *Repository) GetByID(id uuid.UUID) (*Topic, error) {
	var topic Topic
	err := r.db.First(&topic, "id = ?", id).Error
	return &topic, err
}

// Get topics by project ID
func (r *Repository) GetByProjectID(projectID uuid.UUID) ([]Topic, error) {
	var topics []Topic
	err := r.db.
		Where("project_id = ?", projectID).
		Order("position ASC, created_at ASC").
		Find(&topics).Error
	return topics, err
}

// Get topics with stats
func (r *Repository) GetByProjectIDWithStats(projectID uuid.UUID) ([]TopicWithStats, error) {
	var topics []TopicWithStats
	err := r.db.Table("topics").
		Select(`
			topics.*,
			COUNT(messages.id) as message_count,
			MAX(messages.created_at) as last_message_at
		`).
		Joins("LEFT JOIN messages ON messages.topic_id = topics.id").
		Where("topics.project_id = ?", projectID).
		Group("topics.id").
		Order("topics.position ASC, topics.created_at ASC").
		Scan(&topics).Error
	return topics, err
}

// Update topic
func (r *Repository) Update(topic *Topic) error {
	return r.db.Save(topic).Error
}

// Delete topic
func (r *Repository) Delete(id uuid.UUID) error {
	return r.db.Delete(&Topic{}, "id = ?", id).Error
}

// Reorder topics
func (r *Repository) UpdatePositions(updates []struct {
	ID       uuid.UUID
	Position int
}) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, update := range updates {
			if err := tx.Model(&Topic{}).
				Where("id = ?", update.ID).
				Update("position", update.Position).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
