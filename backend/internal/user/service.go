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
	if trimmed == "" {
		return []User{}, nil
	}

	like := fmt.Sprintf("%%%s%%", trimmed)
	var users []User
	if err := s.db.
		Where("email ILIKE ? OR name ILIKE ?", like, like).
		Order("name ASC").
		Limit(10).
		Find(&users).Error; err != nil {
		return nil, err
	}

	return users, nil
}

func (s *Service) UpdateUser(userID uuid.UUID, req UpdateUserRequest) (*User, error) {
	var foundUser User
	if err := s.db.First(&foundUser, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	if req.Name != nil {
		foundUser.Name = *req.Name
	}
	if req.AvatarURL != nil {
		foundUser.AvatarURL = req.AvatarURL
	}
	if req.Bio != nil {
		foundUser.Bio = req.Bio
	}
	if req.Company != nil {
		foundUser.Company = req.Company
	}
	if req.Location != nil {
		foundUser.Location = req.Location
	}
	if req.Phone != nil {
		foundUser.Phone = req.Phone
	}
	if req.Handle != nil {
		foundUser.Handle = req.Handle
	}

	if err := s.db.Save(&foundUser).Error; err != nil {
		return nil, err
	}

	return &foundUser, nil
}
