#!/bin/bash
# Apex v2 - Pre-Commit Security Shield (Hardened)
set -euo pipefail

echo "🛡️  Apex v2 Pre-Commit Security Shield"

# 0. Block .env files from being committed
echo "🔍 [0/3] Checking for .env files in staging area..."
ENV_STAGED=$(git diff --cached --name-only | grep -E '^\.env$|\.env\.local$|\.env\.production$' || true)
if [ -n "$ENV_STAGED" ]; then
    echo "❌ BLOCKED: .env files staged for commit!"
    echo "$ENV_STAGED"
    echo "Remove with: git reset HEAD <file>"
    exit 1
fi

# 1. Run AST-based Security Scan
echo "🔍 [1/3] Running AST Security Scanner..."
bun run scripts/check-s2-isolation.ts
AST_EXIT_CODE=$?

if [ $AST_EXIT_CODE -ne 0 ]; then
    echo "❌ AST Security Check Failed. Fix violations before committing."
    exit 1
fi

# 2. Run Gitleaks (via Docker)
echo "🔑 [2/3] Running Gitleaks (Secret Detection)..."
if command -v docker &> /dev/null; then
    docker run --rm -v "$(pwd):/code" zricethezav/gitleaks:latest protect --source="/code" --staged --verbose --redact
    GITLEAKS_EXIT_CODE=$?
else
    echo "⚠️  Docker not found. Skipping Gitleaks check."
    echo "   Please install Docker or Gitleaks locally for secret protection."
    GITLEAKS_EXIT_CODE=0
fi

if [ $GITLEAKS_EXIT_CODE -ne 0 ]; then
    echo "❌ Secrets Detected! Commit rejected."
    exit 1
fi

# 3. Security TODO warning
echo "🔍 [3/3] Checking for unresolved security TODOs..."
SEC_TODOS=$(git diff --cached -U0 | grep -E '^\+.*TODO.*(security|auth|encrypt|secret|vuln)' --ignore-case || true)
if [ -n "$SEC_TODOS" ]; then
    echo "⚠️  WARNING: Security-related TODOs in staged changes:"
    echo "$SEC_TODOS"
fi

echo "✅ Security Checks Passed."
exit 0
