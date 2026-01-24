package project

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/m0khm/devhub/backend/internal/user"
)

var (
	ErrInvitationAlreadyExists = errors.New("invitation already exists")
	ErrInvitationNotFound      = errors.New("invitation not found")
	ErrInvitationNotPending    = errors.New("invitation not pending")
	ErrInvitationNotRecipient  = errors.New("invitation not recipient")
)

type InvitationService struct {
	repo     *Repository
	userRepo *user.Repository
}

func NewInvitationService(repo *Repository, userRepo *user.Repository) *InvitationService {
	return &InvitationService{
		repo:     repo,
		userRepo: userRepo,
	}
}

func (s *InvitationService) Create(projectID, inviterID uuid.UUID, req CreateProjectInvitationRequest) (*ProjectInvitation, error) {
	role, err := s.repo.GetUserRole(projectID, inviterID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotProjectMember
		}
		return nil, fmt.Errorf("failed to get inviter role: %w", err)
	}
	if role != "owner" && role != "admin" {
		return nil, ErrNotProjectOwner
	}

	if _, err := s.userRepo.GetByID(req.UserID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, user.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get invitee: %w", err)
	}

	isMember, err := s.repo.IsUserMember(projectID, req.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if isMember {
		return nil, ErrAlreadyMember
	}

	if _, err := s.repo.GetPendingInvitation(projectID, req.UserID); err == nil {
		return nil, ErrInvitationAlreadyExists
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check pending invitations: %w", err)
	}

	project, err := s.repo.GetByID(projectID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProjectNotFound
		}
		return nil, fmt.Errorf("failed to get project: %w", err)
	}

	invitation := &ProjectInvitation{
		ProjectID: projectID,
		InviterID: inviterID,
		InviteeID: req.UserID,
		Status:    "pending",
	}

	if err := s.repo.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(invitation).Error; err != nil {
			return err
		}

		metadata := map[string]string{
			"invitation_id": invitation.ID.String(),
			"project_id":    projectID.String(),
		}
		metadataBytes, err := json.Marshal(metadata)
		if err != nil {
			return err
		}
		if err := tx.Table("notifications").Create(map[string]interface{}{
			"user_id":  req.UserID,
			"title":    "Project invitation",
			"body":     fmt.Sprintf("You were invited to join %s.", project.Name),
			"type":     "invite",
			"metadata": metadataBytes,
		}).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		return nil, fmt.Errorf("failed to create invitation: %w", err)
	}

	return invitation, nil
}

func (s *InvitationService) Accept(invitationID, userID uuid.UUID) (*ProjectInvitation, error) {
	invitation, err := s.repo.GetInvitationByID(invitationID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvitationNotFound
		}
		return nil, fmt.Errorf("failed to get invitation: %w", err)
	}
	if invitation.InviteeID != userID {
		return nil, ErrInvitationNotRecipient
	}
	if invitation.Status != "pending" {
		return nil, ErrInvitationNotPending
	}

	isMember, err := s.repo.IsUserMember(invitation.ProjectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if isMember {
		return nil, ErrAlreadyMember
	}

	now := time.Now()
	if err := s.repo.db.Transaction(func(tx *gorm.DB) error {
		invitation.Status = "accepted"
		invitation.RespondedAt = &now
		if err := tx.Save(invitation).Error; err != nil {
			return err
		}

		member := ProjectMember{
			ProjectID: invitation.ProjectID,
			UserID:    userID,
			Role:      "member",
		}
		if err := tx.Create(&member).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		return nil, fmt.Errorf("failed to accept invitation: %w", err)
	}

	return invitation, nil
}

func (s *InvitationService) Decline(invitationID, userID uuid.UUID) (*ProjectInvitation, error) {
	invitation, err := s.repo.GetInvitationByID(invitationID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvitationNotFound
		}
		return nil, fmt.Errorf("failed to get invitation: %w", err)
	}
	if invitation.InviteeID != userID {
		return nil, ErrInvitationNotRecipient
	}
	if invitation.Status != "pending" {
		return nil, ErrInvitationNotPending
	}

	now := time.Now()
	invitation.Status = "declined"
	invitation.RespondedAt = &now
	if err := s.repo.UpdateInvitation(invitation); err != nil {
		return nil, fmt.Errorf("failed to decline invitation: %w", err)
	}

	return invitation, nil
}
