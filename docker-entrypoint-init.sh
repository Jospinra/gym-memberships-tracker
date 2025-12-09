#!/bin/bash
# This script is executed by Docker when the MySQL container starts
# It initializes the database if it doesn't exist

# File is sourced by MySQL entrypoint, not executed directly
# Just include the init.sql content for Docker to process

if [ ! -f /docker-entrypoint-initdb.d/init.sql ]; then
  echo "Note: init.sql should be mounted at /docker-entrypoint-initdb.d/"
fi
