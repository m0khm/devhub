package deploy

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

// POST /api/projects/:projectId/deploy/servers
func (h *Handler) CreateServer(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return fiber.ErrUnauthorized
	}
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return fiber.ErrBadRequest
	}

	var req CreateDeployServerRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.ErrBadRequest
	}
	if errs := validator.Validate(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": errs})
	}

	server, err := h.service.CreateServer(projectID, userID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotProjectMember):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		case errors.Is(err, ErrNotProjectAdmin):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Insufficient permissions"})
		case errors.Is(err, ErrInvalidHost):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid host"})
		default:
			return fiber.ErrInternalServerError
		}
	}

	return c.Status(fiber.StatusCreated).JSON(server.ToResponse())
}

// GET /api/projects/:projectId/deploy/servers
func (h *Handler) ListServers(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return fiber.ErrUnauthorized
	}
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return fiber.ErrBadRequest
	}

	servers, err := h.service.ListServers(projectID, userID)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		}
		return fiber.ErrInternalServerError
	}

	responses := make([]DeployServerResponse, 0, len(servers))
	for _, server := range servers {
		responses = append(responses, server.ToResponse())
	}

	return c.JSON(responses)
}

// GET /api/projects/:projectId/deploy/servers/:serverId
func (h *Handler) GetServer(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return fiber.ErrUnauthorized
	}
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return fiber.ErrBadRequest
	}
	serverID, err := uuid.Parse(c.Params("serverId"))
	if err != nil {
		return fiber.ErrBadRequest
	}

	server, err := h.service.GetServer(projectID, serverID, userID)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		}
		if errors.Is(err, ErrServerNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Server not found"})
		}
		return fiber.ErrInternalServerError
	}

	return c.JSON(server.ToResponse())
}

// DELETE /api/projects/:projectId/deploy/servers/:serverId
func (h *Handler) DeleteServer(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return fiber.ErrUnauthorized
	}
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return fiber.ErrBadRequest
	}
	serverID, err := uuid.Parse(c.Params("serverId"))
	if err != nil {
		return fiber.ErrBadRequest
	}

	if err := h.service.DeleteServer(projectID, serverID, userID); err != nil {
		switch {
		case errors.Is(err, ErrNotProjectMember):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		case errors.Is(err, ErrNotProjectAdmin):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Insufficient permissions"})
		case errors.Is(err, ErrServerNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Server not found"})
		default:
			return fiber.ErrInternalServerError
		}
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// POST /api/projects/:projectId/deploy/servers/:serverId/test
func (h *Handler) TestServerConnection(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return fiber.ErrUnauthorized
	}
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return fiber.ErrBadRequest
	}
	serverID, err := uuid.Parse(c.Params("serverId"))
	if err != nil {
		return fiber.ErrBadRequest
	}

	response, err := h.service.TestServerConnection(projectID, serverID, userID)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotProjectMember):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		case errors.Is(err, ErrNotProjectAdmin):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Insufficient permissions"})
		case errors.Is(err, ErrServerNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Server not found"})
		default:
			return fiber.ErrInternalServerError
		}
	}

	return c.JSON(response)
}

// GET /api/projects/:projectId/deploy/settings
func (h *Handler) GetSettings(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return fiber.ErrUnauthorized
	}
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return fiber.ErrBadRequest
	}

	settings, err := h.service.GetSettings(projectID, userID)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		}
		if errors.Is(err, ErrSettingsNotFound) {
			return c.JSON(DeploySettingsResponse{
				ProjectID:    projectID,
				Strategy:     "",
				BuildCommand: "",
			})
		}
		return fiber.ErrInternalServerError
	}

	return c.JSON(settings.ToResponse())
}

// PUT /api/projects/:projectId/deploy/settings
func (h *Handler) UpdateSettings(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return fiber.ErrUnauthorized
	}
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return fiber.ErrBadRequest
	}

	var req DeploySettingsRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.ErrBadRequest
	}
	if errs := validator.Validate(req); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": errs})
	}

	settings, err := h.service.UpdateSettings(projectID, userID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotProjectMember):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		case errors.Is(err, ErrNotProjectAdmin):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Insufficient permissions"})
		default:
			return fiber.ErrInternalServerError
		}
	}

	return c.JSON(settings.ToResponse())
}

// GET /api/projects/:projectId/deploy/env
func (h *Handler) ListEnvVars(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return fiber.ErrUnauthorized
	}
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return fiber.ErrBadRequest
	}

	vars, err := h.service.ListEnvVars(projectID, userID)
	if err != nil {
		if errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		}
		return fiber.ErrInternalServerError
	}

	return c.JSON(vars)
}

// PUT /api/projects/:projectId/deploy/env
func (h *Handler) ReplaceEnvVars(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return fiber.ErrUnauthorized
	}
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return fiber.ErrBadRequest
	}

	var req struct {
		Vars []DeployEnvVarInput `json:"vars"`
	}
	if err := c.BodyParser(&req); err != nil {
		return fiber.ErrBadRequest
	}

	for _, envVar := range req.Vars {
		if errs := validator.Validate(envVar); len(errs) > 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": errs})
		}
	}

	vars, err := h.service.ReplaceEnvVars(projectID, userID, req.Vars)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotProjectMember):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not a project member"})
		case errors.Is(err, ErrNotProjectAdmin):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Insufficient permissions"})
		default:
			return fiber.ErrBadRequest
		}
	}

	return c.JSON(vars)
}
