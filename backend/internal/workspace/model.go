package workspace

import (
	"time"

	"github.com/google/uuid"
)

type Workspace struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Name        string    `json:"name" gorm:"not null"`
	Description *string   `json:"description"`
	OwnerID     uuid.UUID `json:"owner_id" gorm:"not null"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type WorkspaceMember struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	WorkspaceID uuid.UUID `json:"workspace_id" gorm:"not null"`
	UserID      uuid.UUID `json:"user_id" gorm:"not null"`
	Role        string    `json:"role" gorm:"not null;default:'member'"`
	JoinedAt    time.Time `json:"joined_at"`
}

type CreateWorkspaceRequest struct {
	Name        string  `json:"name" validate:"required,min=2,max=100"`
	Description *string `json:"description" validate:"omitempty,max=500"`
}

func (Workspace) TableName() string {
	return "workspaces"
}

func (WorkspaceMember) TableName() string {
	return "workspace_members"
}
