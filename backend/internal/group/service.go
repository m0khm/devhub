package group

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

func (s *Service) Search(query string) ([]Group, error) {
	trimmed := strings.TrimSpace(query)
	if trimmed == "" {
		return []Group{}, nil
	}

	like := fmt.Sprintf("%%%s%%", trimmed)
	var groups []Group
	if err := s.db.
		Where("name ILIKE ? OR description ILIKE ?", like, like).
		Order("name ASC").
		Limit(10).
		Find(&groups).Error; err != nil {
		return nil, err
	}

	return groups, nil
}
