package admin

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrInvalidCredentials = errors.New("invalid admin credentials")

type Service struct {
	db       *gorm.DB
	user     string
	password string
	ttl      time.Duration
	sessions map[string]time.Time
	mu       sync.Mutex
}

type DashboardSummary struct {
	TotalUsers   int64 `json:"total_users"`
	ActiveUsers  int64 `json:"active_users"`
	DeletedUsers int64 `json:"deleted_users"`
}

type DashboardUser struct {
	ID        uuid.UUID `json:"id" gorm:"column:id"`
	Email     string    `json:"email" gorm:"column:email"`
	Name      string    `json:"name" gorm:"column:name"`
	Handle    *string   `json:"handle" gorm:"column:handle"`
	LastIP    *string   `json:"last_ip" gorm:"column:last_ip"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

type DashboardResponse struct {
	Status  string           `json:"status"`
	Summary DashboardSummary `json:"summary"`
	Users   []DashboardUser  `json:"users"`
}

func NewService(db *gorm.DB, user, password string, ttl time.Duration) *Service {
	return &Service{
		db:       db,
		user:     user,
		password: password,
		ttl:      ttl,
		sessions: make(map[string]time.Time),
	}
}

func (s *Service) Login(user, password string) (string, time.Time, error) {
	if user != s.user || password != s.password {
		return "", time.Time{}, ErrInvalidCredentials
	}

	token, err := generateToken()
	if err != nil {
		return "", time.Time{}, err
	}

	expiresAt := time.Now().Add(s.ttl)

	s.mu.Lock()
	s.sessions[token] = expiresAt
	s.mu.Unlock()

	return token, expiresAt, nil
}

func (s *Service) ValidateToken(token string) bool {
	if token == "" {
		return false
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	expiresAt, ok := s.sessions[token]
	if !ok {
		return false
	}

	if time.Now().After(expiresAt) {
		delete(s.sessions, token)
		return false
	}

	return true
}

func (s *Service) GetDashboard() (DashboardResponse, error) {
	var totalUsers int64
	if err := s.db.Table("users").Count(&totalUsers).Error; err != nil {
		return DashboardResponse{}, err
	}

	var activeUsers int64
	if err := s.db.Table("users").Where("is_deleted = false").Count(&activeUsers).Error; err != nil {
		return DashboardResponse{}, err
	}

	var deletedUsers int64
	if err := s.db.Table("users").Where("is_deleted = true").Count(&deletedUsers).Error; err != nil {
		return DashboardResponse{}, err
	}

	var users []DashboardUser
	if err := s.db.
		Table("users").
		Select("id, email, name, handle, last_ip, created_at, updated_at").
		Order("created_at DESC").
		Find(&users).Error; err != nil {
		return DashboardResponse{}, err
	}

	return DashboardResponse{
		Status: "ok",
		Summary: DashboardSummary{
			TotalUsers:   totalUsers,
			ActiveUsers:  activeUsers,
			DeletedUsers: deletedUsers,
		},
		Users: users,
	}, nil
}

func generateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes), nil
}
