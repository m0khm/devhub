package message

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/m0khm/devhub/backend/internal/project"
	"github.com/m0khm/devhub/backend/internal/topic"
)

var (
	ErrMessageNotFound  = errors.New("message not found")
	ErrNotProjectMember = errors.New("not a project member")
	ErrNotMessageAuthor = errors.New("not message author")
)

type Service struct {
	repo        *Repository
	topicRepo   *topic.Repository
	projectRepo *project.Repository
}

func NewService(repo *Repository, topicRepo *topic.Repository, projectRepo *project.Repository) *Service {
	return &Service{
		repo:        repo,
		topicRepo:   topicRepo,
		projectRepo: projectRepo,
	}
}

// Create message
func (s *Service) Create(topicID, userID uuid.UUID, req CreateMessageRequest) (*MessageWithUser, error) {
	// Get topic to check project access
	topicObj, err := s.topicRepo.GetByID(topicID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("topic not found")
		}
		return nil, fmt.Errorf("failed to get topic: %w", err)
	}

	// Check if user is member
	isMember, err := s.projectRepo.IsUserMember(topicObj.ProjectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	messageType := req.Type
	if messageType == "" {
		messageType = "text"
	}

	message := Message{
		TopicID:  topicID,
		UserID:   &userID,
		Content:  req.Content,
		Type:     messageType,
		Metadata: req.Metadata,
		ParentID: req.ParentID,
	}

	if err := s.repo.Create(&message); err != nil {
		return nil, fmt.Errorf("failed to create message: %w", err)
	}

	// Return message with user info
	return s.GetByID(message.ID, userID)
}

// Get message by ID
func (s *Service) GetByID(messageID, currentUserID uuid.UUID) (*MessageWithUser, error) {
	message, err := s.repo.GetByID(messageID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrMessageNotFound
		}
		return nil, fmt.Errorf("failed to get message: %w", err)
	}

	// Check access
	topicObj, err := s.topicRepo.GetByID(message.TopicID)
	if err != nil {
		return nil, fmt.Errorf("failed to get topic: %w", err)
	}

	isMember, err := s.projectRepo.IsUserMember(topicObj.ProjectID, currentUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	// Get reactions
	reactions, err := s.repo.GetReactions(messageID, currentUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get reactions: %w", err)
	}

	// TODO: Fetch user info properly
	// For now, return basic message
	return &MessageWithUser{
		Message:   *message,
		Reactions: reactions,
	}, nil
}

// Get messages by topic
func (s *Service) GetByTopicID(topicID, userID uuid.UUID, limit, offset int, before *time.Time) ([]MessageWithUser, error) {
	// Check access
	topicObj, err := s.topicRepo.GetByID(topicID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("topic not found")
		}
		return nil, fmt.Errorf("failed to get topic: %w", err)
	}

	isMember, err := s.projectRepo.IsUserMember(topicObj.ProjectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	messages, err := s.repo.GetByTopicID(topicID, limit, offset, before)
	if err != nil {
		return nil, fmt.Errorf("failed to get messages: %w", err)
	}

	// Get reactions for each message
	for i := range messages {
		reactions, err := s.repo.GetReactions(messages[i].ID, userID)
		if err != nil {
			continue // Skip on error
		}
		messages[i].Reactions = reactions
	}

	return messages, nil
}

// Update message
func (s *Service) Update(messageID, userID uuid.UUID, req UpdateMessageRequest) (*MessageWithUser, error) {
	message, err := s.repo.GetByID(messageID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrMessageNotFound
		}
		return nil, fmt.Errorf("failed to get message: %w", err)
	}

	// Check if user is author
	if message.UserID == nil || *message.UserID != userID {
		return nil, ErrNotMessageAuthor
	}

	// Update content
	message.Content = req.Content
	if err := s.repo.Update(message); err != nil {
		return nil, fmt.Errorf("failed to update message: %w", err)
	}

	return s.GetByID(messageID, userID)
}

// Delete message
func (s *Service) Delete(messageID, userID uuid.UUID) error {
	message, err := s.repo.GetByID(messageID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrMessageNotFound
		}
		return fmt.Errorf("failed to get message: %w", err)
	}

	// Check if user is author or project owner/admin
	if message.UserID == nil || *message.UserID != userID {
		// Check if user is project owner/admin
		topicObj, err := s.topicRepo.GetByID(message.TopicID)
		if err != nil {
			return fmt.Errorf("failed to get topic: %w", err)
		}

		role, err := s.projectRepo.GetUserRole(topicObj.ProjectID, userID)
		if err != nil {
			return fmt.Errorf("failed to get user role: %w", err)
		}

		if role != "owner" && role != "admin" {
			return ErrNotMessageAuthor
		}
	}

	if err := s.repo.Delete(messageID); err != nil {
		return fmt.Errorf("failed to delete message: %w", err)
	}

	return nil
}

// Toggle reaction
func (s *Service) ToggleReaction(messageID, userID uuid.UUID, emoji string) error {
	// Check if message exists and user has access
	message, err := s.repo.GetByID(messageID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrMessageNotFound
		}
		return fmt.Errorf("failed to get message: %w", err)
	}

	topicObj, err := s.topicRepo.GetByID(message.TopicID)
	if err != nil {
		return fmt.Errorf("failed to get topic: %w", err)
	}

	isMember, err := s.projectRepo.IsUserMember(topicObj.ProjectID, userID)
	if err != nil {
		return fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return ErrNotProjectMember
	}

	// Check if reaction already exists
	reactions, err := s.repo.GetReactions(messageID, userID)
	if err != nil {
		return fmt.Errorf("failed to get reactions: %w", err)
	}

	var exists bool
	for _, r := range reactions {
		if r.Emoji == emoji && r.HasSelf {
			exists = true
			break
		}
	}

	if exists {
		// Remove reaction
		return s.repo.RemoveReaction(messageID, userID, emoji)
	} else {
		// Add reaction
		reaction := MessageReaction{
			MessageID: messageID,
			UserID:    userID,
			Emoji:     emoji,
		}
		return s.repo.AddReaction(&reaction)
	}
}
