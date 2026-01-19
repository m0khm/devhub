package project

import (
	"time"

	"github.com/google/uuid"
)

type Project struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Name        string    `json:"name" gorm:"not null"`
	Description *string   `json:"description"`
	AvatarURL   *string   `json:"avatar_url"`
	OwnerID     uuid.UUID `json:"owner_id" gorm:"not null"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ProjectMember struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ProjectID uuid.UUID `json:"project_id" gorm:"not null"`
	UserID    uuid.UUID `json:"user_id" gorm:"not null"`
	Role      string    `json:"role" gorm:"not null;default:'member'"` // owner, admin, member
	JoinedAt  time.Time `json:"joined_at"`
}

// DTOs
type CreateProjectRequest struct {
	Name        string  `json:"name" validate:"required,min=2,max=100"`
	Description *string `json:"description" validate:"omitempty,max=500"`
}

type UpdateProjectRequest struct {
	Name        *string `json:"name" validate:"omitempty,min=2,max=100"`
	Description *string `json:"description" validate:"omitempty,max=500"`
	AvatarURL   *string `json:"avatar_url" validate:"omitempty,url"`
}

type AddProjectMemberRequest struct {
	UserID uuid.UUID `json:"user_id" validate:"required,uuid"`
	Role   string    `json:"role" validate:"omitempty,oneof=admin member"`
}

type ProjectWithMembers struct {
	Project
	Members []ProjectMemberWithUser `json:"members"`
}

type ProjectMemberWithUser struct {
	ProjectMember
	User struct {
		ID        uuid.UUID `json:"id"`
		Email     string    `json:"email"`
		Name      string    `json:"name"`
		AvatarURL *string   `json:"avatar_url"`
	} `json:"user"`
}

func (Project) TableName() string {
	return "projects"
}

func (ProjectMember) TableName() string {
	return "project_members"
}
