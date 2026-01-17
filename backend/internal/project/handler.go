package project

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/m0khm/devhub/backend/pkg/validator"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Create project
// POST /api/projects
func (h *Handler) Create(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	var req CreateProjectRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate
	if errs := validator.Validate(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"details": errs,
		})
	}

	project, err := h.service.Create(userID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create project",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(project)
}

// Get user's projects
// GET /api/projects
func (h *Handler) GetUserProjects(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	projects, err := h.service.GetUserProjects(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get projects",
		})
	}
	if projects == nil {
		projects = []Project{}
	}

	return c.JSON(projects)
}

// Get project by ID
// GET /api/projects/:id
func (h *Handler) GetByID(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	projectID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid project ID",
		})
	}

	project, err := h.service.GetByID(projectID, userID)
	if err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Project not found",
			})
		}
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You are not a member of this project",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get project",
		})
	}

	return c.JSON(project)
}

// Get project members
// GET /api/projects/:id/members
func (h *Handler) GetMembers(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	projectID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid project ID",
		})
	}

	members, err := h.service.GetMembers(projectID, userID)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You are not a member of this project",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get project members",
		})
	}

	return c.JSON(members)
}

// Update project
// PUT /api/projects/:id
func (h *Handler) Update(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	projectID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid project ID",
		})
	}

	var req UpdateProjectRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate
	if errs := validator.Validate(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"details": errs,
		})
	}

	project, err := h.service.Update(projectID, userID, req)
	if err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Project not found",
			})
		}
		if errors.Is(err, ErrNotProjectOwner) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Only project owner or admin can update",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update project",
		})
	}

	return c.JSON(project)
}

// Add project member
// POST /api/projects/:id/members
func (h *Handler) AddMember(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	projectID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid project ID",
		})
	}

	var req AddProjectMemberRequest
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

	if err := h.service.AddMember(projectID, userID, req); err != nil {
		if errors.Is(err, ErrNotProjectOwner) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Only project owner or admin can add members",
			})
		}
		if errors.Is(err, ErrAlreadyMember) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "User is already a member",
			})
		}
		if errors.Is(err, ErrInvalidMemberRole) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid member role",
			})
		}
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You are not a member of this project",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to add project member",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"status": "member added",
	})
}

// Delete project
// DELETE /api/projects/:id
func (h *Handler) Delete(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	projectID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid project ID",
		})
	}

	if err := h.service.Delete(projectID, userID); err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Project not found",
			})
		}
		if errors.Is(err, ErrNotProjectOwner) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Only project owner can delete",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete project",
		})
	}

	return c.Status(fiber.StatusNoContent).Send(nil)
}

// Remove project member
// DELETE /api/projects/:id/members/:userId
func (h *Handler) RemoveMember(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	projectID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid project ID",
		})
	}

	memberID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	if err := h.service.RemoveMember(projectID, userID, memberID); err != nil {
		if errors.Is(err, ErrNotProjectOwner) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Only project owner or admin can remove members",
			})
		}
		if errors.Is(err, ErrCannotRemoveOwner) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Cannot remove project owner",
			})
		}
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Project member not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to remove project member",
		})
	}

	return c.Status(fiber.StatusNoContent).Send(nil)
}

// Helper function
func getUserIDFromContext(c *fiber.Ctx) (uuid.UUID, error) {
	userIDStr, ok := c.Locals("userID").(string)
	if !ok {
		return uuid.Nil, errors.New("user ID not found in context")
	}
	return uuid.Parse(userIDStr)
}
