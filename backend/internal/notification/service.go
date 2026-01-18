package notification

import (
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/m0khm/devhub/backend/internal/project"
	"github.com/m0khm/devhub/backend/internal/topic"
)

type Service struct {
	repo        *Repository
	projectRepo *project.Repository
	topicRepo   *topic.Repository
}

func NewService(repo *Repository, projectRepo *project.Repository, topicRepo *topic.Repository) *Service {
	return &Service{
		repo:        repo,
		projectRepo: projectRepo,
		topicRepo:   topicRepo,
	}
}

func (s *Service) ListByUser(userID uuid.UUID, limit int, unreadOnly bool) ([]Notification, error) {
	return s.repo.ListByUser(userID, limit, unreadOnly)
}

func (s *Service) MarkRead(id, userID uuid.UUID) (*Notification, error) {
	notification, err := s.repo.MarkRead(id, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		return nil, fmt.Errorf("failed to mark notification read: %w", err)
	}
	return notification, nil
}

func (s *Service) CreateMessageNotifications(topicID, authorID uuid.UUID, content string) ([]Notification, error) {
	topicObj, err := s.topicRepo.GetByID(topicID)
	if err != nil {
		return nil, fmt.Errorf("failed to get topic: %w", err)
	}

	memberIDs, err := s.projectRepo.GetMemberIDs(topicObj.ProjectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get members: %w", err)
	}

	title := fmt.Sprintf("New message in #%s", topicObj.Name)
	body := truncateContent(content, 140)
	link := fmt.Sprintf("/projects/%s", topicObj.ProjectID)
	notifications := make([]Notification, 0, len(memberIDs))
	for _, memberID := range memberIDs {
		if memberID == authorID {
			continue
		}
		notifications = append(notifications, Notification{
			UserID: memberID,
			Title:  title,
			Body:   body,
			Link:   &link,
			Type:   "message",
		})
	}

	if err := s.repo.CreateMany(notifications); err != nil {
		return nil, fmt.Errorf("failed to create notifications: %w", err)
	}

	return notifications, nil
}

func truncateContent(content string, max int) string {
	trimmed := strings.TrimSpace(content)
	if len(trimmed) <= max {
		return trimmed
	}
	return strings.TrimSpace(trimmed[:max]) + "..."
}
