package deploy

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

func (r *Repository) CreateServer(server *DeployServer) error {
	return r.db.Create(server).Error
}

func (r *Repository) ListServers(projectID uuid.UUID) ([]DeployServer, error) {
	var servers []DeployServer
	err := r.db.Where("project_id = ?", projectID).Order("created_at DESC").Find(&servers).Error
	return servers, err
}

func (r *Repository) GetServer(projectID, serverID uuid.UUID) (*DeployServer, error) {
	var server DeployServer
	err := r.db.First(&server, "id = ? AND project_id = ?", serverID, projectID).Error
	return &server, err
}

func (r *Repository) UpdateServer(server *DeployServer) error {
	return r.db.Save(server).Error
}

func (r *Repository) CreateAuditEvent(event *DeployAuditEvent) error {
	return r.db.Create(event).Error
}
