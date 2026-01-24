package admin

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
	"time"
)

var ErrInvalidCredentials = errors.New("invalid admin credentials")

type Service struct {
	user     string
	password string
	ttl      time.Duration
	sessions map[string]time.Time
	mu       sync.Mutex
}

func NewService(user, password string, ttl time.Duration) *Service {
	return &Service{
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

func generateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes), nil
}
