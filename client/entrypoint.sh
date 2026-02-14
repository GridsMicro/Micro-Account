#!/bin/sh
# entrypoint.sh - bootstrap node_modules for dev and run appropriate command
set -e

cd /app || exit 1

if [ "$NODE_ENV" = "development" ]; then
  echo "Running in development mode"
  if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "node_modules not present, installing..."
    npm ci --silent
  fi
  exec npm run dev
else
  echo "Running in production mode"
  exec npm run start
fi
