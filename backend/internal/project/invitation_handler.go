package project

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/m0khm/devhub/backend/internal/user"
	"github.com/m0khm/devhub/backend/pkg/validator"
)

type InvitationHandler struct {
	service *InvitationService
}

func NewInvitationHandler(service *InvitationService) *InvitationHandler {
	return &InvitationHandler{service: service}
}

// Create invitation
// POST /api/projects/:id/invitations
func (h *InvitationHandler) Create(c *fiber.Ctx) error {
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

	var req CreateProjectInvitationRequest
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

	invitation, err := h.service.Create(projectID, userID, req)
	if err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Project not found",
			})
		}
		if errors.Is(err, ErrNotProjectOwner) || errors.Is(err, ErrNotProjectMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Only project owner or admin can invite members",
			})
		}
		if errors.Is(err, ErrAlreadyMember) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "User is already a member",
			})
		}
		if errors.Is(err, ErrInvitationAlreadyExists) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Invitation already exists",
			})
		}
		if errors.Is(err, user.ErrUserNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create invitation",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(invitation)
}

// Accept invitation
// POST /api/project-invitations/:id/accept
func (h *InvitationHandler) Accept(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	invitationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid invitation ID",
		})
	}

	invitation, err := h.service.Accept(invitationID, userID)
	if err != nil {
		if errors.Is(err, ErrInvitationNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Invitation not found",
			})
		}
		if errors.Is(err, ErrInvitationNotRecipient) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You are not the recipient of this invitation",
			})
		}
		if errors.Is(err, ErrInvitationNotPending) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Invitation is no longer pending",
			})
		}
		if errors.Is(err, ErrAlreadyMember) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "User is already a member",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to accept invitation",
		})
	}

	return c.JSON(invitation)
}

// Decline invitation
// POST /api/project-invitations/:id/decline
func (h *InvitationHandler) Decline(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	invitationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid invitation ID",
		})
	}

	invitation, err := h.service.Decline(invitationID, userID)
	if err != nil {
		if errors.Is(err, ErrInvitationNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Invitation not found",
			})
		}
		if errors.Is(err, ErrInvitationNotRecipient) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You are not the recipient of this invitation",
			})
		}
		if errors.Is(err, ErrInvitationNotPending) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Invitation is no longer pending",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to decline invitation",
		})
	}

	return c.JSON(invitation)
}
