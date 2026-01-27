package code

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/m0khm/devhub/backend/internal/project"
)

var ErrNotProjectMember = errors.New("not a project member")

type Service struct {
	projectRepo *project.Repository
}

func NewService(projectRepo *project.Repository) *Service {
	return &Service{projectRepo: projectRepo}
}

func (s *Service) ListBranches(projectID, userID uuid.UUID, repoID string) ([]Branch, error) {
	if err := s.ensureMember(projectID, userID); err != nil {
		return nil, err
	}
	return s.getRepoActivity(repoID).Branches, nil
}

func (s *Service) ListCommits(projectID, userID uuid.UUID, repoID string) ([]Commit, error) {
	if err := s.ensureMember(projectID, userID); err != nil {
		return nil, err
	}
	return s.getRepoActivity(repoID).Commits, nil
}

func (s *Service) ListChanges(projectID, userID uuid.UUID, repoID string) ([]Change, error) {
	if err := s.ensureMember(projectID, userID); err != nil {
		return nil, err
	}
	return s.getRepoActivity(repoID).Changes, nil
}

func (s *Service) ensureMember(projectID, userID uuid.UUID) error {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return ErrNotProjectMember
	}
	return nil
}

func (s *Service) getRepoActivity(repoID string) RepoActivity {
	if activity, ok := repoActivityData[repoID]; ok {
		return activity
	}
	return repoActivityData["default"]
}
