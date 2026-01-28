package calendar

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

func (r *Repository) ListEvents(projectID uuid.UUID) ([]Event, error) {
	var events []Event
	err := r.db.
		Where("project_id = ?", projectID).
		Order("starts_at ASC").
		Find(&events).Error
	return events, err
}

func (r *Repository) CreateEvent(event *Event) error {
	return r.db.Create(event).Error
}

func (r *Repository) GetEventByID(eventID uuid.UUID) (*Event, error) {
	var event Event
	if err := r.db.First(&event, "id = ?", eventID).Error; err != nil {
		return nil, err
	}
	return &event, nil
}

func (r *Repository) UpdateEvent(event *Event) error {
	return r.db.Save(event).Error
}

func (r *Repository) DeleteEvent(eventID uuid.UUID) error {
	return r.db.Delete(&Event{}, "id = ?", eventID).Error
}
