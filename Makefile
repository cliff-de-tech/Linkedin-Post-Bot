# =============================================================================
# PostBot - Docker Development Commands
# =============================================================================
#
# Usage: make <command>
#
# Run `make help` to see all available commands.
#
# Prerequisites:
#   - Docker & Docker Compose installed
#   - .env file configured (copy from .env.example)
#
# =============================================================================

.PHONY: help up down logs restart build worker-logs beat-logs migrate test shell clean prune redis-cli status

.DEFAULT_GOAL := help

# Colors for terminal output
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

# =============================================================================
# HELP
# =============================================================================

help: ## Show this help message
	@echo ""
	@echo "$(CYAN)PostBot - Docker Development Commands$(RESET)"
	@echo "======================================="
	@echo ""
	@echo "$(GREEN)Quick Start:$(RESET)"
	@echo "  1. Copy .env.example to .env and configure"
	@echo "  2. Run: make up"
	@echo "  3. Open: http://localhost:3000"
	@echo ""
	@echo "$(GREEN)Available Commands:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-15s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# DOCKER COMPOSE COMMANDS
# =============================================================================

up: ## Start the entire stack (detached mode)
	@echo "$(GREEN)Starting PostBot stack...$(RESET)"
	docker-compose up -d
	@echo ""
	@echo "$(GREEN)✓ Stack started!$(RESET)"
	@echo "  Frontend:  http://localhost:3000"
	@echo "  Backend:   http://localhost:8000"
	@echo "  API Docs:  http://localhost:8000/docs"
	@echo ""
	@echo "$(YELLOW)Tip: Run 'make logs' to see output$(RESET)"

down: ## Stop the entire stack
	@echo "$(RED)Stopping PostBot stack...$(RESET)"
	docker-compose down
	@echo "$(GREEN)✓ Stack stopped$(RESET)"

restart: ## Restart all services
	@echo "$(YELLOW)Restarting PostBot stack...$(RESET)"
	docker-compose restart
	@echo "$(GREEN)✓ Stack restarted$(RESET)"

build: ## Rebuild all Docker images (use after requirements.txt changes)
	@echo "$(YELLOW)Rebuilding Docker images...$(RESET)"
	docker-compose build --no-cache
	@echo "$(GREEN)✓ Images rebuilt$(RESET)"

status: ## Show status of all containers
	@echo "$(CYAN)Container Status:$(RESET)"
	docker-compose ps

# =============================================================================
# LOGS
# =============================================================================

logs: ## Tail logs for all services
	docker-compose logs -f

worker-logs: ## Tail Celery worker logs (for debugging background tasks)
	@echo "$(CYAN)Tailing Celery worker logs...$(RESET)"
	docker-compose logs -f worker

beat-logs: ## Tail Celery beat scheduler logs
	@echo "$(CYAN)Tailing Celery beat logs...$(RESET)"
	docker-compose logs -f beat

backend-logs: ## Tail backend API logs
	docker-compose logs -f backend

frontend-logs: ## Tail frontend logs
	docker-compose logs -f frontend

# =============================================================================
# DATABASE & MIGRATIONS
# =============================================================================

migrate: ## Run Alembic migrations inside the backend container
	@echo "$(YELLOW)Running database migrations...$(RESET)"
	docker-compose exec backend alembic upgrade head
	@echo "$(GREEN)✓ Migrations complete$(RESET)"

migrate-create: ## Create a new migration (usage: make migrate-create MSG="add user table")
	@echo "$(YELLOW)Creating new migration...$(RESET)"
	docker-compose exec backend alembic revision --autogenerate -m "$(MSG)"
	@echo "$(GREEN)✓ Migration created$(RESET)"

migrate-history: ## Show migration history
	docker-compose exec backend alembic history

# =============================================================================
# TESTING
# =============================================================================

test: ## Run backend tests (pytest)
	@echo "$(CYAN)Running backend tests...$(RESET)"
	docker-compose exec backend pytest -v
	@echo "$(GREEN)✓ Tests complete$(RESET)"

test-cov: ## Run tests with coverage report
	@echo "$(CYAN)Running tests with coverage...$(RESET)"
	docker-compose exec backend pytest --cov=. --cov-report=term-missing

# =============================================================================
# SHELL ACCESS
# =============================================================================

shell: ## Open a bash shell inside the backend container
	@echo "$(CYAN)Opening shell in backend container...$(RESET)"
	docker-compose exec backend /bin/bash

shell-frontend: ## Open a shell inside the frontend container
	docker-compose exec frontend /bin/sh

redis-cli: ## Open Redis CLI
	@echo "$(CYAN)Opening Redis CLI...$(RESET)"
	docker-compose exec redis redis-cli

# =============================================================================
# CLEANUP
# =============================================================================

clean: ## Stop stack and remove volumes (WARNING: deletes data)
	@echo "$(RED)Stopping stack and removing volumes...$(RESET)"
	docker-compose down -v
	@echo "$(GREEN)✓ Stack stopped and volumes removed$(RESET)"

prune: ## Remove unused Docker resources
	@echo "$(YELLOW)Pruning unused Docker resources...$(RESET)"
	docker system prune -f
	@echo "$(GREEN)✓ Cleanup complete$(RESET)"

# =============================================================================
# DEVELOPMENT SHORTCUTS
# =============================================================================

dev-backend: ## Start only backend services (redis + backend + worker + beat)
	docker-compose up -d redis backend worker beat

dev-frontend: ## Start only frontend (assumes backend is running elsewhere)
	docker-compose up -d frontend

# =============================================================================
# HEALTH CHECKS
# =============================================================================

health: ## Check health of all services
	@echo "$(CYAN)Checking service health...$(RESET)"
	@echo ""
	@echo "Backend API:"
	@curl -s http://localhost:8000/health | python -m json.tool 2>/dev/null || echo "  $(RED)✗ Not responding$(RESET)"
	@echo ""
	@echo "Redis:"
	@docker-compose exec -T redis redis-cli ping 2>/dev/null || echo "  $(RED)✗ Not responding$(RESET)"
	@echo ""
	@echo "Frontend:"
	@curl -s -o /dev/null -w "  Status: %{http_code}\n" http://localhost:3000 2>/dev/null || echo "  $(RED)✗ Not responding$(RESET)"
