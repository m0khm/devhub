package code

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/m0khm/devhub/backend/internal/project"
	"gorm.io/gorm"
)

var (
	ErrNotProjectMember = errors.New("not a project member")
	ErrRepoNotFound     = errors.New("repository not found")
	ErrFileNotFound     = errors.New("file not found")
)

type Service struct {
	repo        *RepositoryStore
	projectRepo *project.Repository
}

func NewService(repo *RepositoryStore, projectRepo *project.Repository) *Service {
	return &Service{repo: repo, projectRepo: projectRepo}
}

func (s *Service) ListRepos(projectID, userID uuid.UUID) ([]Repository, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	repos, err := s.repo.ListByProject(projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to list repos: %w", err)
	}
	return repos, nil
}

func (s *Service) CreateRepo(projectID, userID uuid.UUID, req CreateRepoRequest) (*Repository, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	repo := Repository{
		ProjectID:   projectID,
		Name:        req.Name,
		Description: req.Description,
	}

	if err := s.repo.Create(&repo); err != nil {
		return nil, fmt.Errorf("failed to create repo: %w", err)
	}

	return s.repo.GetByID(projectID, repo.ID)
}

func (s *Service) UpdateRepo(projectID, repoID, userID uuid.UUID, req UpdateRepoRequest) (*Repository, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	repo, err := s.repo.GetByID(projectID, repoID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRepoNotFound
		}
		return nil, fmt.Errorf("failed to get repo: %w", err)
	}

	if req.Name != nil {
		repo.Name = *req.Name
	}
	if req.Description != nil {
		repo.Description = req.Description
	}

	if err := s.repo.Update(repo); err != nil {
		return nil, fmt.Errorf("failed to update repo: %w", err)
	}

	return s.repo.GetByID(projectID, repoID)
}

func (s *Service) CreateFile(projectID, repoID, userID uuid.UUID, req CreateFileRequest) (*RepoFile, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	repo, err := s.repo.GetByID(projectID, repoID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRepoNotFound
		}
		return nil, fmt.Errorf("failed to get repo: %w", err)
	}

	content := ""
	if req.Content != nil {
		content = *req.Content
	}

	file := RepoFile{
		RepoID:   repo.ID,
		Path:     req.Path,
		Language: req.Language,
		Content:  content,
	}

	if err := s.repo.CreateFile(&file); err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}

	return s.repo.GetFileByID(repo.ID, file.ID)
}

func (s *Service) UpdateFile(projectID, repoID, fileID, userID uuid.UUID, req UpdateFileRequest) (*RepoFile, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	repo, err := s.repo.GetByID(projectID, repoID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRepoNotFound
		}
		return nil, fmt.Errorf("failed to get repo: %w", err)
	}

	file, err := s.repo.GetFileByID(repo.ID, fileID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrFileNotFound
		}
		return nil, fmt.Errorf("failed to get file: %w", err)
	}

	if req.Path != nil {
		file.Path = *req.Path
	}
	if req.Language != nil {
		file.Language = req.Language
	}
	if req.Content != nil {
		file.Content = *req.Content
	}

	if err := s.repo.UpdateFile(file); err != nil {
		return nil, fmt.Errorf("failed to update file: %w", err)
	}

	return s.repo.GetFileByID(repo.ID, file.ID)
}
