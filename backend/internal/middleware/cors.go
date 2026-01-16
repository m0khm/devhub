package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func CORS(allowOrigins []string) fiber.Handler {
	// На всякий — убираем пробелы и пустые
	clean := make([]string, 0, len(allowOrigins))
	for _, o := range allowOrigins {
		o = strings.TrimSpace(o)
		if o != "" {
			clean = append(clean, o)
		}
	}

	return cors.New(cors.Config{
		AllowOrigins: strings.Join(clean, ","),
		AllowMethods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",

		// JWT через Authorization header, поэтому cookie не нужны
		AllowCredentials: false,
	})
}
