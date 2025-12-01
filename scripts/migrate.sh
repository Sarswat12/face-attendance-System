#!/usr/bin/env bash
# Cross-platform helper for Flask-Migrate (Unix/macOS)
set -euo pipefail

ACTION=${1:-}
MSG=${2:-}

if [ -z "$ACTION" ]; then
  echo "Usage: $0 <init|migrate|upgrade|downgrade> [message]"
  exit 1
fi

export FLASK_APP=manage

case "$ACTION" in
  init)
    flask db init
    ;;
  migrate)
    if [ -z "$MSG" ]; then
      echo "Provide a migration message: $0 migrate \"message\""
      exit 1
    fi
    flask db migrate -m "$MSG"
    ;;
  upgrade)
    flask db upgrade
    ;;
  downgrade)
    flask db downgrade
    ;;
  *)
    echo "Unknown action: $ACTION"
    exit 1
    ;;
esac

echo "Done. REMEMBER: BACKUP your database before applying migrations."
