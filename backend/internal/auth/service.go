package auth

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/m0khm/devhub/backend/internal/mailer"
	"github.com/m0khm/devhub/backend/internal/metrics"
	"github.com/m0khm/devhub/backend/internal/user"
)

var (
	ErrInvalidCredentials   = errors.New("invalid email or password")
	ErrEmailAlreadyExists   = errors.New("email already exists")
	ErrUserNotFound         = errors.New("user not found")
	ErrInvalidCode          = errors.New("invalid verification code")
	ErrConfirmationNotFound = errors.New("confirmation not found")
	ErrCodeExpired          = errors.New("verification code expired")
	ErrTooManyAttempts      = errors.New("too many verification attempts")
)

type Service struct {
	db         *gorm.DB
	jwtManager *JWTManager
	mailer     mailer.Sender
}

const (
	verificationCodeLength  = 6
	verificationTTL         = 10 * time.Minute
	maxVerificationAttempts = 5
)

func MaxVerificationAttempts() int {
	return maxVerificationAttempts
}

func NewService(db *gorm.DB, jwtManager *JWTManager, mailerClient mailer.Sender) *Service {
	return &Service{
		db:         db,
		jwtManager: jwtManager,
		mailer:     mailerClient,
	}
}

// StartRegistration creates a pending confirmation and sends a code.
func (s *Service) StartRegistration(req user.RegisterRequest) (RegisterStartResponse, error) {
	if err := s.ensureEmailAvailable(req.Email); err != nil {
		return RegisterStartResponse{}, err
	}

	confirmation, err := s.upsertConfirmation(req.Email)
	if err != nil {
		return RegisterStartResponse{}, err
	}

	if err := s.mailer.SendVerificationCode(req.Email, confirmation.Code); err != nil {
		return RegisterStartResponse{}, fmt.Errorf("failed to send verification code: %w", err)
	}

	return RegisterStartResponse{ExpiresAt: confirmation.ExpiresAt}, nil
}

// ResendRegistrationCode re-issues a confirmation code.
func (s *Service) ResendRegistrationCode(email string) (RegisterStartResponse, error) {
	if err := s.ensureEmailAvailable(email); err != nil {
		return RegisterStartResponse{}, err
	}

	confirmation, err := s.upsertConfirmation(email)
	if err != nil {
		return RegisterStartResponse{}, err
	}

	if err := s.mailer.SendVerificationCode(email, confirmation.Code); err != nil {
		return RegisterStartResponse{}, fmt.Errorf("failed to resend verification code: %w", err)
	}

	metrics.RecordRegistration(time.Now())

	return RegisterStartResponse{ExpiresAt: confirmation.ExpiresAt}, nil
}

// ConfirmRegistration verifies the code and creates the user.
func (s *Service) ConfirmRegistration(req RegisterConfirmRequest) (*user.User, string, error) {
	if err := s.ensureEmailAvailable(req.Email); err != nil {
		return nil, "", err
	}

	var confirmation EmailConfirmation
	if err := s.db.Where("email = ?", req.Email).First(&confirmation).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", ErrConfirmationNotFound
		}
		return nil, "", fmt.Errorf("database error: %w", err)
	}

	if confirmation.ExpiresAt.Before(time.Now()) {
		return nil, "", ErrCodeExpired
	}

	if confirmation.Attempts >= maxVerificationAttempts {
		return nil, "", ErrTooManyAttempts
	}

	if confirmation.Code != req.Code {
		confirmation.Attempts++
		if err := s.db.Save(&confirmation).Error; err != nil {
			return nil, "", fmt.Errorf("failed to update confirmation attempts: %w", err)
		}
		return nil, "", ErrInvalidCode
	}

	var createdUser *user.User
	var token string
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		newUser, err := s.createUser(tx, req)
		if err != nil {
			return err
		}

		if err := tx.Delete(&confirmation).Error; err != nil {
			return fmt.Errorf("failed to delete confirmation: %w", err)
		}

		jwtToken, err := s.jwtManager.Generate(newUser.ID, newUser.Email)
		if err != nil {
			return fmt.Errorf("failed to generate token: %w", err)
		}

		createdUser = newUser
		token = jwtToken
		return nil
	}); err != nil {
		return nil, "", err
	}

	return createdUser, token, nil
}

// Login user
func (s *Service) Login(req user.LoginRequest) (*user.User, string, error) {
	var foundUser user.User
	if err := s.db.Where("email = ? AND is_deleted = false", req.Email).First(&foundUser).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", ErrInvalidCredentials
		}
		return nil, "", fmt.Errorf("database error: %w", err)
	}

	// Check password
	if foundUser.PasswordHash == nil {
		return nil, "", ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*foundUser.PasswordHash), []byte(req.Password)); err != nil {
		return nil, "", ErrInvalidCredentials
	}

	// Generate JWT token
	token, err := s.jwtManager.Generate(foundUser.ID, foundUser.Email)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	return &foundUser, token, nil
}

// GetUserByID
func (s *Service) GetUserByID(userID uuid.UUID) (*user.User, error) {
	var foundUser user.User
	if err := s.db.First(&foundUser, "id = ? AND is_deleted = false", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("database error: %w", err)
	}
	return &foundUser, nil
}

// VerifyToken
func (s *Service) VerifyToken(tokenString string) (*JWTClaims, error) {
	return s.jwtManager.Verify(tokenString)
}

func (s *Service) EnsureEmailAvailable(email string) error {
	return s.ensureEmailAvailable(email)
}

func (s *Service) UpsertConfirmation(email string) (*EmailConfirmation, error) {
	return s.upsertConfirmation(email)
}

func (s *Service) GenerateToken(userID uuid.UUID, email string) (string, error) {
	return s.jwtManager.Generate(userID, email)
}

func (s *Service) ensureEmailAvailable(email string) error {
	var existingUser user.User
	if err := s.db.Where("email = ?", email).First(&existingUser).Error; err == nil {
		return ErrEmailAlreadyExists
	}
	return nil
}

func (s *Service) upsertConfirmation(email string) (*EmailConfirmation, error) {
	code, err := generateVerificationCode(verificationCodeLength)
	if err != nil {
		return nil, fmt.Errorf("failed to generate verification code: %w", err)
	}

	expiresAt := time.Now().Add(verificationTTL)

	var confirmation EmailConfirmation
	if err := s.db.Where("email = ?", email).First(&confirmation).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("database error: %w", err)
		}

		confirmation = EmailConfirmation{
			Email:     email,
			Code:      code,
			ExpiresAt: expiresAt,
			Attempts:  0,
		}
		if err := s.db.Create(&confirmation).Error; err != nil {
			return nil, fmt.Errorf("failed to create confirmation: %w", err)
		}
		return &confirmation, nil
	}

	confirmation.Code = code
	confirmation.ExpiresAt = expiresAt
	confirmation.Attempts = 0
	if err := s.db.Save(&confirmation).Error; err != nil {
		return nil, fmt.Errorf("failed to update confirmation: %w", err)
	}

	return &confirmation, nil
}

func (s *Service) createUser(tx *gorm.DB, req RegisterConfirmRequest) (*user.User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	passwordHashStr := string(hashedPassword)
	newUser := user.User{
		Email:        req.Email,
		PasswordHash: &passwordHashStr,
		Name:         req.Name,
		Handle:       user.NormalizeHandle(req.Handle),
	}

	if err := tx.Create(&newUser).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &newUser, nil
}

func generateVerificationCode(length int) (string, error) {
	if length <= 0 {
		return "", fmt.Errorf("invalid code length")
	}

	const digits = "0123456789"
	code := make([]byte, length)
	for i := range code {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		if err != nil {
			return "", err
		}
		code[i] = digits[n.Int64()]
	}
	return string(code), nil
}
