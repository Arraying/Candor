#!/bin/sh
# Run the migration and send the log to the migration log.
npm run --silent migrate:production
# Serve the dashboard. Need to exec to become PID 1 so SIGINT and SIGTERM work.
exec node server/index.js
