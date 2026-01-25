package community

import (
	"time"

	"github.com/google/uuid"
)

type Community struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Name        string    `json:"name" gorm:"not null"`
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (Community) TableName() string {
	return "communities"
}
