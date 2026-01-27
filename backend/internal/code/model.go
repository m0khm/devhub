package code

import (
	"time"

	"github.com/google/uuid"
)

type Repository struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	ProjectID   uuid.UUID  `json:"projectId" gorm:"type:uuid;index;not null"`
	Name        string     `json:"name" gorm:"type:varchar(255);not null"`
	Description *string    `json:"description,omitempty" gorm:"type:text"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	Files       []RepoFile `json:"files" gorm:"foreignKey:RepoID"`
}

func (Repository) TableName() string {
	return "project_repositories"
}

type RepoFile struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	RepoID    uuid.UUID `json:"repoId" gorm:"type:uuid;index;not null"`
	Path      string    `json:"path" gorm:"type:text;not null"`
	Language  *string   `json:"language,omitempty" gorm:"type:varchar(64)"`
	Content   string    `json:"content" gorm:"type:text;not null;default:''"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (RepoFile) TableName() string {
	return "project_repo_files"
}

type CreateRepoRequest struct {
	Name        string  `json:"name" validate:"required"`
	Description *string `json:"description"`
}

type UpdateRepoRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
}

type CreateFileRequest struct {
	Path     string  `json:"path" validate:"required"`
	Language *string `json:"language"`
	Content  *string `json:"content"`
}

type UpdateFileRequest struct {
	Path     *string `json:"path"`
	Language *string `json:"language"`
	Content  *string `json:"content"`
}
