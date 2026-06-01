#!/usr/bin/env sh
set -e

# Применяем миграции БД перед стартом (см. ТЗ п. 14.5).
echo "Running migrations..."
alembic upgrade head

# Идемпотентный сидинг справочника упражнений.
echo "Seeding exercise catalog..."
python -m app.seed || echo "Seed skipped"

echo "Starting API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers
