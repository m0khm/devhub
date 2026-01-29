package deploy

import (
	"errors"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/m0khm/devhub/backend/internal/project"
	"golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/knownhosts"
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

func (s *Service) DeleteServer(projectID, serverID, userID uuid.UUID) error {
	if err := s.requireAdmin(projectID, userID); err != nil {
		return err
	}
	server, err := s.repo.GetServer(projectID, serverID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrServerNotFound
		}
		return err
	}
	if err := s.repo.DeleteServer(projectID, serverID); err != nil {
		return err
	}

	_ = s.repo.CreateAuditEvent(&DeployAuditEvent{
		ProjectID: projectID,
		ServerID:  &server.ID,
		UserID:    userID,
		Action:    "server_deleted",
		Metadata: map[string]any{
			"host": server.Host,
			"port": server.Port,
		},
		CreatedAt: time.Now(),
	})

	return nil
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

func (s *Service) TestServerConnection(projectID, serverID, userID uuid.UUID) (DeployConnectionTestResponse, error) {
	if err := s.requireAdmin(projectID, userID); err != nil {
		return DeployConnectionTestResponse{}, err
	}

	server, err := s.repo.GetServer(projectID, serverID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return DeployConnectionTestResponse{}, ErrServerNotFound
		}
		return DeployConnectionTestResponse{}, err
	}

	logs := make([]DeployConnectionLog, 0, 8)
	addLog := func(level, message string) {
		logs = append(logs, DeployConnectionLog{
			Timestamp: time.Now().UTC(),
			Level:     level,
			Message:   message,
		})
	}

	addLog("info", "Starting connection test.")
	if err := ValidateHost(server.Host); err != nil {
		addLog("error", fmt.Sprintf("Host validation failed: %v", err))
		return DeployConnectionTestResponse{Success: false, Logs: logs}, nil
	}

	var auth ssh.AuthMethod
	switch server.AuthType {
	case "password":
		addLog("info", "Using password authentication.")
		password, err := s.DecryptPassword(server)
		if err != nil {
			addLog("error", fmt.Sprintf("Failed to decrypt password: %v", err))
			return DeployConnectionTestResponse{Success: false, Logs: logs}, nil
		}
		auth = ssh.Password(password)
	case "key":
		addLog("info", "Using private key authentication.")
		key, err := s.DecryptPrivateKey(server)
		if err != nil {
			addLog("error", fmt.Sprintf("Failed to decrypt private key: %v", err))
			return DeployConnectionTestResponse{Success: false, Logs: logs}, nil
		}
		signer, err := ssh.ParsePrivateKey([]byte(key))
		if err != nil {
			addLog("error", fmt.Sprintf("Failed to parse private key: %v", err))
			return DeployConnectionTestResponse{Success: false, Logs: logs}, nil
		}
		auth = ssh.PublicKeys(signer)
	default:
		addLog("error", "Unsupported authentication type.")
		return DeployConnectionTestResponse{Success: false, Logs: logs}, nil
	}

	hostKeyCallback, err := s.hostKeyCallback(&logs)
	if err != nil {
		addLog("error", err.Error())
		return DeployConnectionTestResponse{Success: false, Logs: logs}, nil
	}

	address := fmt.Sprintf("%s:%d", server.Host, server.Port)
	addLog("info", fmt.Sprintf("Dialing %s.", address))
	config := &ssh.ClientConfig{
		User:            server.Username,
		Auth:            []ssh.AuthMethod{auth},
		HostKeyCallback: hostKeyCallback,
		Timeout:         10 * time.Second,
	}

	client, err := ssh.Dial("tcp", address, config)
	if err != nil {
		addLog("error", fmt.Sprintf("SSH dial failed: %v", err))
		return DeployConnectionTestResponse{Success: false, Logs: logs}, nil
	}
	_ = client.Close()

	addLog("info", "SSH handshake succeeded.")
	return DeployConnectionTestResponse{Success: true, Logs: logs}, nil
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

func (s *Service) hostKeyCallback(logs *[]DeployConnectionLog) (ssh.HostKeyCallback, error) {
	paths := knownHostsPaths()
	if len(paths) == 0 {
		return nil, fmt.Errorf("no known_hosts files found for host key verification")
	}
	if logs != nil {
		*logs = append(*logs, DeployConnectionLog{
			Timestamp: time.Now().UTC(),
			Level:     "info",
			Message:   fmt.Sprintf("Using known_hosts files: %s", strings.Join(paths, ", ")),
		})
	}

	callback, err := knownhosts.New(paths...)
	if err != nil {
		return nil, err
	}

	return func(hostname string, remote net.Addr, key ssh.PublicKey) error {
		fingerprint := ssh.FingerprintSHA256(key)
		if logs != nil {
			*logs = append(*logs, DeployConnectionLog{
				Timestamp: time.Now().UTC(),
				Level:     "info",
				Message:   fmt.Sprintf("Verifying host key %s for %s.", fingerprint, hostname),
			})
		}
		if err := callback(hostname, remote, key); err != nil {
			if logs != nil {
				*logs = append(*logs, DeployConnectionLog{
					Timestamp: time.Now().UTC(),
					Level:     "error",
					Message:   fmt.Sprintf("Host key verification failed: %v", err),
				})
			}
			return err
		}
		return nil
	}, nil
}

func knownHostsPaths() []string {
	paths := make([]string, 0, 2)
	if home, err := os.UserHomeDir(); err == nil && home != "" {
		path := filepath.Join(home, ".ssh", "known_hosts")
		if fileExists(path) {
			paths = append(paths, path)
		}
	}
	if fileExists("/etc/ssh/ssh_known_hosts") {
		paths = append(paths, "/etc/ssh/ssh_known_hosts")
	}
	return paths
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}
