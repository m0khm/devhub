package deploy

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/m0khm/devhub/backend/internal/project"
	"gorm.io/gorm"
)

var (
	ErrNotProjectMember = errors.New("not a project member")
	ErrNotProjectAdmin  = errors.New("not a project admin")
	ErrServerNotFound   = errors.New("server not found")
	ErrInvalidHost      = errors.New("invalid host")
	ErrSettingsNotFound = errors.New("deploy settings not found")
)

type Service struct {
	repo        *Repository
	projectRepo *project.Repository
	encryptor   *Encryptor
}

func NewService(repo *Repository, projectRepo *project.Repository, encryptor *Encryptor) *Service {
	return &Service{repo: repo, projectRepo: projectRepo, encryptor: encryptor}
}

func (s *Service) requireAdmin(projectID, userID uuid.UUID) error {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return err
	}
	if !isMember {
		return ErrNotProjectMember
	}

	role, err := s.projectRepo.GetUserRole(projectID, userID)
	if err != nil {
		return err
	}
	if role != "owner" && role != "admin" {
		return ErrNotProjectAdmin
	}
	return nil
}

func (s *Service) CreateServer(projectID, userID uuid.UUID, req CreateDeployServerRequest) (*DeployServer, error) {
	if err := s.requireAdmin(projectID, userID); err != nil {
		return nil, err
	}

	if err := ValidateHost(req.Host); err != nil {
		return nil, ErrInvalidHost
	}
	if req.Port < 1 || req.Port > 65535 {
		return nil, fmt.Errorf("invalid port")
	}

	var encryptedPassword *string
	var encryptedKey *string

	switch req.AuthType {
	case "password":
		if req.Password == nil || *req.Password == "" {
			return nil, fmt.Errorf("password is required")
		}
		cipher, err := s.encryptor.Encrypt([]byte(*req.Password))
		if err != nil {
			return nil, err
		}
		encryptedPassword = &cipher
	case "key":
		if req.PrivateKey == nil || *req.PrivateKey == "" {
			return nil, fmt.Errorf("private key is required")
		}
		cipher, err := s.encryptor.Encrypt([]byte(*req.PrivateKey))
		if err != nil {
			return nil, err
		}
		encryptedKey = &cipher
	default:
		return nil, fmt.Errorf("unsupported auth type")
	}

	server := &DeployServer{
		ProjectID:           projectID,
		Name:                req.Name,
		Host:                req.Host,
		Port:                req.Port,
		Username:            req.Username,
		AuthType:            req.AuthType,
		EncryptedPassword:   encryptedPassword,
		EncryptedPrivateKey: encryptedKey,
		CreatedBy:           userID,
	}

	if err := s.repo.CreateServer(server); err != nil {
		return nil, err
	}

	_ = s.repo.CreateAuditEvent(&DeployAuditEvent{
		ProjectID: projectID,
		ServerID:  &server.ID,
		UserID:    userID,
		Action:    "server_created",
		Metadata: map[string]any{
			"host": server.Host,
			"port": server.Port,
		},
		CreatedAt: time.Now(),
	})

	return server, nil
}

func (s *Service) ListServers(projectID, userID uuid.UUID) ([]DeployServer, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}
	return s.repo.ListServers(projectID)
}

func (s *Service) GetServer(projectID, serverID, userID uuid.UUID) (*DeployServer, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}
	server, err := s.repo.GetServer(projectID, serverID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrServerNotFound
		}
		return nil, err
	}
	return server, nil
}

func (s *Service) GetSettings(projectID, userID uuid.UUID) (*DeploySettings, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}
	settings, err := s.repo.GetSettings(projectID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSettingsNotFound
		}
		return nil, err
	}
	return settings, nil
}

func (s *Service) UpdateSettings(projectID, userID uuid.UUID, req DeploySettingsRequest) (*DeploySettings, error) {
	if err := s.requireAdmin(projectID, userID); err != nil {
		return nil, err
	}
	strategy := strings.TrimSpace(req.Strategy)
	buildCommand := strings.TrimSpace(req.BuildCommand)
	if strategy == "" || buildCommand == "" {
		return nil, fmt.Errorf("settings fields are required")
	}
	settings, err := s.repo.GetSettings(projectID)
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		settings = &DeploySettings{
			ProjectID: projectID,
		}
	}
	settings.Strategy = strategy
	settings.BuildCommand = buildCommand
	if err := s.repo.UpsertSettings(settings); err != nil {
		return nil, err
	}
	return settings, nil
}

func (s *Service) ListEnvVars(projectID, userID uuid.UUID) ([]DeployEnvVarResponse, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}
	vars, err := s.repo.ListEnvVars(projectID)
	if err != nil {
		return nil, err
	}
	responses := make([]DeployEnvVarResponse, 0, len(vars))
	for _, envVar := range vars {
		plain, err := s.encryptor.Decrypt(envVar.EncryptedValue)
		if err != nil {
			return nil, err
		}
		responses = append(responses, DeployEnvVarResponse{
			ID:        envVar.ID,
			Key:       envVar.Key,
			Value:     string(plain),
			UpdatedAt: envVar.UpdatedAt,
		})
	}
	return responses, nil
}

func (s *Service) ReplaceEnvVars(projectID, userID uuid.UUID, vars []DeployEnvVarInput) ([]DeployEnvVarResponse, error) {
	if err := s.requireAdmin(projectID, userID); err != nil {
		return nil, err
	}
	seenKeys := make(map[string]struct{})
	records := make([]DeployEnvVar, 0, len(vars))
	for _, envVar := range vars {
		key := strings.TrimSpace(envVar.Key)
		if key == "" {
			return nil, fmt.Errorf("env var key is required")
		}
		if _, exists := seenKeys[key]; exists {
			return nil, fmt.Errorf("duplicate env var key: %s", key)
		}
		seenKeys[key] = struct{}{}
		value := strings.TrimSpace(envVar.Value)
		if value == "" {
			return nil, fmt.Errorf("env var value is required")
		}
		cipher, err := s.encryptor.Encrypt([]byte(value))
		if err != nil {
			return nil, err
		}
		records = append(records, DeployEnvVar{
			ProjectID:      projectID,
			Key:            key,
			EncryptedValue: cipher,
		})
	}
	if err := s.repo.ReplaceEnvVars(projectID, records); err != nil {
		return nil, err
	}
	return s.ListEnvVars(projectID, userID)
}

func (s *Service) GetServerForTerminal(projectID, serverID, userID uuid.UUID) (*DeployServer, error) {
	if err := s.requireAdmin(projectID, userID); err != nil {
		return nil, err
	}
	server, err := s.repo.GetServer(projectID, serverID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrServerNotFound
		}
		return nil, err
	}
	return server, nil
}

func (s *Service) RecordTerminalConnection(projectID, userID uuid.UUID, server *DeployServer) {
	now := time.Now()
	server.LastConnectedAt = &now
	_ = s.repo.UpdateServer(server)
	_ = s.repo.CreateAuditEvent(&DeployAuditEvent{
		ProjectID: projectID,
		ServerID:  &server.ID,
		UserID:    userID,
		Action:    "terminal_connected",
		Metadata: map[string]any{
			"host": server.Host,
			"port": server.Port,
		},
		CreatedAt: now,
	})
}

func (s *Service) DecryptPassword(server *DeployServer) (string, error) {
	if server.EncryptedPassword == nil {
		return "", fmt.Errorf("password not set")
	}
	plain, err := s.encryptor.Decrypt(*server.EncryptedPassword)
	if err != nil {
		return "", err
	}
	return string(plain), nil
}

func (s *Service) DecryptPrivateKey(server *DeployServer) (string, error) {
	if server.EncryptedPrivateKey == nil {
		return "", fmt.Errorf("private key not set")
	}
	plain, err := s.encryptor.Decrypt(*server.EncryptedPrivateKey)
	if err != nil {
		return "", err
	}
	return string(plain), nil
}
