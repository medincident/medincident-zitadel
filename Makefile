.DEFAULT_GOAL := help

COMPOSE_PROD := docker compose --profile prod
COMPOSE_DEV  := docker compose --profile dev

.PHONY: help \
        ui-build ui-pull ui-down ui-logs ui-restart \
        dev dev-down dev-logs \
        up down ps logs

help: ## Показать список команд
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ──────────── custom-ui (prod) ────────────

ui-build: ## Собрать custom-ui локально (--build, без pull из GHCR)
	$(COMPOSE_PROD) up custom-ui --build --pull never -d

ui-pull: ## Подтянуть свежий custom-ui из GHCR (--pull always)
	$(COMPOSE_PROD) up custom-ui --pull always -d

ui-down: ## Остановить и удалить custom-ui
	$(COMPOSE_PROD) stop custom-ui
	$(COMPOSE_PROD) rm -f custom-ui

ui-restart: ui-down ui-build ## Передеплой custom-ui с локальной пересборкой

ui-logs: ## Логи custom-ui (follow)
	$(COMPOSE_PROD) logs -f custom-ui

# ──────────── dev профиль ────────────

dev: ## Поднять dev-окружение (custom-ui-dev с hot reload)
	$(COMPOSE_DEV) up -d --build

dev-down: ## Остановить dev-окружение
	$(COMPOSE_DEV) down

dev-logs: ## Логи custom-ui-dev (follow)
	$(COMPOSE_DEV) logs -f custom-ui-dev

# ──────────── общие ────────────

up: ## Поднять весь prod-стек
	$(COMPOSE_PROD) up -d

down: ## Остановить весь prod-стек (без удаления volumes)
	$(COMPOSE_PROD) down

ps: ## Статус контейнеров prod
	$(COMPOSE_PROD) ps

logs: ## Логи всего prod-стека (follow)
	$(COMPOSE_PROD) logs -f
