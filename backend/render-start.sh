#!/usr/bin/env bash
set -euo pipefail

# Render's SQLite database is created without Django tables on a fresh deploy.
# Apply migrations before accepting HTTP or WebSocket traffic.
python manage.py migrate --noinput

exec daphne -b 0.0.0.0 -p "${PORT:-8000}" config.asgi:application
