package project

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrProjectNotFound   = errors.New("project not found")
	ErrNotProjectMember  = errors.New("not a project member")
	ErrNotProjectOwner   = errors.New("not a project owner")
	ErrAlreadyMember     = errors.New("user is already a member")
	ErrInvalidMemberRole = errors.New("invalid project member role")
	ErrCannotRemoveOwner = errors.New("cannot remove project owner")
	ErrCannotChangeOwner = errors.New("cannot change project owner role")
)

type Service struct {
	repo *Repository
}

type defaultTopic struct {
	ProjectID uuid.UUID `gorm:"column:project_id"`
	Name      string    `gorm:"column:name"`
	Type      string    `gorm:"column:type"`
	Position  int       `gorm:"column:position"`
	CreatedBy uuid.UUID `gorm:"column:created_by"`
}

func (defaultTopic) TableName() string {
	return "topics"
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// Create project
func (s *Service) Create(userID uuid.UUID, req CreateProjectRequest) (*Project, error) {
	return s.createProject(userID, nil, req)
}

func (s *Service) CreateInWorkspace(userID, workspaceID uuid.UUID, req CreateProjectRequest) (*Project, error) {
	return s.createProject(userID, &workspaceID, req)
}

func (s *Service) createProject(userID uuid.UUID, workspaceID *uuid.UUID, req CreateProjectRequest) (*Project, error) {
	accessLevel := "private"
	if req.AccessLevel != nil && *req.AccessLevel != "" {
		accessLevel = *req.AccessLevel
	}
	visibility := "visible"
	if req.Visibility != nil && *req.Visibility != "" {
		visibility = *req.Visibility
	}
	notificationsMuted := false
	if req.NotificationsMuted != nil {
		notificationsMuted = *req.NotificationsMuted
	}

	project := Project{
		Name:               req.Name,
		Description:        req.Description,
		AccessLevel:        accessLevel,
		Visibility:         visibility,
		NotificationsMuted: notificationsMuted,
		OwnerID:            userID,
		WorkspaceID:        workspaceID,
	}

	// Start transaction
	err := s.repo.db.Transaction(func(tx *gorm.DB) error {
		// Create project
		if err := tx.Create(&project).Error; err != nil {
			return fmt.Errorf("failed to create project: %w", err)
		}

		// Add owner as member with owner role
		member := ProjectMember{
			ProjectID: project.ID,
			UserID:    userID,
			Role:      "owner",
		}
		if err := tx.Create(&member).Error; err != nil {
			return fmt.Errorf("failed to add owner as member: %w", err)
		}

		defaultTopics := []defaultTopic{
			{ProjectID: project.ID, Name: "chat", Type: "chat", Position: 0, CreatedBy: userID},
			{ProjectID: project.ID, Name: "planning", Type: "planning", Position: 1, CreatedBy: userID},
			{ProjectID: project.ID, Name: "code", Type: "code", Position: 2, CreatedBy: userID},
			{ProjectID: project.ID, Name: "deploy", Type: "deploy", Position: 3, CreatedBy: userID},
			{ProjectID: project.ID, Name: "bugs", Type: "bugs", Position: 4, CreatedBy: userID},
		}
		if err := tx.Create(&defaultTopics).Error; err != nil {
			return fmt.Errorf("failed to create default topics: %w", err)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &project, nil
}

type workspaceMember struct {
	WorkspaceID uuid.UUID `gorm:"column:workspace_id"`
	UserID      uuid.UUID `gorm:"column:user_id"`
	Role        string    `gorm:"column:role"`
}

func (workspaceMember) TableName() string {
	return "workspace_members"
}

// Get project by ID
func (s *Service) GetByID(projectID, userID uuid.UUID) (*ProjectWithMembers, error) {
	// Check if user is member
	isMember, err := s.repo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	// Get project
	project, err := s.repo.GetByID(projectID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProjectNotFound
		}
		return nil, fmt.Errorf("failed to get project: %w", err)
	}

	// Get members
	members, err := s.repo.GetMembers(projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get members: %w", err)
	}

	return &ProjectWithMembers{
		Project: *project,
		Members: members,
	}, nil
}

// Get project members
func (s *Service) GetMembers(projectID, userID uuid.UUID) ([]ProjectMemberWithUser, error) {
	// Check if user is member
	isMember, err := s.repo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	members, err := s.repo.GetMembers(projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get members: %w", err)
	}

	return members, nil
}

// Get user's projects
func (s *Service) GetUserProjects(userID uuid.UUID) ([]Project, error) {
	projects, err := s.repo.GetByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get projects: %w", err)
	}
	return projects, nil
}

// Update project
func (s *Service) Update(projectID, userID uuid.UUID, req UpdateProjectRequest) (*Project, error) {
	// Check if user is owner
	role, err := s.repo.GetUserRole(projectID, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotProjectMember
		}
		return nil, fmt.Errorf("failed to get user role: %w", err)
	}
	if role != "owner" && role != "admin" {
		return nil, ErrNotProjectOwner
	}

	// Get project
	project, err := s.repo.GetByID(projectID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProjectNotFound
		}
		return nil, fmt.Errorf("failed to get project: %w", err)
	}

	// Update fields
	if req.Name != nil {
		project.Name = *req.Name
	}
	if req.Description != nil {
		project.Description = req.Description
	}
	if req.AvatarURL != nil {
		project.AvatarURL = req.AvatarURL
	}
	if req.AccessLevel != nil {
		project.AccessLevel = *req.AccessLevel
	}
	if req.Visibility != nil {
		project.Visibility = *req.Visibility
	}
	if req.NotificationsMuted != nil {
		project.NotificationsMuted = *req.NotificationsMuted
	}

	// Save
	if err := s.repo.Update(project); err != nil {
		return nil, fmt.Errorf("failed to update project: %w", err)
	}

	return project, nil
}

func (s *Service) JoinProject(projectID, userID uuid.UUID) (*Project, error) {
	project, err := s.repo.GetByID(projectID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProjectNotFound
		}
		return nil, fmt.Errorf("failed to get project: %w", err)
	}

	isMember, err := s.repo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if isMember {
		return nil, ErrAlreadyMember
	}

	err = s.repo.db.Transaction(func(tx *gorm.DB) error {
		if project.WorkspaceID != nil {
			var count int64
			if err := tx.Model(&workspaceMember{}).
				Where("workspace_id = ? AND user_id = ?", *project.WorkspaceID, userID).
				Count(&count).Error; err != nil {
				return fmt.Errorf("failed to check workspace membership: %w", err)
			}
			if count == 0 {
				member := workspaceMember{
					WorkspaceID: *project.WorkspaceID,
					UserID:      userID,
					Role:        "member",
				}
				if err := tx.Create(&member).Error; err != nil {
					return fmt.Errorf("failed to add workspace member: %w", err)
				}
			}
		}

		member := ProjectMember{
			ProjectID: projectID,
			UserID:    userID,
			Role:      "member",
		}
		if err := tx.Create(&member).Error; err != nil {
			return fmt.Errorf("failed to add project member: %w", err)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return project, nil
}

// Add member to project
func (s *Service) AddMember(projectID, userID uuid.UUID, req AddProjectMemberRequest) error {
	role, err := s.repo.GetUserRole(projectID, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotProjectMember
		}
		return fmt.Errorf("failed to get user role: %w", err)
	}
	if role != "owner" && role != "admin" {
		return ErrNotProjectOwner
	}

	newRole := req.Role
	if newRole == "" {
		newRole = "member"
	}
	if newRole != "member" && newRole != "admin" {
		return ErrInvalidMemberRole
	}

	isMember, err := s.repo.IsUserMember(projectID, req.UserID)
	if err != nil {
		return fmt.Errorf("failed to check membership: %w", err)
	}
	if isMember {
		return ErrAlreadyMember
	}

	if err := s.repo.AddMember(projectID, req.UserID, newRole); err != nil {
		return fmt.Errorf("failed to add member: %w", err)
	}

	return nil
}

// Delete project
func (s *Service) Delete(projectID, userID uuid.UUID) error {
	// Check if user is owner
	project, err := s.repo.GetByID(projectID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrProjectNotFound
		}
		return fmt.Errorf("failed to get project: %w", err)
	}

	if project.OwnerID != userID {
		return ErrNotProjectOwner
	}

	// Delete
	if err := s.repo.Delete(projectID); err != nil {
		return fmt.Errorf("failed to delete project: %w", err)
	}

	return nil
}

// Remove member from project
func (s *Service) RemoveMember(projectID, userID, memberID uuid.UUID) error {
	role, err := s.repo.GetUserRole(projectID, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotProjectMember
		}
		return fmt.Errorf("failed to get user role: %w", err)
	}
	if role != "owner" && role != "admin" {
		return ErrNotProjectOwner
	}

	targetRole, err := s.repo.GetUserRole(projectID, memberID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotProjectMember
		}
		return fmt.Errorf("failed to get member role: %w", err)
	}
	if targetRole == "owner" {
		return ErrCannotRemoveOwner
	}

	if err := s.repo.RemoveMember(projectID, memberID); err != nil {
		return fmt.Errorf("failed to remove member: %w", err)
	}

	return nil
}

// Update project member role
func (s *Service) UpdateMemberRole(projectID, userID, memberID uuid.UUID, role string) error {
	requesterRole, err := s.repo.GetUserRole(projectID, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotProjectMember
		}
		return fmt.Errorf("failed to get user role: %w", err)
	}
	if requesterRole != "owner" && requesterRole != "admin" {
		return ErrNotProjectOwner
	}

	if role != "member" && role != "admin" {
		return ErrInvalidMemberRole
	}

	targetRole, err := s.repo.GetUserRole(projectID, memberID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotProjectMember
		}
		return fmt.Errorf("failed to get member role: %w", err)
	}
	if targetRole == "owner" {
		return ErrCannotChangeOwner
	}

	if err := s.repo.UpdateMemberRole(projectID, memberID, role); err != nil {
		return fmt.Errorf("failed to update member role: %w", err)
	}

	return nil
}
