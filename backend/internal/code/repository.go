package code

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RepositoryStore struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *RepositoryStore {
	return &RepositoryStore{db: db}
}

func (r *RepositoryStore) ListByProject(projectID uuid.UUID) ([]Repository, error) {
	var repos []Repository
	err := r.db.
		Preload("Files", func(db *gorm.DB) *gorm.DB {
			return db.Order("path ASC")
		}).
		Where("project_id = ?", projectID).
		Order("updated_at DESC").
		Find(&repos).Error
	return repos, err
}

func (r *RepositoryStore) GetByID(projectID, repoID uuid.UUID) (*Repository, error) {
	var repo Repository
	err := r.db.
		Preload("Files", func(db *gorm.DB) *gorm.DB {
			return db.Order("path ASC")
		}).
		Where("id = ? AND project_id = ?", repoID, projectID).
		First(&repo).Error
	return &repo, err
}

func (r *RepositoryStore) Create(repo *Repository) error {
	return r.db.Create(repo).Error
}

func (r *RepositoryStore) Update(repo *Repository) error {
	return r.db.Save(repo).Error
}

func (r *RepositoryStore) CreateFile(file *RepoFile) error {
	return r.db.Create(file).Error
}

func (r *RepositoryStore) GetFileByID(repoID, fileID uuid.UUID) (*RepoFile, error) {
	var file RepoFile
	err := r.db.Where("id = ? AND repo_id = ?", fileID, repoID).First(&file).Error
	return &file, err
}

func (r *RepositoryStore) UpdateFile(file *RepoFile) error {
	return r.db.Save(file).Error
}
