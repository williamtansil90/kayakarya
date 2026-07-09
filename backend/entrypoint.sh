#!/bin/sh
set -e

echo "Running database migration..."
python migrate.py

echo "Starting Gunicorn..."
exec gunicorn --bind 0.0.0.0:8702 --workers 2 --timeout 120 "app:create_app()"
