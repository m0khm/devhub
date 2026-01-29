package workspace

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

func (r *Repository) Create(workspace *Workspace) error {
	return r.db.Create(workspace).Error
}

func (r *Repository) AddMember(workspaceID, userID uuid.UUID, role string) error {
	member := WorkspaceMember{
		WorkspaceID: workspaceID,
		UserID:      userID,
		Role:        role,
	}
	return r.db.Create(&member).Error
}

func (r *Repository) GetByID(id uuid.UUID) (*Workspace, error) {
	var workspace Workspace
	err := r.db.First(&workspace, "id = ?", id).Error
	return &workspace, err
}

func (r *Repository) GetByUserID(userID uuid.UUID) ([]Workspace, error) {
	var workspaces []Workspace
	err := r.db.
		Distinct("workspaces.*").
		Joins("LEFT JOIN workspace_members ON workspace_members.workspace_id = workspaces.id").
		Where("workspaces.owner_id = ? OR workspace_members.user_id = ?", userID, userID).
		Find(&workspaces).Error
	return workspaces, err
}

func (r *Repository) IsUserMember(workspaceID, userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&WorkspaceMember{}).
		Where("workspace_id = ? AND user_id = ?", workspaceID, userID).
		Count(&count).Error
	return count > 0, err
}
