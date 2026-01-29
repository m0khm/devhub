package auth

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"sync"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/m0khm/devhub/backend/internal/mailer"
	"github.com/m0khm/devhub/backend/internal/metrics"
)

var (
	ErrInvalidCredentials   = errors.New("invalid email or password")
	ErrEmailAlreadyExists   = errors.New("email already exists")
	ErrUserNotFound         = errors.New("user not found")
	ErrInvalidCode          = errors.New("invalid verification code")
	ErrConfirmationNotFound = errors.New("confirmation not found")
	ErrCodeExpired          = errors.New("verification code expired")
	ErrTooManyAttempts      = errors.New("too many verification attempts")
	ErrRateLimited          = errors.New("rate limit exceeded")
)

type Service struct {
	db           *gorm.DB
	jwtManager   *JWTManager
	mailer       mailer.Sender
	resetLimiter *rateLimiter
}

const (
	verificationCodeLength  = 6
	verificationTTL         = 10 * time.Minute
	maxVerificationAttempts = 5
	passwordResetTTL        = 15 * time.Minute
	passwordResetRateLimit  = 5
)

func MaxVerificationAttempts() int {
	return maxVerificationAttempts
}

func NewService(db *gorm.DB, jwtManager *JWTManager, mailerClient mailer.Sender) *Service {
	return &Service{
		db:           db,
		jwtManager:   jwtManager,
		mailer:       mailerClient,
		resetLimiter: newRateLimiter(passwordResetRateLimit, passwordResetTTL),
	}
}

// StartRegistration creates a pending confirmation and sends a code.
func (s *Service) StartRegistration(req RegisterRequest) (RegisterStartResponse, error) {
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

// ConfirmRegistration verifies the code and creates the
func (s *Service) ConfirmRegistration(req RegisterConfirmRequest) (*User, string, error) {
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

	var createdUser *User
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
func (s *Service) Login(req LoginRequest) (*User, string, error) {
	var foundUser User
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
func (s *Service) GetUserByID(userID uuid.UUID) (*User, error) {
	var foundUser User
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

func (s *Service) StartPasswordReset(email, requestIP string) error {
	if !s.resetLimiter.Allow(email, requestIP) {
		return ErrRateLimited
	}

	var user User
	if err := s.db.Where("email = ? AND is_deleted = false", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return fmt.Errorf("database error: %w", err)
	}

	code, err := generateVerificationCode(verificationCodeLength)
	if err != nil {
		return fmt.Errorf("failed to generate reset code: %w", err)
	}

	codeHash, err := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash reset code: %w", err)
	}

	expiresAt := time.Now().Add(passwordResetTTL)
	var ipPtr *string
	if requestIP != "" {
		ipPtr = &requestIP
	}

	token := PasswordResetToken{
		UserID:    user.ID,
		CodeHash:  string(codeHash),
		ExpiresAt: expiresAt,
		RequestIP: ipPtr,
	}

	if err := s.db.Create(&token).Error; err != nil {
		return fmt.Errorf("failed to create reset token: %w", err)
	}

	if err := s.mailer.SendPasswordResetCode(user.Email, code); err != nil {
		return fmt.Errorf("failed to send reset code: %w", err)
	}

	return nil
}

func (s *Service) ResetPassword(req ResetPasswordRequest, requestIP string) error {
	if !s.resetLimiter.Allow(req.Email, requestIP) {
		return ErrRateLimited
	}

	var user User
	if err := s.db.Where("email = ? AND is_deleted = false", req.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrInvalidCode
		}
		return fmt.Errorf("database error: %w", err)
	}

	var token PasswordResetToken
	if err := s.db.Where("user_id = ? AND used_at IS NULL", user.ID).
		Order("created_at desc").
		First(&token).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrInvalidCode
		}
		return fmt.Errorf("database error: %w", err)
	}

	if token.ExpiresAt.Before(time.Now()) {
		return ErrCodeExpired
	}

	if err := bcrypt.CompareHashAndPassword([]byte(token.CodeHash), []byte(req.Code)); err != nil {
		return ErrInvalidCode
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		passwordHashStr := string(hashedPassword)
		if err := tx.Model(&user).Update("password_hash", &passwordHashStr).Error; err != nil {
			return fmt.Errorf("failed to update password: %w", err)
		}

		usedAt := time.Now()
		if err := tx.Model(&token).Update("used_at", &usedAt).Error; err != nil {
			return fmt.Errorf("failed to mark token used: %w", err)
		}

		return nil
	})
}

func (s *Service) ensureEmailAvailable(email string) error {
	var existingUser User
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

func (s *Service) createUser(tx *gorm.DB, req RegisterConfirmRequest) (*User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	passwordHashStr := string(hashedPassword)
	newUser := User{
		Email:        req.Email,
		PasswordHash: &passwordHashStr,
		Name:         req.Name,
		Handle:       NormalizeHandle(req.Handle),
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

type rateLimiter struct {
	mu       sync.Mutex
	perEmail map[string][]time.Time
	perIP    map[string][]time.Time
	max      int
	window   time.Duration
}

func newRateLimiter(max int, window time.Duration) *rateLimiter {
	return &rateLimiter{
		perEmail: make(map[string][]time.Time),
		perIP:    make(map[string][]time.Time),
		max:      max,
		window:   window,
	}
}

func (r *rateLimiter) Allow(email, ip string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	allowed := true

	if email != "" {
		r.perEmail[email] = pruneOld(r.perEmail[email], now, r.window)
		if len(r.perEmail[email]) >= r.max {
			allowed = false
		}
	}

	if ip != "" {
		r.perIP[ip] = pruneOld(r.perIP[ip], now, r.window)
		if len(r.perIP[ip]) >= r.max {
			allowed = false
		}
	}

	if !allowed {
		return false
	}

	if email != "" {
		r.perEmail[email] = append(r.perEmail[email], now)
	}
	if ip != "" {
		r.perIP[ip] = append(r.perIP[ip], now)
	}

	return true
}

func pruneOld(entries []time.Time, now time.Time, window time.Duration) []time.Time {
	if len(entries) == 0 {
		return entries
	}
	cutoff := now.Add(-window)
	pruned := entries[:0]
	for _, entry := range entries {
		if entry.After(cutoff) {
			pruned = append(pruned, entry)
		}
	}
	return pruned
}
