package topic

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/m0khm/devhub/backend/internal/project"
)

var (
	ErrTopicNotFound    = errors.New("topic not found")
	ErrNotProjectMember = errors.New("not a project member")
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

// Create topic
func (s *Service) Create(projectID, userID uuid.UUID, req CreateTopicRequest) (*Topic, error) {
	// Check if user is member of project
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	topic := Topic{
		ProjectID:   projectID,
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
		Icon:        req.Icon,
		CreatedBy:   userID,
	}

	if err := s.repo.Create(&topic); err != nil {
		return nil, fmt.Errorf("failed to create topic: %w", err)
	}

	return &topic, nil
}

// Get topic by ID
func (s *Service) GetByID(topicID, userID uuid.UUID) (*Topic, error) {
	topic, err := s.repo.GetByID(topicID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTopicNotFound
		}
		return nil, fmt.Errorf("failed to get topic: %w", err)
	}

	// Check if user is member of the project
	isMember, err := s.projectRepo.IsUserMember(topic.ProjectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	return topic, nil
}

// Get topics by project
func (s *Service) GetByProjectID(projectID, userID uuid.UUID, withStats bool) (interface{}, error) {
	// Check if user is member
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	if withStats {
		topics, err := s.repo.GetByProjectIDWithStats(projectID)
		if err != nil {
			return nil, fmt.Errorf("failed to get topics with stats: %w", err)
		}
		return topics, nil
	}

	topics, err := s.repo.GetByProjectID(projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get topics: %w", err)
	}
	return topics, nil
}

// Update topic
func (s *Service) Update(topicID, userID uuid.UUID, req UpdateTopicRequest) (*Topic, error) {
	topic, err := s.repo.GetByID(topicID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTopicNotFound
		}
		return nil, fmt.Errorf("failed to get topic: %w", err)
	}

	// Check if user is member
	isMember, err := s.projectRepo.IsUserMember(topic.ProjectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	// Update fields
	if req.Name != nil {
		topic.Name = *req.Name
	}
	if req.Description != nil {
		topic.Description = req.Description
	}
	if req.Icon != nil {
		topic.Icon = req.Icon
	}
	if req.Position != nil {
		topic.Position = *req.Position
	}

	if err := s.repo.Update(topic); err != nil {
		return nil, fmt.Errorf("failed to update topic: %w", err)
	}

	return topic, nil
}

// Delete topic
func (s *Service) Delete(topicID, userID uuid.UUID) error {
	topic, err := s.repo.GetByID(topicID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrTopicNotFound
		}
		return fmt.Errorf("failed to get topic: %w", err)
	}

	// Check if user is owner or admin
	role, err := s.projectRepo.GetUserRole(topic.ProjectID, userID)
	if err != nil {
		return fmt.Errorf("failed to get user role: %w", err)
	}
	if role != "owner" && role != "admin" {
		return errors.New("only owner or admin can delete topics")
	}

	if err := s.repo.Delete(topicID); err != nil {
		return fmt.Errorf("failed to delete topic: %w", err)
	}

	return nil
}
