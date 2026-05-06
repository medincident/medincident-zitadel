DC := cd .. && docker compose

.PHONY: dev build start lint clean reinstall \
        up up-dev down down-dev logs logs-dev logs-tail \
        rebuild rebuild-dev cache ps \
        proto-update proto-generate \
        zitadel-export zitadel-import

# ─── Локальная разработка ──────────────────────────────────────────────────

dev:
	bun run dev

build:
	bun run build

start:
	bun run start

lint:
	bun run lint

# Сбросить зависимости и .next, переустановить
reinstall:
	rm -rf .next node_modules
	bun install

# ─── Docker — prod ─────────────────────────────────────────────────────────

up:
	$(DC) --profile prod up custom-ui --force-recreate --build -d

down:
	$(DC) down custom-ui

logs:
	$(DC) logs custom-ui -f

logs-tail:
	$(DC) logs custom-ui -f --tail 200

# Очистить Next.js кэш и пересобрать
rebuild: clear-cache
	$(DC) --profile prod up custom-ui --force-recreate --build -d

# ─── Docker — dev ──────────────────────────────────────────────────────────

up-dev:
	$(DC) --profile dev up custom-ui-dev --force-recreate --build -d

down-dev:
	$(DC) down custom-ui-dev

logs-dev:
	$(DC) logs custom-ui-dev -f

rebuild-dev: clear-cache
	$(DC) --profile dev up custom-ui-dev --force-recreate --build -d

# ─── Общее ─────────────────────────────────────────────────────────────────

# Статус всех контейнеров
ps:
	$(DC) ps

# Очистить только кэш Next.js (без пересборки)
clear-cache:
	rm -rf .next/cache

# ─── Protobuf ──────────────────────────────────────────────────────────────

proto-update:
	bun run proto:update

proto-generate:
	bun run proto:generate

# ─── Zitadel — экспорт/импорт конфигурации ─────────────────────────────────
#
# Запрос исполняется bun-ом внутри custom-ui контейнера — он в сети `zitadel`
# и видит zitadel-api по DNS. Zitadel матчит инстанс по Host-у, поэтому
# обязательно передаём ZITADEL_DOMAIN.
#
# Аргументы (можно переопределить):
#   ZITADEL_HOST     адрес API. Default: zitadel-api:8080 (внутр. сеть)
#   ZITADEL_DOMAIN   значение HTTP Host (обязателен)
#   ZITADEL_FILE     путь к JSON. Default: ../zitadel-export.json (корень репо)
#   ZITADEL_TOKEN    PAT сервисного юзера с IAM_OWNER (обязателен)
#   ZITADEL_SERVICE  имя сервиса compose. Default: custom-ui
#
# Примеры:
#   make zitadel-export ZITADEL_TOKEN=$$(cat ./pat.txt) ZITADEL_DOMAIN=zitadel.example.com
#   make zitadel-import ZITADEL_TOKEN=$$(cat ./pat.txt) ZITADEL_DOMAIN=zitadel.example.com
#
ZITADEL_HOST    ?= zitadel-api:8080
ZITADEL_DOMAIN  ?=
ZITADEL_FILE    ?= ../zitadel-export.json
ZITADEL_TOKEN   ?=
ZITADEL_SERVICE ?= custom-ui

zitadel_url = $(if $(findstring ://,$(ZITADEL_HOST)),$(ZITADEL_HOST),http://$(ZITADEL_HOST))
ZITADEL_EXPORT_JS = fetch("$(zitadel_url)/admin/v1/export", { method: "POST", headers: { "Authorization": "Bearer $(ZITADEL_TOKEN)", "Content-Type": "application/json", "Host": "$(ZITADEL_DOMAIN)" }, body: JSON.stringify({withPasswords: true, withOtp: true, timeout: "10m"}) }).then(r => r.text()).then(console.log)
ZITADEL_IMPORT_JS = const body = await Bun.stdin.text(); const r = await fetch("$(zitadel_url)/admin/v1/import", { method: "POST", headers: { "Authorization": "Bearer $(ZITADEL_TOKEN)", "Content-Type": "application/json", "Host": "$(ZITADEL_DOMAIN)" }, body }); process.stdout.write(await r.text()); if (!r.ok) process.exit(1);

# https://zitadel.com/docs/guides/migrate/sources/zitadel#export-to-file
zitadel-export:
	@test -n "$(ZITADEL_TOKEN)"  || { echo "ZITADEL_TOKEN is required (PAT of IAM_OWNER service user)"; exit 1; }
	@test -n "$(ZITADEL_DOMAIN)" || { echo "ZITADEL_DOMAIN is required (Zitadel matches instance by Host header)"; exit 1; }
	@mkdir -p $(dir $(abspath $(ZITADEL_FILE)))
	$(DC) exec -T $(ZITADEL_SERVICE) bun -e '$(ZITADEL_EXPORT_JS)' > $(abspath $(ZITADEL_FILE))
	@echo "Exported -> $(abspath $(ZITADEL_FILE))"

# https://zitadel.com/docs/guides/migrate/sources/zitadel#import-from-file
zitadel-import:
	@test -n "$(ZITADEL_TOKEN)"  || { echo "ZITADEL_TOKEN is required"; exit 1; }
	@test -n "$(ZITADEL_DOMAIN)" || { echo "ZITADEL_DOMAIN is required"; exit 1; }
	@test -f $(abspath $(ZITADEL_FILE)) || { echo "$(abspath $(ZITADEL_FILE)) not found"; exit 1; }
	$(DC) exec -T $(ZITADEL_SERVICE) bun -e '$(ZITADEL_IMPORT_JS)' < $(abspath $(ZITADEL_FILE))
	@echo "Imported <- $(abspath $(ZITADEL_FILE))"
