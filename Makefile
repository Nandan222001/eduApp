.PHONY: help build deploy rollback backup restore health migrate clean

help:
	@echo "FastAPI Deployment Makefile"
	@echo ""
	@echo "Available commands:"
	@echo "  make build ENV=<env>      - Build Docker image"
	@echo "  make deploy ENV=<env>     - Deploy to AWS"
	@echo "  make rollback ENV=<env>   - Rollback deployment"
	@echo "  make backup ENV=<env>     - Create database backup"
	@echo "  make restore ENV=<env>    - Restore database"
	@echo "  make health ENV=<env>     - Run health checks"
	@echo "  make migrate ENV=<env>    - Run database migrations"
	@echo "  make logs ENV=<env>       - View application logs"
	@echo "  make shell ENV=<env>      - Open shell in running container"
	@echo "  make clean                - Clean local Docker resources"
	@echo ""
	@echo "Terraform commands:"
	@echo "  make tf-init              - Initialize Terraform"
	@echo "  make tf-plan              - Run Terraform plan"
	@echo "  make tf-apply             - Apply Terraform changes"
	@echo "  make tf-destroy           - Destroy Terraform resources"
	@echo ""
	@echo "Example: make deploy ENV=prod"

# Variables
ENV ?= staging
PROJECT_NAME = fastapi-app
AWS_REGION = us-east-1

build:
	@echo "Building Docker image for $(ENV)..."
	docker build -f Dockerfile.prod -t $(PROJECT_NAME):latest .

deploy:
	@echo "Deploying to $(ENV)..."
	chmod +x scripts/deployment/deploy.sh
	./scripts/deployment/deploy.sh $(ENV)

rollback:
	@echo "Rolling back $(ENV)..."
	chmod +x scripts/deployment/rollback.sh
	./scripts/deployment/rollback.sh $(ENV)

backup:
	@echo "Creating backup for $(ENV)..."
	chmod +x scripts/deployment/backup-database.sh
	./scripts/deployment/backup-database.sh $(ENV)

restore:
	@echo "Restoring database for $(ENV)..."
	@read -p "Enter snapshot ID: " SNAPSHOT_ID; \
	chmod +x scripts/deployment/restore-database.sh; \
	./scripts/deployment/restore-database.sh $(ENV) $$SNAPSHOT_ID

health:
	@echo "Running health checks for $(ENV)..."
	chmod +x scripts/deployment/health-check.sh
	./scripts/deployment/health-check.sh $(ENV)

migrate:
	@echo "Running migrations for $(ENV)..."
	chmod +x scripts/deployment/migrate.sh
	./scripts/deployment/migrate.sh $(ENV)

logs:
	@echo "Fetching logs for $(ENV)..."
	aws logs tail /ecs/$(PROJECT_NAME)-$(ENV) --follow --region $(AWS_REGION)

shell:
	@echo "Opening shell in $(ENV) container..."
	TASK_ID=$$(aws ecs list-tasks --cluster $(PROJECT_NAME)-$(ENV)-cluster --query 'taskArns[0]' --output text | rev | cut -d'/' -f1 | rev); \
	aws ecs execute-command \
		--cluster $(PROJECT_NAME)-$(ENV)-cluster \
		--task $$TASK_ID \
		--container $(PROJECT_NAME)-app \
		--interactive \
		--command "/bin/bash"

clean:
	@echo "Cleaning local Docker resources..."
	docker system prune -af
	docker volume prune -f

# Terraform commands
tf-init:
	@echo "Initializing Terraform..."
	cd terraform && terraform init

tf-plan:
	@echo "Running Terraform plan..."
	cd terraform && terraform plan

tf-apply:
	@echo "Applying Terraform changes..."
	cd terraform && terraform apply

tf-destroy:
	@echo "Destroying Terraform resources..."
	cd terraform && terraform destroy

# Local development
dev:
	@echo "Starting local development environment..."
	docker-compose up -d

dev-logs:
	@echo "Following development logs..."
	docker-compose logs -f

dev-down:
	@echo "Stopping local development environment..."
	docker-compose down

# Setup SSL
setup-ssl:
	@read -p "Enter domain name: " DOMAIN; \
	read -p "Enter email address: " EMAIL; \
	chmod +x scripts/deployment/setup-ssl.sh; \
	./scripts/deployment/setup-ssl.sh $$DOMAIN $$EMAIL

# Production docker-compose
prod-up:
	@echo "Starting production environment..."
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	@echo "Stopping production environment..."
	docker-compose -f docker-compose.prod.yml down

prod-logs:
	@echo "Following production logs..."
	docker-compose -f docker-compose.prod.yml logs -f
