package user

import (
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrUserNotFound = errors.New("user not found")

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

func (s *Service) Search(query string) ([]User, error) {
	trimmed := strings.TrimSpace(query)
	if strings.HasPrefix(trimmed, "@") {
		trimmed = strings.TrimSpace(strings.TrimPrefix(trimmed, "@"))
	}
	if trimmed == "" {
		return []User{}, nil
	}

	like := fmt.Sprintf("%%%s%%", trimmed)
	var users []User
	if err := s.db.
		Where("email ILIKE ? OR name ILIKE ? OR handle ILIKE ? OR github_username ILIKE ?", like, like, like, like).
		Order("name ASC").
		Limit(10).
		Find(&users).Error; err != nil {
		return nil, err
	}

	return users, nil
}

func (s *Service) Update(userID uuid.UUID, req UpdateUserRequest) (*User, error) {
	var foundUser User
	if err := s.db.First(&foundUser, "id = ?", userID).Error; err != nil {
		return nil, err
	}

	if req.Name != nil {
		trimmed := strings.TrimSpace(*req.Name)
		if trimmed != "" {
			foundUser.Name = trimmed
		}
	}

	if req.Handle != nil {
		foundUser.Handle = NormalizeHandle(req.Handle)
	}

	if req.AvatarURL != nil {
		trimmed := strings.TrimSpace(*req.AvatarURL)
		if trimmed == "" {
			foundUser.AvatarURL = nil
		} else {
			foundUser.AvatarURL = &trimmed
		}
	}

	if err := s.db.Save(&foundUser).Error; err != nil {
		return nil, err
	}

	return &foundUser, nil
}

func (s *Service) Delete(userID uuid.UUID) error {
	result := s.db.Delete(&User{}, "id = ?", userID)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}
