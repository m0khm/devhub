package user

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetByID(id uuid.UUID) (*User, error) {
	var foundUser User
	err := r.db.First(&foundUser, "id = ?", id).Error
	return &foundUser, err
}

func (r *Repository) Update(user *User) error {
	return r.db.Save(user).Error
}
