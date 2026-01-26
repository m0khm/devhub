package user

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/m0khm/devhub/backend/internal/auth"
	"github.com/m0khm/devhub/backend/internal/mailer"
)

var ErrUserNotFound = errors.New("user not found")

type Service struct {
	db          *gorm.DB
	authService *auth.Service
	mailer      mailer.Sender
}

func NewService(db *gorm.DB, authService *auth.Service, mailerClient mailer.Sender) *Service {
	return &Service{
		db:          db,
		authService: authService,
		mailer:      mailerClient,
	}
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
		Where(
			"(email ILIKE ? OR name ILIKE ? OR handle ILIKE ? OR github_username ILIKE ?) AND is_deleted = false",
			like,
			like,
			like,
			like,
		).
		Order("name ASC").
		Limit(10).
		Find(&users).Error; err != nil {
		return nil, err
	}

	return users, nil
}

func (s *Service) Update(userID uuid.UUID, req UpdateUserRequest) (*User, error) {
	var foundUser User
	if err := s.db.First(&foundUser, "id = ? AND is_deleted = false", userID).Error; err != nil {
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
	now := time.Now()
	result := s.db.Model(&User{}).
		Where("id = ? AND is_deleted = false", userID).
		Updates(map[string]interface{}{
			"is_deleted": true,
			"deleted_at": now,
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (s *Service) StartEmailChange(userID uuid.UUID, req ChangeEmailRequest) (EmailChangeStartResponse, error) {
	var foundUser User
	if err := s.db.First(&foundUser, "id = ? AND is_deleted = false", userID).Error; err != nil {
		return EmailChangeStartResponse{}, err
	}

	if foundUser.PasswordHash == nil {
		return EmailChangeStartResponse{}, auth.ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*foundUser.PasswordHash), []byte(req.Password)); err != nil {
		return EmailChangeStartResponse{}, auth.ErrInvalidCredentials
	}

	if err := s.authService.EnsureEmailAvailable(req.NewEmail); err != nil {
		return EmailChangeStartResponse{}, err
	}

	confirmation, err := s.authService.UpsertConfirmation(req.NewEmail)
	if err != nil {
		return EmailChangeStartResponse{}, err
	}

	if err := s.mailer.SendVerificationCode(req.NewEmail, confirmation.Code); err != nil {
		return EmailChangeStartResponse{}, fmt.Errorf("failed to send verification code: %w", err)
	}

	return EmailChangeStartResponse{ExpiresAt: confirmation.ExpiresAt}, nil
}

func (s *Service) ConfirmEmailChange(userID uuid.UUID, req ConfirmEmailChangeRequest) (*User, string, error) {
	var foundUser User
	if err := s.db.First(&foundUser, "id = ? AND is_deleted = false", userID).Error; err != nil {
		return nil, "", err
	}

	if err := s.authService.EnsureEmailAvailable(req.NewEmail); err != nil {
		return nil, "", err
	}

	var confirmation auth.EmailConfirmation
	if err := s.db.Where("email = ?", req.NewEmail).First(&confirmation).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", auth.ErrConfirmationNotFound
		}
		return nil, "", fmt.Errorf("database error: %w", err)
	}

	if confirmation.ExpiresAt.Before(time.Now()) {
		return nil, "", auth.ErrCodeExpired
	}

	if confirmation.Attempts >= auth.MaxVerificationAttempts() {
		return nil, "", auth.ErrTooManyAttempts
	}

	if confirmation.Code != req.Code {
		confirmation.Attempts++
		if err := s.db.Save(&confirmation).Error; err != nil {
			return nil, "", fmt.Errorf("failed to update confirmation attempts: %w", err)
		}
		return nil, "", auth.ErrInvalidCode
	}

	var updatedUser *User
	var token string
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		foundUser.Email = req.NewEmail
		if err := tx.Save(&foundUser).Error; err != nil {
			return fmt.Errorf("failed to update user email: %w", err)
		}

		if err := tx.Delete(&confirmation).Error; err != nil {
			return fmt.Errorf("failed to delete confirmation: %w", err)
		}

		jwtToken, err := s.authService.GenerateToken(foundUser.ID, foundUser.Email)
		if err != nil {
			return fmt.Errorf("failed to generate token: %w", err)
		}

		updatedUser = &foundUser
		token = jwtToken
		return nil
	}); err != nil {
		return nil, "", err
	}

	return updatedUser, token, nil
}
