#!/usr/bin/env bash
set -euo pipefail

# Apply migrations to the configured Render database before accepting traffic.
python manage.py migrate --noinput

exec daphne -b 0.0.0.0 -p "${PORT:-8000}" config.asgi:application
