package kanban

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) ListColumns(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	columns, err := h.service.ListColumns(projectID, userID)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to load kanban columns"})
	}

	if columns == nil {
		columns = []Column{}
	}

	return c.JSON(columns)
}

func (h *Handler) CreateColumn(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	var req CreateColumnRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	if req.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Title is required"})
	}

	column, err := h.service.CreateColumn(projectID, userID, req)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create column"})
	}

	return c.JSON(column)
}

func (h *Handler) UpdateColumn(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	columnID, err := uuid.Parse(c.Params("columnId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid column ID"})
	}

	var req UpdateColumnRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	column, err := h.service.UpdateColumn(projectID, userID, columnID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotProjectMember):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		case errors.Is(err, ErrColumnNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Column not found"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update column"})
		}
	}

	return c.JSON(column)
}

func (h *Handler) DeleteColumn(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	columnID, err := uuid.Parse(c.Params("columnId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid column ID"})
	}

	if err := h.service.DeleteColumn(projectID, userID, columnID); err != nil {
		switch {
		case errors.Is(err, ErrNotProjectMember):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		case errors.Is(err, ErrColumnNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Column not found"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete column"})
		}
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) CreateTask(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	columnID, err := uuid.Parse(c.Params("columnId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid column ID"})
	}

	var req CreateTaskRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	if req.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Title is required"})
	}

	task, err := h.service.CreateTask(projectID, userID, columnID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotProjectMember):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		case errors.Is(err, ErrColumnNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Column not found"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create task"})
		}
	}

	return c.JSON(task)
}

func (h *Handler) UpdateTask(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	taskID, err := uuid.Parse(c.Params("taskId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid task ID"})
	}

	var req UpdateTaskRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	task, err := h.service.UpdateTask(projectID, userID, taskID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotProjectMember):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		case errors.Is(err, ErrTaskNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Task not found"})
		case errors.Is(err, ErrColumnNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Column not found"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update task"})
		}
	}

	return c.JSON(task)
}

func (h *Handler) DeleteTask(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	taskID, err := uuid.Parse(c.Params("taskId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid task ID"})
	}

	if err := h.service.DeleteTask(projectID, userID, taskID); err != nil {
		switch {
		case errors.Is(err, ErrNotProjectMember):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		case errors.Is(err, ErrTaskNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Task not found"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete task"})
		}
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func getUserIDFromContext(c *fiber.Ctx) (uuid.UUID, error) {
	userIDStr, ok := c.Locals("userID").(string)
	if !ok {
		return uuid.Nil, errors.New("user not authenticated")
	}
	return uuid.Parse(userIDStr)
}
