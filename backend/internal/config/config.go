package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
	S3       S3Config
	GitHub   GitHubConfig
	Admin    AdminConfig
}

type ServerConfig struct {
	Port         int
	Environment  string
	AllowOrigins []string
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

type JWTConfig struct {
	Secret      string
	ExpireHours int
}

type S3Config struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	Bucket    string
	UseSSL    bool
}

type GitHubConfig struct {
	ClientID     string
	ClientSecret string
	CallbackURL  string
}

type AdminConfig struct {
	User               string
	Password           string
	SessionTTLInMinute int
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	originsRaw := getEnv("CORS_ORIGIN", "http://localhost:3000")
	allowOrigins := normalizeOrigins(strings.Split(originsRaw, ","))

	cfg := &Config{
		Server: ServerConfig{
			Port:         getEnvAsInt("PORT", 8080),
			Environment:  getEnv("ENVIRONMENT", "development"),
			AllowOrigins: allowOrigins,
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvAsInt("DB_PORT", 5432),
			User:     getEnv("DB_USER", "devhub"),
			Password: getEnv("DB_PASSWORD", "devhub"),
			DBName:   getEnv("DB_NAME", "devhub"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnvAsInt("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		JWT: JWTConfig{
			Secret:      getEnv("JWT_SECRET", "change-me-in-production"),
			ExpireHours: getEnvAsInt("JWT_EXPIRE_HOURS", 168),
		},
		S3: S3Config{
			Endpoint:  getEnv("S3_ENDPOINT", "localhost:9000"),
			AccessKey: getEnv("S3_ACCESS_KEY", "minioadmin"),
			SecretKey: getEnv("S3_SECRET_KEY", "minioadmin"),
			Bucket:    getEnv("S3_BUCKET", "devhub"),
			UseSSL:    getEnvAsBool("S3_USE_SSL", false),
		},
		GitHub: GitHubConfig{
			ClientID:     getEnv("GITHUB_CLIENT_ID", ""),
			ClientSecret: getEnv("GITHUB_CLIENT_SECRET", ""),
			CallbackURL:  getEnv("GITHUB_CALLBACK_URL", "http://localhost:8080/api/auth/github/callback"),
		},
		Admin: AdminConfig{
			User:               getEnv("ADMIN_USER", "admin"),
			Password:           getEnv("ADMIN_PASSWORD", "admin"),
			SessionTTLInMinute: getEnvAsInt("ADMIN_SESSION_TTL_MINUTES", 60),
		},
	}

	if cfg.JWT.Secret == "change-me-in-production" && cfg.Server.Environment == "production" {
		return nil, fmt.Errorf("JWT_SECRET must be set in production")
	}

	return cfg, nil
}

func normalizeOrigins(in []string) []string {
	out := make([]string, 0, len(in))
	seen := map[string]bool{}

	for _, o := range in {
		o = strings.TrimSpace(o)
		if o == "" {
			continue
		}
		if !seen[o] {
			seen[o] = true
			out = append(out, o)
		}
	}

	return out
}

func (c *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.DBName, c.SSLMode,
	)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := getEnv(key, "")
	if value, err := strconv.ParseBool(valueStr); err == nil {
		return value
	}
	return defaultValue
}
