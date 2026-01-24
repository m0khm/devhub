package project

import (
	"time"

	"github.com/google/uuid"
)

type ProjectInvitation struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ProjectID   uuid.UUID  `json:"project_id" gorm:"not null;index"`
	InviterID   uuid.UUID  `json:"inviter_id" gorm:"not null"`
	InviteeID   uuid.UUID  `json:"invitee_id" gorm:"not null"`
	Status      string     `json:"status" gorm:"not null;default:'pending'"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	RespondedAt *time.Time `json:"responded_at"`
}

type CreateProjectInvitationRequest struct {
	UserID uuid.UUID `json:"user_id" validate:"required,uuid"`
}

func (ProjectInvitation) TableName() string {
	return "project_invitations"
}
