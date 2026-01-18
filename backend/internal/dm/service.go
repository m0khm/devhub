package dm

import (
	"errors"
	"fmt"
	"log"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/m0khm/devhub/backend/internal/project"
)

var (
	ErrNotProjectMember = errors.New("not a project member")
	ErrInvalidUser      = errors.New("invalid user")
	ErrInvalidThread    = errors.New("invalid direct thread")
)

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

func (s *Service) CreateOrGetThread(projectID, userID, otherUserID uuid.UUID) (*DirectMessageThread, error) {
	if userID == otherUserID {
		return nil, ErrInvalidThread
	}

	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		log.Printf("dm service: failed to check membership for user %s project %s: %v", userID, projectID, err)
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	otherMember, err := s.projectRepo.IsUserMember(projectID, otherUserID)
	if err != nil {
		log.Printf("dm service: failed to check membership for other user %s project %s: %v", otherUserID, projectID, err)
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !otherMember {
		return nil, ErrNotProjectMember
	}

	thread, err := s.repo.GetThreadByUsers(projectID, userID, otherUserID)
	if err == nil {
		return thread, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Printf("dm service: failed to get thread for project %s users %s/%s: %v", projectID, userID, otherUserID, err)
		return nil, fmt.Errorf("failed to get direct thread: %w", err)
	}

	otherUser, err := s.repo.GetUserSummary(otherUserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidUser
		}
		log.Printf("dm service: failed to load user %s: %v", otherUserID, err)
		return nil, fmt.Errorf("failed to load user: %w", err)
	}

	_, err = s.repo.CreateThread(projectID, userID, otherUserID, otherUser.Name)
	if err != nil {
		log.Printf("dm service: failed to create thread for project %s users %s/%s: %v", projectID, userID, otherUserID, err)
		return nil, fmt.Errorf("failed to create direct thread: %w", err)
	}

	createdThread, err := s.repo.GetThreadByUsers(projectID, userID, otherUserID)
	if err != nil {
		log.Printf("dm service: failed to fetch created thread for project %s users %s/%s: %v", projectID, userID, otherUserID, err)
		return nil, fmt.Errorf("failed to fetch direct thread: %w", err)
	}
	return createdThread, nil
}

func (s *Service) ListThreads(projectID, userID uuid.UUID) ([]DirectMessageThread, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		log.Printf("dm service: failed to check membership for list user %s project %s: %v", userID, projectID, err)
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	threads, err := s.repo.ListThreads(projectID, userID)
	if err != nil {
		log.Printf("dm service: failed to list threads for project %s user %s: %v", projectID, userID, err)
		return nil, fmt.Errorf("failed to list direct threads: %w", err)
	}
	return threads, nil
}
