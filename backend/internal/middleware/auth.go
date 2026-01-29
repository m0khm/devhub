package middleware

import (
	"log"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/m0khm/devhub/backend/internal/auth"
	"gorm.io/gorm"
)

func Auth(jwtManager *auth.JWTManager, db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Extract token from Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing authorization header",
			})
		}

		// Format: "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization header format",
			})
		}

		tokenString := parts[1]

		// Verify token
		claims, err := jwtManager.Verify(tokenString)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		// Set user info in context
		c.Locals("userID", claims.UserID.String())
		c.Locals("email", claims.Email)

		if db != nil {
			if err := updateLastIP(db, claims.UserID, clientIP(c)); err != nil {
				log.Printf("auth middleware: failed to update last_ip for user %s: %v", claims.UserID, err)
			}
		}

		return c.Next()
	}
}

func clientIP(c *fiber.Ctx) string {
	forwarded := strings.TrimSpace(c.Get("X-Forwarded-For"))
	if forwarded != "" {
		parts := strings.Split(forwarded, ",")
		if len(parts) > 0 {
			candidate := strings.TrimSpace(parts[0])
			if candidate != "" {
				return candidate
			}
		}
	}

	return c.IP()
}

func updateLastIP(db *gorm.DB, userID uuid.UUID, ip string) error {
	return db.Table("users").Where("id = ?", userID).Update("last_ip", ip).Error
}
