package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/m0khm/devhub/backend/internal/config"
	"github.com/m0khm/devhub/backend/internal/database"
	"gorm.io/gorm"
)

func main() {
	var command string
	flag.StringVar(&command, "command", "", "Migration command: up, down, reset")
	flag.Parse()

	if command == "" {
		log.Fatal("Please provide -command flag: up, down, or reset")
	}

	// Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	db, err := database.ConnectPostgres(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	switch command {
	case "up":
		if err := migrateUp(db); err != nil {
			log.Fatalf("Migration up failed: %v", err)
		}
		log.Println("✅ Migration completed successfully")
	case "down":
		if err := migrateDown(db); err != nil {
			log.Fatalf("Migration down failed: %v", err)
		}
		log.Println("✅ Rollback completed successfully")
	case "reset":
		if err := migrateDown(db); err != nil {
			log.Fatalf("Migration reset (down) failed: %v", err)
		}
		if err := migrateUp(db); err != nil {
			log.Fatalf("Migration reset (up) failed: %v", err)
		}
		log.Println("✅ Database reset completed successfully")
	default:
		log.Fatalf("Unknown command: %s. Use: up, down, or reset", command)
	}
}

func migrateUp(db *gorm.DB) error {
	// Read and execute migration file
	sql, err := os.ReadFile("migrations/001_initial.up.sql")
	if err != nil {
		return fmt.Errorf("failed to read migration file: %w", err)
	}

	if err := db.Exec(string(sql)).Error; err != nil {
		return fmt.Errorf("failed to execute migration: %w", err)
	}

	return nil
}

func migrateDown(db *gorm.DB) error {
	// Read and execute rollback file
	sql, err := os.ReadFile("migrations/001_initial.down.sql")
	if err != nil {
		return fmt.Errorf("failed to read rollback file: %w", err)
	}

	if err := db.Exec(string(sql)).Error; err != nil {
		return fmt.Errorf("failed to execute rollback: %w", err)
	}

	return nil
}
