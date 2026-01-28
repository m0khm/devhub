package kanban

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

func (r *Repository) ListColumns(projectID uuid.UUID) ([]Column, error) {
	var columns []Column
	err := r.db.
		Where("project_id = ?", projectID).
		Order("position ASC, created_at ASC").
		Preload("Tasks", func(db *gorm.DB) *gorm.DB {
			return db.Order("position ASC, created_at ASC")
		}).
		Find(&columns).Error
	return columns, err
}

func (r *Repository) CreateColumn(column *Column) error {
	return r.db.Create(column).Error
}

func (r *Repository) UpdateColumn(column *Column) error {
	return r.db.Save(column).Error
}

func (r *Repository) GetColumnByID(columnID uuid.UUID) (*Column, error) {
	var column Column
	if err := r.db.First(&column, "id = ?", columnID).Error; err != nil {
		return nil, err
	}
	return &column, nil
}

func (r *Repository) DeleteColumn(columnID uuid.UUID) error {
	return r.db.Delete(&Column{}, "id = ?", columnID).Error
}

func (r *Repository) CreateTask(task *Task) error {
	return r.db.Create(task).Error
}

func (r *Repository) GetTaskByID(taskID uuid.UUID) (*Task, error) {
	var task Task
	if err := r.db.First(&task, "id = ?", taskID).Error; err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *Repository) UpdateTask(task *Task) error {
	return r.db.Save(task).Error
}

func (r *Repository) DeleteTask(taskID uuid.UUID) error {
	return r.db.Delete(&Task{}, "id = ?", taskID).Error
}
