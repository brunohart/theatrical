#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

rm -rf dist/ build/ *.egg-info

echo "Building sdist and wheel..."
python -m build

echo ""
echo "Packages:"
ls -la dist/

echo ""
echo "Checking with twine..."
python -m twine check dist/*

echo ""
echo "To publish to TestPyPI:"
echo "  python -m twine upload --repository testpypi dist/*"
echo ""
echo "To publish to PyPI:"
echo "  python -m twine upload dist/*"
