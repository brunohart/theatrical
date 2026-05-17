#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Restoring packages..."
dotnet restore "$ROOT_DIR/Theatrical.sln"

echo "Building..."
dotnet build "$ROOT_DIR/Theatrical.sln" --configuration Release --no-restore

echo "Running tests..."
dotnet test "$ROOT_DIR/Theatrical.sln" \
    --configuration Release \
    --no-build \
    --verbosity normal \
    --logger "console;verbosity=detailed"
