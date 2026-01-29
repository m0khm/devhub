package workspace

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/m0khm/devhub/backend/internal/project"
	"github.com/m0khm/devhub/backend/pkg/validator"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Get user workspaces
// GET /api/workspaces
func (h *Handler) GetUserWorkspaces(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	workspaces, err := h.service.GetUserWorkspaces(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get workspaces",
		})
	}
	if workspaces == nil {
		workspaces = []Workspace{}
	}

	return c.JSON(workspaces)
}

// Create workspace
// POST /api/workspaces
func (h *Handler) Create(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	var req CreateWorkspaceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if errs := validator.Validate(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"details": errs,
		})
	}

	workspace, err := h.service.Create(userID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create workspace",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(workspace)
}

// Get workspace projects
// GET /api/workspaces/:id/projects
func (h *Handler) GetProjects(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	workspaceID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid workspace ID",
		})
	}

	projects, err := h.service.GetProjects(workspaceID, userID)
	if err != nil {
		if errors.Is(err, ErrWorkspaceNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Workspace not found",
			})
		}
		if errors.Is(err, ErrNotWorkspaceMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You are not a member of this workspace",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get workspace projects",
		})
	}
	if projects == nil {
		projects = []project.Project{}
	}

	return c.JSON(projects)
}

// Create project in workspace
// POST /api/workspaces/:id/projects
func (h *Handler) CreateProject(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	workspaceID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid workspace ID",
		})
	}

	var req project.CreateProjectRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if errs := validator.Validate(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"details": errs,
		})
	}

	projectResponse, err := h.service.CreateProject(workspaceID, userID, req)
	if err != nil {
		if errors.Is(err, ErrWorkspaceNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Workspace not found",
			})
		}
		if errors.Is(err, ErrNotWorkspaceMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You are not a member of this workspace",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create project",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(projectResponse)
}

func getUserIDFromContext(c *fiber.Ctx) (uuid.UUID, error) {
	userIDStr, ok := c.Locals("userID").(string)
	if !ok {
		return uuid.Nil, errors.New("user ID not found in context")
	}
	return uuid.Parse(userIDStr)
}
