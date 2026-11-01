.PHONY: up down logs rebuild reset

up:
	@cp -n .env.example .env || true
	docker compose up --build -d
	@echo "Open http://localhost:5173"

down:
	docker compose down

logs:
	docker compose logs -f

rebuild:
	docker compose up --build -V -d

reset:
	docker compose down -v
