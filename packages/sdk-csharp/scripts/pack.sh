#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/artifacts"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

echo "Building Theatrical.Sdk..."
dotnet build "$ROOT_DIR/src/Theatrical.Sdk/Theatrical.Sdk.csproj" \
    --configuration Release \
    --no-restore

echo "Packing Theatrical.Sdk..."
dotnet pack "$ROOT_DIR/src/Theatrical.Sdk/Theatrical.Sdk.csproj" \
    --configuration Release \
    --no-build \
    --output "$OUTPUT_DIR"

echo ""
echo "Packages:"
ls -la "$OUTPUT_DIR"/*.nupkg "$OUTPUT_DIR"/*.snupkg 2>/dev/null || true

echo ""
echo "To publish (requires API key):"
echo "  dotnet nuget push $OUTPUT_DIR/*.nupkg --api-key \$NUGET_API_KEY --source https://api.nuget.org/v3/index.json"
