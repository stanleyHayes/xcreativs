.PHONY: build run dev test test-cover migrate-up migrate-down migrate-force migrate-version migrate-create seed lint fmt vet openapi clean docker-build

# Location of SQL migrations and seed data (repo root, one level up from backend/)
MIGRATIONS_DIR ?= ../migrations
SEEDS_DIR ?= ../seeds

# Load DB_URL from .env for migrate/seed targets
LOAD_ENV := set -a && . ./.env && set +a

# Build the application binary
build:
	go build -o bin/api ./cmd/api

# Run the application (requires .env)
run: build
	set -a && source .env && set +a && ./bin/api

# Run with hot reload (requires air)
dev:
	air -c .air.toml

# Run tests
test:
	go test -v ./...

# Run tests with coverage
test-cover:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Linting and formatting
lint:
	golangci-lint run ./...

fmt:
	go fmt ./...

vet:
	go vet ./...

# Regenerate the OpenAPI spec (embedded + served at /docs) and Postman collection
# from the live router.
openapi:
	go run ./cmd/genopenapi > internal/apispec/openapi.yaml
	go run ./cmd/genopenapi postman > ../docs/postman_collection.json
	@echo "regenerated internal/apispec/openapi.yaml + docs/postman_collection.json"

# Database migrations (golang-migrate CLI required: brew install golang-migrate)
migrate-up:
	$(LOAD_ENV) && migrate -path $(MIGRATIONS_DIR) -database "$$DB_URL" up

migrate-down:
	$(LOAD_ENV) && migrate -path $(MIGRATIONS_DIR) -database "$$DB_URL" down 1

# Reset a failed/dirty migration to a known version: make migrate-force VERSION=14
migrate-force:
	$(LOAD_ENV) && migrate -path $(MIGRATIONS_DIR) -database "$$DB_URL" force $(VERSION)

migrate-version:
	$(LOAD_ENV) && migrate -path $(MIGRATIONS_DIR) -database "$$DB_URL" version

# Create a new sequential migration pair: make migrate-create name=add_widgets
migrate-create:
	migrate create -ext sql -dir $(MIGRATIONS_DIR) -seq $(name)

# Seed development data (run once against a freshly migrated database)
seed:
	$(LOAD_ENV) && psql "$$DB_URL" \
		-f $(SEEDS_DIR)/seed.sql \
		-f $(SEEDS_DIR)/seed_layer_six.sql \
		-f scripts/seed_assessment.sql \
		-f scripts/seed_ai_maturity.sql \
		-f $(SEEDS_DIR)/seed_phase_b.sql

# Clean build artifacts
clean:
	rm -rf bin/ tmp/ coverage.out coverage.html

# Docker
docker-build:
	docker build --target production -t xcreatives-api .
