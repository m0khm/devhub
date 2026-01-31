package integration

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	// Auto-migrate the integration table
	_ = db.AutoMigrate(&GitHubIntegration{})
	return &Handler{db: db}
}

// GitHubIntegration stores GitHub connection per project
type GitHubIntegration struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	ProjectID uuid.UUID `json:"project_id" gorm:"type:uuid;not null;uniqueIndex"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	Token     string    `json:"-" gorm:"not null"`
	Username  string    `json:"username"`
	AvatarURL string    `json:"avatar_url"`
}

func (GitHubIntegration) TableName() string {
	return "github_integrations"
}

type githubUser struct {
	Login     string `json:"login"`
	AvatarURL string `json:"avatar_url"`
}

type githubRepo struct {
	ID              int    `json:"id"`
	Name            string `json:"name"`
	FullName        string `json:"full_name"`
	Description     string `json:"description"`
	HTMLURL         string `json:"html_url"`
	StargazersCount int    `json:"stargazers_count"`
	Language        string `json:"language"`
	UpdatedAt       string `json:"updated_at"`
	Private         bool   `json:"private"`
}

type connectRequest struct {
	Token string `json:"token"`
}

type connectionResponse struct {
	Connected bool         `json:"connected"`
	Username  string       `json:"username,omitempty"`
	AvatarURL string       `json:"avatar_url,omitempty"`
	Repos     []githubRepo `json:"repos,omitempty"`
}

// ConnectGitHub connects a GitHub account to a project
// POST /api/projects/:projectId/integrations/github/connect
func (h *Handler) ConnectGitHub(c *fiber.Ctx) error {
	projectID := c.Params("projectId")
	userID := c.Locals("userID").(string)

	var req connectRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.Token == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Token is required"})
	}

	// Verify the token by calling GitHub API
	ghUser, err := fetchGitHubUser(req.Token)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid GitHub token: " + err.Error()})
	}

	projectUUID, _ := uuid.Parse(projectID)
	userUUID, _ := uuid.Parse(userID)

	// Upsert the integration
	var existing GitHubIntegration
	if err := h.db.Where("project_id = ?", projectUUID).First(&existing).Error; err == nil {
		existing.Token = req.Token
		existing.Username = ghUser.Login
		existing.AvatarURL = ghUser.AvatarURL
		existing.UserID = userUUID
		h.db.Save(&existing)
	} else {
		integration := GitHubIntegration{
			ProjectID: projectUUID,
			UserID:    userUUID,
			Token:     req.Token,
			Username:  ghUser.Login,
			AvatarURL: ghUser.AvatarURL,
		}
		h.db.Create(&integration)
	}

	// Fetch repos
	repos, _ := fetchGitHubRepos(req.Token)

	return c.JSON(connectionResponse{
		Connected: true,
		Username:  ghUser.Login,
		AvatarURL: ghUser.AvatarURL,
		Repos:     repos,
	})
}

// GitHubStatus returns the current GitHub connection status
// GET /api/projects/:projectId/integrations/github/status
func (h *Handler) GitHubStatus(c *fiber.Ctx) error {
	projectID := c.Params("projectId")
	projectUUID, _ := uuid.Parse(projectID)

	var integration GitHubIntegration
	if err := h.db.Where("project_id = ?", projectUUID).First(&integration).Error; err != nil {
		return c.JSON(connectionResponse{Connected: false})
	}

	// Fetch repos
	repos, _ := fetchGitHubRepos(integration.Token)

	return c.JSON(connectionResponse{
		Connected: true,
		Username:  integration.Username,
		AvatarURL: integration.AvatarURL,
		Repos:     repos,
	})
}

// DisconnectGitHub removes the GitHub integration
// DELETE /api/projects/:projectId/integrations/github
func (h *Handler) DisconnectGitHub(c *fiber.Ctx) error {
	projectID := c.Params("projectId")
	projectUUID, _ := uuid.Parse(projectID)

	h.db.Where("project_id = ?", projectUUID).Delete(&GitHubIntegration{})
	return c.JSON(fiber.Map{"message": "GitHub disconnected"})
}

func fetchGitHubUser(token string) (*githubUser, error) {
	req, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github+json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API returned %d: %s", resp.StatusCode, string(body))
	}

	var user githubUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &user, nil
}

func fetchGitHubRepos(token string) ([]githubRepo, error) {
	req, _ := http.NewRequest("GET", "https://api.github.com/user/repos?sort=updated&per_page=30", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github+json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("GitHub API returned %d", resp.StatusCode)
	}

	var repos []githubRepo
	if err := json.NewDecoder(resp.Body).Decode(&repos); err != nil {
		return nil, err
	}

	return repos, nil
}
