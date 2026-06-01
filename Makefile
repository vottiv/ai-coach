.PHONY: up down build logs migrate revision seed test lint fmt

up:
	docker compose up -d --build

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f api

migrate:
	docker compose run --rm api alembic upgrade head

revision:
	docker compose run --rm api alembic revision --autogenerate -m "$(m)"

test:
	cd backend && pytest -q

lint:
	cd backend && ruff check . && mypy app
	cd frontend && npm run lint && npm run typecheck

fmt:
	cd backend && ruff format . && ruff check --fix .
