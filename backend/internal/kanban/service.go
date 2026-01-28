package kanban

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/m0khm/devhub/backend/internal/project"
)

var (
	ErrNotProjectMember = errors.New("not a project member")
	ErrColumnNotFound   = errors.New("column not found")
	ErrTaskNotFound     = errors.New("task not found")
)

type Service struct {
	repo        *Repository
	projectRepo *project.Repository
}

func NewService(repo *Repository, projectRepo *project.Repository) *Service {
	return &Service{
		repo:        repo,
		projectRepo: projectRepo,
	}
}

func (s *Service) ListColumns(projectID, userID uuid.UUID) ([]Column, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	return s.repo.ListColumns(projectID)
}

func (s *Service) CreateColumn(projectID, userID uuid.UUID, req CreateColumnRequest) (*Column, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	position := 0
	if req.Position != nil {
		position = *req.Position
	}

	column := Column{
		ProjectID: projectID,
		Title:     req.Title,
		Position:  position,
	}

	if err := s.repo.CreateColumn(&column); err != nil {
		return nil, fmt.Errorf("failed to create column: %w", err)
	}

	return &column, nil
}

func (s *Service) UpdateColumn(projectID, userID, columnID uuid.UUID, req UpdateColumnRequest) (*Column, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	column, err := s.repo.GetColumnByID(columnID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrColumnNotFound
		}
		return nil, fmt.Errorf("failed to get column: %w", err)
	}

	if column.ProjectID != projectID {
		return nil, ErrColumnNotFound
	}

	if req.Title != nil {
		column.Title = *req.Title
	}
	if req.Position != nil {
		column.Position = *req.Position
	}

	if err := s.repo.UpdateColumn(column); err != nil {
		return nil, fmt.Errorf("failed to update column: %w", err)
	}

	return column, nil
}

func (s *Service) DeleteColumn(projectID, userID, columnID uuid.UUID) error {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return ErrNotProjectMember
	}

	column, err := s.repo.GetColumnByID(columnID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrColumnNotFound
		}
		return fmt.Errorf("failed to get column: %w", err)
	}

	if column.ProjectID != projectID {
		return ErrColumnNotFound
	}

	return s.repo.DeleteColumn(columnID)
}

func (s *Service) CreateTask(projectID, userID, columnID uuid.UUID, req CreateTaskRequest) (*Task, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	column, err := s.repo.GetColumnByID(columnID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrColumnNotFound
		}
		return nil, fmt.Errorf("failed to get column: %w", err)
	}
	if column.ProjectID != projectID {
		return nil, ErrColumnNotFound
	}

	position := 0
	if req.Position != nil {
		position = *req.Position
	}

	priority := "medium"
	if req.Priority != nil && *req.Priority != "" {
		priority = *req.Priority
	}

	var dueDate *time.Time
	if req.DueDate != nil && *req.DueDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.DueDate)
		if err != nil {
			return nil, fmt.Errorf("invalid due date: %w", err)
		}
		dueDate = &parsed
	}

	task := Task{
		ColumnID:    columnID,
		Title:       req.Title,
		Description: req.Description,
		Assignee:    req.Assignee,
		Priority:    priority,
		DueDate:     dueDate,
		Position:    position,
	}

	if err := s.repo.CreateTask(&task); err != nil {
		return nil, fmt.Errorf("failed to create task: %w", err)
	}

	return &task, nil
}

func (s *Service) UpdateTask(projectID, userID, taskID uuid.UUID, req UpdateTaskRequest) (*Task, error) {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return nil, ErrNotProjectMember
	}

	task, err := s.repo.GetTaskByID(taskID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTaskNotFound
		}
		return nil, fmt.Errorf("failed to get task: %w", err)
	}

	column, err := s.repo.GetColumnByID(task.ColumnID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrColumnNotFound
		}
		return nil, fmt.Errorf("failed to get column: %w", err)
	}
	if column.ProjectID != projectID {
		return nil, ErrTaskNotFound
	}

	if req.Title != nil {
		task.Title = *req.Title
	}
	if req.Description != nil {
		task.Description = req.Description
	}
	if req.Assignee != nil {
		task.Assignee = req.Assignee
	}
	if req.Priority != nil && *req.Priority != "" {
		task.Priority = *req.Priority
	}
	if req.Position != nil {
		task.Position = *req.Position
	}
	if req.DueDate != nil {
		if *req.DueDate == "" {
			task.DueDate = nil
		} else {
			parsed, err := time.Parse("2006-01-02", *req.DueDate)
			if err != nil {
				return nil, fmt.Errorf("invalid due date: %w", err)
			}
			task.DueDate = &parsed
		}
	}
	if req.ColumnID != nil && *req.ColumnID != "" {
		newColumnID, err := uuid.Parse(*req.ColumnID)
		if err != nil {
			return nil, fmt.Errorf("invalid column id: %w", err)
		}
		newColumn, err := s.repo.GetColumnByID(newColumnID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrColumnNotFound
			}
			return nil, fmt.Errorf("failed to get column: %w", err)
		}
		if newColumn.ProjectID != projectID {
			return nil, ErrColumnNotFound
		}
		task.ColumnID = newColumnID
	}

	if err := s.repo.UpdateTask(task); err != nil {
		return nil, fmt.Errorf("failed to update task: %w", err)
	}

	return task, nil
}

func (s *Service) DeleteTask(projectID, userID, taskID uuid.UUID) error {
	isMember, err := s.projectRepo.IsUserMember(projectID, userID)
	if err != nil {
		return fmt.Errorf("failed to check membership: %w", err)
	}
	if !isMember {
		return ErrNotProjectMember
	}

	task, err := s.repo.GetTaskByID(taskID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrTaskNotFound
		}
		return fmt.Errorf("failed to get task: %w", err)
	}

	column, err := s.repo.GetColumnByID(task.ColumnID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrColumnNotFound
		}
		return fmt.Errorf("failed to get column: %w", err)
	}
	if column.ProjectID != projectID {
		return ErrTaskNotFound
	}

	return s.repo.DeleteTask(taskID)
}
