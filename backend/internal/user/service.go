package user

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrUserNotFound = errors.New("user not found")

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Update(userID uuid.UUID, req UpdateUserRequest) (*User, error) {
	foundUser, err := s.repo.GetByID(userID)
	if err != nil {
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

	if err := s.repo.Update(foundUser); err != nil {
		return nil, err
	}

	return foundUser, nil
}
