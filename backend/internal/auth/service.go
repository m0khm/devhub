package auth

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/m0khm/devhub/backend/internal/user"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrUserNotFound       = errors.New("user not found")
)

type Service struct {
	db         *gorm.DB
	jwtManager *JWTManager
}

func NewService(db *gorm.DB, jwtManager *JWTManager) *Service {
	return &Service{
		db:         db,
		jwtManager: jwtManager,
	}
}

// Register new user
func (s *Service) Register(req user.RegisterRequest) (*user.User, string, error) {
	// Check if email exists
	var existingUser user.User
	if err := s.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return nil, "", ErrEmailAlreadyExists
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", fmt.Errorf("failed to hash password: %w", err)
	}

	passwordHashStr := string(hashedPassword)
	newUser := user.User{
		Email:        req.Email,
		PasswordHash: &passwordHashStr,
		Name:         req.Name,
	}

	if err := s.db.Create(&newUser).Error; err != nil {
		return nil, "", fmt.Errorf("failed to create user: %w", err)
	}

	// Generate JWT token
	token, err := s.jwtManager.Generate(newUser.ID, newUser.Email)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	return &newUser, token, nil
}

// Login user
func (s *Service) Login(req user.LoginRequest) (*user.User, string, error) {
	var foundUser user.User
	if err := s.db.Where("email = ?", req.Email).First(&foundUser).Error; err != nil {
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
	if err := s.db.First(&foundUser, "id = ?", userID).Error; err != nil {
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
