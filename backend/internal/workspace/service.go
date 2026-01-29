package workspace

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/m0khm/devhub/backend/internal/project"
	"gorm.io/gorm"
)

var (
	ErrWorkspaceNotFound  = errors.New("workspace not found")
	ErrNotWorkspaceMember = errors.New("not a workspace member")
)

type Service struct {
	repo           *Repository
	projectService *project.Service
}

func NewService(repo *Repository, projectService *project.Service) *Service {
	return &Service{repo: repo, projectService: projectService}
}

func (s *Service) Create(userID uuid.UUID, req CreateWorkspaceRequest) (*Workspace, error) {
	workspace := Workspace{
		Name:        req.Name,
		Description: req.Description,
		OwnerID:     userID,
	}

	err := s.repo.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&workspace).Error; err != nil {
			return fmt.Errorf("failed to create workspace: %w", err)
		}

		member := WorkspaceMember{
			WorkspaceID: workspace.ID,
			UserID:      userID,
			Role:        "owner",
		}
		if err := tx.Create(&member).Error; err != nil {
			return fmt.Errorf("failed to add workspace owner: %w", err)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &workspace, nil
}

func (s *Service) GetUserWorkspaces(userID uuid.UUID) ([]Workspace, error) {
	workspaces, err := s.repo.GetByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get workspaces: %w", err)
	}
	return workspaces, nil
}

func (s *Service) GetProjects(workspaceID, userID uuid.UUID) ([]project.Project, error) {
	if _, err := s.repo.GetByID(workspaceID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceNotFound
		}
		return nil, fmt.Errorf("failed to get workspace: %w", err)
	}

	isMember, err := s.repo.IsUserMember(workspaceID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check workspace membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotWorkspaceMember
	}

	var projects []project.Project
	if err := s.repo.db.Where("workspace_id = ?", workspaceID).Find(&projects).Error; err != nil {
		return nil, fmt.Errorf("failed to get workspace projects: %w", err)
	}

	return projects, nil
}

func (s *Service) CreateProject(workspaceID, userID uuid.UUID, req project.CreateProjectRequest) (*project.Project, error) {
	if _, err := s.repo.GetByID(workspaceID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceNotFound
		}
		return nil, fmt.Errorf("failed to get workspace: %w", err)
	}

	isMember, err := s.repo.IsUserMember(workspaceID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check workspace membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotWorkspaceMember
	}

	project, err := s.projectService.CreateInWorkspace(userID, workspaceID, req)
	if err != nil {
		return nil, err
	}

	return project, nil
}
