package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/YOUR_USERNAME/devhub/backend/internal/auth"
)

func Auth(jwtManager *auth.JWTManager) fiber.Handler {
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

		return c.Next()
	}
}
