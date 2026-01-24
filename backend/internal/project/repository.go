package project

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

// Create project
func (r *Repository) Create(project *Project) error {
	return r.db.Create(project).Error
}

// Get project by ID
func (r *Repository) GetByID(id uuid.UUID) (*Project, error) {
	var project Project
	err := r.db.First(&project, "id = ?", id).Error
	return &project, err
}

// Get projects by user ID (either owner or member)
func (r *Repository) GetByUserID(userID uuid.UUID) ([]Project, error) {
	var projects []Project
	err := r.db.
		Distinct("projects.*").
		Joins("LEFT JOIN project_members ON project_members.project_id = projects.id").
		Where("projects.owner_id = ? OR project_members.user_id = ?", userID, userID).
		Find(&projects).Error
	return projects, err
}

// Update project
func (r *Repository) Update(project *Project) error {
	return r.db.Save(project).Error
}

// Delete project
func (r *Repository) Delete(id uuid.UUID) error {
	return r.db.Delete(&Project{}, "id = ?", id).Error
}

// Check if user is member
func (r *Repository) IsUserMember(projectID, userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&ProjectMember{}).
		Where("project_id = ? AND user_id = ?", projectID, userID).
		Count(&count).Error
	return count > 0, err
}

// Get user role in project
func (r *Repository) GetUserRole(projectID, userID uuid.UUID) (string, error) {
	var member ProjectMember
	err := r.db.
		Where("project_id = ? AND user_id = ?", projectID, userID).
		First(&member).Error
	if err != nil {
		return "", err
	}
	return member.Role, nil
}

// Add member to project
func (r *Repository) AddMember(projectID, userID uuid.UUID, role string) error {
	member := ProjectMember{
		ProjectID: projectID,
		UserID:    userID,
		Role:      role,
	}
	return r.db.Create(&member).Error
}

// Remove member from project
func (r *Repository) RemoveMember(projectID, userID uuid.UUID) error {
	return r.db.
		Where("project_id = ? AND user_id = ?", projectID, userID).
		Delete(&ProjectMember{}).Error
}

// Get project members
func (r *Repository) GetMembers(projectID uuid.UUID) ([]ProjectMemberWithUser, error) {
	var members []ProjectMemberWithUser
	err := r.db.Table("project_members").
		Select(`
			project_members.*,
			users.id as user__id,
			users.email as user__email,
			users.name as user__name,
			users.avatar_url as user__avatar_url
		`).
		Joins("JOIN users ON users.id = project_members.user_id").
		Where("project_members.project_id = ?", projectID).
		Scan(&members).Error
	return members, err
}

// Get project member IDs
func (r *Repository) GetMemberIDs(projectID uuid.UUID) ([]uuid.UUID, error) {
	var memberIDs []uuid.UUID
	err := r.db.Model(&ProjectMember{}).
		Select("user_id").
		Where("project_id = ?", projectID).
		Scan(&memberIDs).Error
	return memberIDs, err
}

func (r *Repository) CreateInvitation(invitation *ProjectInvitation) error {
	return r.db.Create(invitation).Error
}

func (r *Repository) GetInvitationByID(id uuid.UUID) (*ProjectInvitation, error) {
	var invitation ProjectInvitation
	err := r.db.First(&invitation, "id = ?", id).Error
	return &invitation, err
}

func (r *Repository) GetPendingInvitation(projectID, inviteeID uuid.UUID) (*ProjectInvitation, error) {
	var invitation ProjectInvitation
	err := r.db.
		Where("project_id = ? AND invitee_id = ? AND status = ?", projectID, inviteeID, "pending").
		First(&invitation).Error
	return &invitation, err
}

func (r *Repository) UpdateInvitation(invitation *ProjectInvitation) error {
	return r.db.Save(invitation).Error
}
