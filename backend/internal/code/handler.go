package code

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

// GET /api/projects/:projectId/repos/:repoId/branches
func (h *Handler) ListBranches(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return fiber.ErrUnauthorized
	}
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return fiber.ErrBadRequest
	}
	repoID := c.Params("repoId")
	if repoID == "" {
		return fiber.ErrBadRequest
	}

	branches, err := h.service.ListBranches(projectID, userID, repoID)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		}
		return fiber.ErrInternalServerError
	}

	return c.JSON(branches)
}

// GET /api/projects/:projectId/repos/:repoId/commits
func (h *Handler) ListCommits(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return fiber.ErrUnauthorized
	}
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return fiber.ErrBadRequest
	}
	repoID := c.Params("repoId")
	if repoID == "" {
		return fiber.ErrBadRequest
	}

	commits, err := h.service.ListCommits(projectID, userID, repoID)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		}
		return fiber.ErrInternalServerError
	}

	return c.JSON(commits)
}

// GET /api/projects/:projectId/repos/:repoId/changes
func (h *Handler) ListChanges(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return fiber.ErrUnauthorized
	}
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return fiber.ErrBadRequest
	}
	repoID := c.Params("repoId")
	if repoID == "" {
		return fiber.ErrBadRequest
	}

	changes, err := h.service.ListChanges(projectID, userID, repoID)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		}
		return fiber.ErrInternalServerError
	}

	return c.JSON(changes)
}
