package kanban

import (
	"time"

	"github.com/google/uuid"
)

type Column struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ProjectID uuid.UUID `json:"project_id" gorm:"not null"`
	Title     string    `json:"title" gorm:"not null"`
	Position  int       `json:"position" gorm:"not null;default:0"`
	Tasks     []Task    `json:"tasks" gorm:"foreignKey:ColumnID"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Task struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ColumnID    uuid.UUID  `json:"column_id" gorm:"not null"`
	Title       string     `json:"title" gorm:"not null"`
	Description *string    `json:"description"`
	Assignee    *string    `json:"assignee"`
	Priority    string     `json:"priority" gorm:"not null;default:medium"`
	DueDate     *time.Time `json:"due_date"`
	Position    int        `json:"position" gorm:"not null;default:0"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type CreateColumnRequest struct {
	Title    string `json:"title" validate:"required"`
	Position *int   `json:"position"`
}

type UpdateColumnRequest struct {
	Title    *string `json:"title"`
	Position *int    `json:"position"`
}

type CreateTaskRequest struct {
	Title       string  `json:"title" validate:"required"`
	Description *string `json:"description"`
	Assignee    *string `json:"assignee"`
	Priority    *string `json:"priority"`
	DueDate     *string `json:"due_date"`
	Position    *int    `json:"position"`
}

type UpdateTaskRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Assignee    *string `json:"assignee"`
	Priority    *string `json:"priority"`
	DueDate     *string `json:"due_date"`
	Position    *int    `json:"position"`
	ColumnID    *string `json:"column_id"`
}

func (Column) TableName() string {
	return "kanban_columns"
}

func (Task) TableName() string {
	return "kanban_tasks"
}
