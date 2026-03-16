#!/usr/bin/env sh
set -eu

# Ensure mounted volume is writable for the non-root runtime user.
mkdir -p /app/data
chown -R pwuser:pwuser /app/data || true

exec gosu pwuser "$@"
