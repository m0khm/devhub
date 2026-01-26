package community

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

func (s *Service) Search(query string) ([]Community, error) {
	trimmed := strings.TrimSpace(query)
	if trimmed == "" {
		return []Community{}, nil
	}

	like := fmt.Sprintf("%%%s%%", trimmed)
	var communities []Community
	if err := s.db.
		Where("name ILIKE ? OR description ILIKE ?", like, like).
		Order("name ASC").
		Limit(10).
		Find(&communities).Error; err != nil {
		return nil, err
	}

	return communities, nil
}
