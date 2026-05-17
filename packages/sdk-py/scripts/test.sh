#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

echo "Running type checks..."
python -m mypy theatrical

echo ""
echo "Running linter..."
python -m ruff check theatrical tests

echo ""
echo "Running tests with coverage..."
python -m pytest --cov=theatrical --cov-report=term-missing -v
