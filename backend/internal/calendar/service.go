package calendar

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/m0khm/devhub/backend/internal/project"
)

var (
	ErrNotProjectMember = errors.New("not a project member")
	ErrEventNotFound    = errors.New("event not found")
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

func (s *Service) ListEvents(projectID, userID uuid.UUID) ([]Event, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	return s.repo.ListEvents(projectID)
}

func (s *Service) CreateEvent(projectID, userID uuid.UUID, req CreateEventRequest) (*Event, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	startsAt, err := time.Parse(time.RFC3339, req.StartsAt)
	if err != nil {
		return nil, fmt.Errorf("invalid starts_at: %w", err)
	}

	var endsAt *time.Time
	if req.EndsAt != nil && *req.EndsAt != "" {
		parsed, err := time.Parse(time.RFC3339, *req.EndsAt)
		if err != nil {
			return nil, fmt.Errorf("invalid ends_at: %w", err)
		}
		endsAt = &parsed
	}

	event := Event{
		ProjectID:   projectID,
		Title:       req.Title,
		Description: req.Description,
		StartsAt:    startsAt,
		EndsAt:      endsAt,
	}

	if err := s.repo.CreateEvent(&event); err != nil {
		return nil, fmt.Errorf("failed to create event: %w", err)
	}

	return &event, nil
}

func (s *Service) UpdateEvent(projectID, userID, eventID uuid.UUID, req UpdateEventRequest) (*Event, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	event, err := s.repo.GetEventByID(eventID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrEventNotFound
		}
		return nil, fmt.Errorf("failed to get event: %w", err)
	}
	if event.ProjectID != projectID {
		return nil, ErrEventNotFound
	}

	if req.Title != nil {
		event.Title = *req.Title
	}
	if req.Description != nil {
		event.Description = req.Description
	}
	if req.StartsAt != nil && *req.StartsAt != "" {
		parsed, err := time.Parse(time.RFC3339, *req.StartsAt)
		if err != nil {
			return nil, fmt.Errorf("invalid starts_at: %w", err)
		}
		event.StartsAt = parsed
	}
	if req.EndsAt != nil {
		if *req.EndsAt == "" {
			event.EndsAt = nil
		} else {
			parsed, err := time.Parse(time.RFC3339, *req.EndsAt)
			if err != nil {
				return nil, fmt.Errorf("invalid ends_at: %w", err)
			}
			event.EndsAt = &parsed
		}
	}

	if err := s.repo.UpdateEvent(event); err != nil {
		return nil, fmt.Errorf("failed to update event: %w", err)
	}

	return event, nil
}

func (s *Service) DeleteEvent(projectID, userID, eventID uuid.UUID) error {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return ErrNotProjectMember
	}

	event, err := s.repo.GetEventByID(eventID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrEventNotFound
		}
		return fmt.Errorf("failed to get event: %w", err)
	}
	if event.ProjectID != projectID {
		return ErrEventNotFound
	}

	return s.repo.DeleteEvent(eventID)
}
