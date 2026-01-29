package favorite

import (
	"errors"
	"fmt"

	"github.com/google/uuid"

	"github.com/m0khm/devhub/backend/internal/project"
)

var ErrNotProjectMember = errors.New("user is not a member of the project")

type Service struct {
	repo        *Repository
	projectRepo *project.Repository
}

func NewService(repo *Repository, projectRepo *project.Repository) *Service {
	return &Service{
		repo:        repo,
		projectRepo: projectRepo,
	}
}

func (s *Service) ListByProject(projectID, userID uuid.UUID) (*FavoritesResponse, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	topics, err := s.repo.ListTopics(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list favorite topics: %w", err)
	}

	messages, err := s.repo.ListMessages(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list favorite messages: %w", err)
	}

	return &FavoritesResponse{
		Topics:   topics,
		Messages: messages,
	}, nil
}
