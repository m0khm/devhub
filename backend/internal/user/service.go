package user

import (
	"fmt"
	"strings"

	"gorm.io/gorm"
)

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
