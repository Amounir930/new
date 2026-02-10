#!/bin/bash
echo "🛡️  Apex v2 Pre-Commit Security Shield"

# 1. Run AST-based Security Scan
echo "🔍 Running AST Security Scanner..."
bun run scripts/check-s2-isolation.ts
AST_EXIT_CODE=$?

if [ $AST_EXIT_CODE -ne 0 ]; then
    echo "❌ AST Security Check Failed. Fix violations before committing."
    exit 1
fi

# 2. Run Gitleaks (via Docker)
echo "🔑 Running Gitleaks (Secret Detection)..."
if command -v docker &> /dev/null; then
    docker run --rm -v "$(pwd):/code" zricethezav/gitleaks:latest protect --source="/code" --staged --verbose --redact
    GITLEAKS_EXIT_CODE=$?
else
    echo "⚠️  Docker not found. Skipping Gitleaks check."
    echo "   Please install Docker or Gitleaks locally for secret protection."
    GITLEAKS_EXIT_CODE=0 # Warn but don't fail if docker is missing (dev experience)
fi

if [ $GITLEAKS_EXIT_CODE -ne 0 ]; then
    echo "❌ Secrets Detected! Commit rejected."
    exit 1
fi

echo "✅ Security Checks Passed."
exit 0
