# {{REPO_NAME}}

#### Self-hosted [Zitadel](https://zitadel.com) с кастомным auth UI на Next.js.

Сервисы:
- `zitadel-api` — Zitadel core (`ghcr.io/zitadel/zitadel`)
- `zitadel-login` — стандартный Zitadel Login UI v2 (`/ui/v2/login`)
- `custom-ui` — кастомный фронт `./auth`
- `proxy` — Traefik, маршрутизация по `${ZITADEL_DOMAIN}`
- `postgres` — БД Zitadel
- `watchtower` — авто-обновление контейнеров `:latest`
---

## Подготовка

```bash
cp .env.example .env
```

В `.env` обязательно поменять перед публикацией:
- `ZITADEL_DOMAIN` — внешний домен
- `ZITADEL_MASTERKEY` — ровно 32 символа
- `POSTGRES_ADMIN_PASSWORD`, `POSTGRES_ZITADEL_PASSWORD`
- `GHCR_USERNAME`, `GHCR_TOKEN` — для автообновления по тегу `:latest`

## Запуск

Prod (Из контейнера):

```bash
docker compose --profile prod pull
docker compose --profile prod up -d --no-build
```

Prod (Локально):

```bash
docker compose --profile prod up -d --build
```

Dev (hot reload):

```bash
docker compose --profile dev up -d --build
```

## Другие возможности

```bash
docker compose ps # Проверка запуска из контейнера или локально
docker compose logs watchtower -f --tail 50 # Логи
```

## Обновление

`watchtower` опрашивает GHCR каждые `WATCHTOWER_POLL_INTERVAL` секунд и пересоздаёт контейнеры с label `watchtower.enable=true` при появлении нового `:latest`.

Версия Zitadel пинится в `.env` (`ZITADEL_VERSION`). Для апгрейда — поменять переменную и:

```bash
docker compose pull zitadel-api zitadel-login
docker compose up -d --wait zitadel-api zitadel-login
```

## Миграция zitadel

Перед миграцией нужно запустить все контейнеры
Делается через Admin API из директории `auth/`:

```bash
cd auth
make zitadel-export ZITADEL_TOKEN=<PAT-от-IAM_OWNER> ZITADEL_DOMAIN=
make zitadel-import ZITADEL_TOKEN=<PAT-от-IAM_OWNER> ZITADEL_DOMAIN=

make zitadel-export ZITADEL_TOKEN=$(cat ./pat.txt) ZITADEL_DOMAIN=zitadel-domain.show.ru
make zitadel-import ZITADEL_TOKEN=$(cat ./pat.txt) ZITADEL_DOMAIN=zitadel-domain.show.ru
```

PAT создаётся в Zitadel-консоли для service user с ролью `IAM_OWNER`.  
[Подробнее - zitadel migration guide](https://zitadel.com/docs/guides/migrate/sources/zitadel)