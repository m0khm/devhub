package deploy

import (
	"time"

	"github.com/google/uuid"
)

type DeployServer struct {
	ID                  uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ProjectID           uuid.UUID  `json:"project_id" gorm:"not null;index"`
	Name                string     `json:"name" gorm:"not null"`
	Host                string     `json:"host" gorm:"not null"`
	Port                int        `json:"port" gorm:"not null;default:22"`
	Username            string     `json:"username" gorm:"not null"`
	AuthType            string     `json:"auth_type" gorm:"not null"` // password | key
	EncryptedPassword   *string    `json:"-" gorm:"column:encrypted_password"`
	EncryptedPrivateKey *string    `json:"-" gorm:"column:encrypted_private_key"`
	CreatedBy           uuid.UUID  `json:"created_by" gorm:"not null"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
	LastConnectedAt     *time.Time `json:"last_connected_at"`
}

type DeployAuditEvent struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ProjectID uuid.UUID      `json:"project_id" gorm:"not null;index"`
	ServerID  *uuid.UUID     `json:"server_id" gorm:"index"`
	UserID    uuid.UUID      `json:"user_id" gorm:"not null;index"`
	Action    string         `json:"action" gorm:"not null"`
	Metadata  map[string]any `json:"metadata" gorm:"type:jsonb"`
	CreatedAt time.Time      `json:"created_at"`
}

type DeploySettings struct {
	ProjectID    uuid.UUID `json:"project_id" gorm:"primary_key"`
	Strategy     string    `json:"strategy" gorm:"not null"`
	BuildCommand string    `json:"build_command" gorm:"not null"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type DeployEnvVar struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ProjectID      uuid.UUID `json:"project_id" gorm:"not null;index"`
	Key            string    `json:"key" gorm:"not null"`
	EncryptedValue string    `json:"-" gorm:"column:encrypted_value"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type CreateDeployServerRequest struct {
	Name       string  `json:"name" validate:"required,min=2,max=100"`
	Host       string  `json:"host" validate:"required"`
	Port       int     `json:"port" validate:"required,min=1,max=65535"`
	Username   string  `json:"username" validate:"required"`
	AuthType   string  `json:"auth_type" validate:"required,oneof=password key"`
	Password   *string `json:"password"`
	PrivateKey *string `json:"private_key"`
}

type DeploySettingsRequest struct {
	Strategy     string `json:"strategy" validate:"required,min=2,max=50"`
	BuildCommand string `json:"build_command" validate:"required,min=2,max=200"`
}

type DeployEnvVarInput struct {
	Key   string `json:"key" validate:"required"`
	Value string `json:"value" validate:"required"`
}

type DeployServerResponse struct {
	ID        uuid.UUID `json:"id"`
	ProjectID uuid.UUID `json:"project_id"`
	Name      string    `json:"name"`
	Host      string    `json:"host"`
	Port      int       `json:"port"`
	Username  string    `json:"username"`
	AuthType  string    `json:"auth_type"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type DeploySettingsResponse struct {
	ProjectID    uuid.UUID `json:"project_id"`
	Strategy     string    `json:"strategy"`
	BuildCommand string    `json:"build_command"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type DeployEnvVarResponse struct {
	ID        uuid.UUID `json:"id"`
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}

type DeployConnectionLog struct {
	Timestamp time.Time `json:"timestamp"`
	Level     string    `json:"level"`
	Message   string    `json:"message"`
}

type DeployConnectionTestResponse struct {
	Success bool                  `json:"success"`
	Logs    []DeployConnectionLog `json:"logs"`
}

func (DeployServer) TableName() string {
	return "deploy_servers"
}

func (DeployAuditEvent) TableName() string {
	return "deploy_audit_events"
}

func (DeploySettings) TableName() string {
	return "deploy_settings"
}

func (DeployEnvVar) TableName() string {
	return "deploy_env_vars"
}

func (server DeployServer) ToResponse() DeployServerResponse {
	return DeployServerResponse{
		ID:        server.ID,
		ProjectID: server.ProjectID,
		Name:      server.Name,
		Host:      server.Host,
		Port:      server.Port,
		Username:  server.Username,
		AuthType:  server.AuthType,
		CreatedAt: server.CreatedAt,
		UpdatedAt: server.UpdatedAt,
	}
}

func (settings DeploySettings) ToResponse() DeploySettingsResponse {
	return DeploySettingsResponse{
		ProjectID:    settings.ProjectID,
		Strategy:     settings.Strategy,
		BuildCommand: settings.BuildCommand,
		UpdatedAt:    settings.UpdatedAt,
	}
}
