#!/bin/sh
# Run the migration and send the log to the migration log.
npm run migrate:production > ${DASHBOARD_LOGS}migration.log
# Serve the dashboard.
node server/index.js