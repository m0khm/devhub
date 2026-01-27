package project

import (
	"time"

	"github.com/google/uuid"
)

type Project struct {
	ID                 uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Name               string    `json:"name" gorm:"not null"`
	Description        *string   `json:"description"`
	AvatarURL          *string   `json:"avatar_url"`
	AccessLevel        string    `json:"access_level" gorm:"not null;default:'private'"`
	Visibility         string    `json:"visibility" gorm:"not null;default:'visible'"`
	NotificationsMuted bool      `json:"notifications_muted" gorm:"not null;default:false"`
	OwnerID            uuid.UUID `json:"owner_id" gorm:"not null"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
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
	Name               string  `json:"name" validate:"required,min=2,max=100"`
	Description        *string `json:"description" validate:"omitempty,max=500"`
	AccessLevel        *string `json:"access_level" validate:"omitempty,oneof=private members public"`
	Visibility         *string `json:"visibility" validate:"omitempty,oneof=visible hidden archived"`
	NotificationsMuted *bool   `json:"notifications_muted"`
}

type UpdateProjectRequest struct {
	Name               *string `json:"name" validate:"omitempty,min=2,max=100"`
	Description        *string `json:"description" validate:"omitempty,max=500"`
	AvatarURL          *string `json:"avatar_url" validate:"omitempty,url"`
	AccessLevel        *string `json:"access_level" validate:"omitempty,oneof=private members public"`
	Visibility         *string `json:"visibility" validate:"omitempty,oneof=visible hidden archived"`
	NotificationsMuted *bool   `json:"notifications_muted"`
}

type AddProjectMemberRequest struct {
	UserID uuid.UUID `json:"user_id" validate:"required,uuid"`
	Role   string    `json:"role" validate:"omitempty,oneof=admin member"`
}

type UpdateProjectMemberRoleRequest struct {
	Role string `json:"role" validate:"required,oneof=admin member"`
}

type ProjectWithMembers struct {
	Project
	Members []ProjectMemberWithUser `json:"members"`
}

type ProjectMemberWithUser struct {
	ProjectMember
	User struct {
		ID        uuid.UUID `json:"id" gorm:"column:user__id"`
		Email     string    `json:"email" gorm:"column:user__email"`
		Name      string    `json:"name" gorm:"column:user__name"`
		AvatarURL *string   `json:"avatar_url" gorm:"column:user__avatar_url"`
	} `json:"user" gorm:"embedded"`
}

func (Project) TableName() string {
	return "projects"
}

func (ProjectMember) TableName() string {
	return "project_members"
}
