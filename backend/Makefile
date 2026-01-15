.PHONY: help run migrate-up migrate-down migrate-reset test clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

run: ## Run API server
	go run cmd/api/main.go

migrate-up: ## Run migrations
	go run cmd/migrate/main.go -command=up

migrate-down: ## Rollback migrations
	go run cmd/migrate/main.go -command=down

migrate-reset: ## Reset database (down + up)
	go run cmd/migrate/main.go -command=reset

test: ## Run tests
	go test -v ./...

clean: ## Clean build artifacts
	rm -rf tmp/
	go clean

deps: ## Download dependencies
	go mod download
	go mod tidy

docker-up: ## Start docker services
	cd .. && docker-compose up -d

docker-down: ## Stop docker services
	cd .. && docker-compose down

docker-logs: ## Show docker logs
	cd .. && docker-compose logs -f

.DEFAULT_GOAL := help
