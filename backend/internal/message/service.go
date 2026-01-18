package message

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/m0khm/devhub/backend/internal/notification"
	"github.com/m0khm/devhub/backend/internal/project"
	"github.com/m0khm/devhub/backend/internal/topic"
)

var (
	ErrMessageNotFound  = errors.New("message not found")
	ErrNotProjectMember = errors.New("not a project member")
	ErrNotMessageAuthor = errors.New("not message author")
	ErrUnknownCommand   = errors.New("unknown command")
	ErrInvalidCommand   = errors.New("invalid command")
)

type Service struct {
	repo             *Repository
	topicRepo        *topic.Repository
	projectRepo      *project.Repository
	notificationRepo *notification.Repository
}

func NewService(
	repo *Repository,
	topicRepo *topic.Repository,
	projectRepo *project.Repository,
	notificationRepo *notification.Repository,
) *Service {
	return &Service{
		repo:             repo,
		topicRepo:        topicRepo,
		projectRepo:      projectRepo,
		notificationRepo: notificationRepo,
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

	if command, isCommand := ParseCommand(req.Content); isCommand {
		switch command.Name {
		case "shrug":
			content := strings.TrimSpace(command.Args)
			if content == "" {
				req.Content = `¯\_(ツ)_/¯`
			} else {
				req.Content = fmt.Sprintf("%s ¯\\_(ツ)_/¯", content)
			}
			req.Type = "text"
		case "topic":
			newName := strings.TrimSpace(command.Args)
			if newName == "" {
				return nil, ErrInvalidCommand
			}
			topicObj.Name = newName
			if err := s.topicRepo.Update(topicObj); err != nil {
				return nil, fmt.Errorf("failed to update topic: %w", err)
			}
			systemMessage := Message{
				TopicID:  topicID,
				UserID:   nil,
				Content:  fmt.Sprintf("Topic renamed to \"%s\"", newName),
				Type:     "system",
				Metadata: nil,
				ParentID: nil,
			}
			if err := s.repo.Create(&systemMessage); err != nil {
				return nil, fmt.Errorf("failed to create system message: %w", err)
			}
			return s.GetByID(systemMessage.ID, userID)
		case "invite":
			target := strings.TrimSpace(command.Args)
			if target == "" {
				return nil, ErrInvalidCommand
			}
			systemMessage := Message{
				TopicID:  topicID,
				UserID:   nil,
				Content:  fmt.Sprintf("Invitation sent to %s", target),
				Type:     "system",
				Metadata: nil,
				ParentID: nil,
			}
			if err := s.repo.Create(&systemMessage); err != nil {
				return nil, fmt.Errorf("failed to create system message: %w", err)
			}
			return s.GetByID(systemMessage.ID, userID)
		default:
			return nil, ErrUnknownCommand
		}
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

	if err := s.createMentionNotifications(topicID, userID, message.ID, req.Metadata); err != nil {
		log.Printf("failed to create mention notifications: %v", err)
	}

	// Return message with user info
	return s.GetByID(message.ID, userID)
}

type mentionPayload struct {
	Mentions []struct {
		ID uuid.UUID `json:"id"`
	} `json:"mentions"`
}

func (s *Service) createMentionNotifications(
	topicID uuid.UUID,
	senderID uuid.UUID,
	messageID uuid.UUID,
	metadata *string,
) error {
	if metadata == nil || s.notificationRepo == nil {
		return nil
	}

	var payload mentionPayload
	if err := json.Unmarshal([]byte(*metadata), &payload); err != nil {
		return nil
	}

	if len(payload.Mentions) == 0 {
		return nil
	}

	seen := make(map[uuid.UUID]struct{})
	userIDs := make([]uuid.UUID, 0, len(payload.Mentions))
	for _, mention := range payload.Mentions {
		if mention.ID == senderID {
			continue
		}
		if _, exists := seen[mention.ID]; exists {
			continue
		}
		seen[mention.ID] = struct{}{}
		userIDs = append(userIDs, mention.ID)
	}

	if len(userIDs) == 0 {
		return nil
	}

	return s.notificationRepo.CreateMentionNotifications(messageID, topicID, userIDs)
}

// Get message by ID
func (s *Service) GetByID(messageID, currentUserID uuid.UUID) (*MessageWithUser, error) {
	message, err := s.repo.GetByIDWithUser(messageID)
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

	message.Reactions = reactions

	return message, nil
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

// Search messages by topic
func (s *Service) SearchByTopicID(topicID, userID uuid.UUID, query string, limit int) ([]MessageWithUser, error) {
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

	messages, err := s.repo.Search(topicID, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to search messages: %w", err)
	}

	for i := range messages {
		reactions, err := s.repo.GetReactions(messages[i].ID, userID)
		if err != nil {
			continue
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

// Pin message
func (s *Service) PinMessage(messageID, userID uuid.UUID) error {
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

	if err := s.repo.PinMessage(message.TopicID, message.ID); err != nil {
		return fmt.Errorf("failed to pin message: %w", err)
	}

	return nil
}

// Unpin message
func (s *Service) UnpinMessage(messageID, userID uuid.UUID) error {
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

	if err := s.repo.UnpinMessage(message.TopicID, message.ID); err != nil {
		return fmt.Errorf("failed to unpin message: %w", err)
	}

	return nil
}

// Get pinned messages by topic
func (s *Service) GetPinnedByTopicID(topicID, userID uuid.UUID) ([]MessageWithUser, error) {
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

	messages, err := s.repo.GetPinnedByTopicID(topicID)
	if err != nil {
		return nil, fmt.Errorf("failed to get pinned messages: %w", err)
	}

	for i := range messages {
		reactions, err := s.repo.GetReactions(messages[i].ID, userID)
		if err != nil {
			continue
		}
		messages[i].Reactions = reactions
	}

	return messages, nil
}
