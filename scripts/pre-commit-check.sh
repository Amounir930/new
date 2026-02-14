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

# 2. Run Gitleaks (via Docker or Local Pattern Scan)
echo "🔑 [2/3] Running Secret Detection (S10)..."
GITLEAKS_EXIT_CODE=0
if command -v docker &> /dev/null; then
    docker run --rm -v "$(pwd):/code" zricethezav/gitleaks:latest protect --source="/code" --staged --verbose --redact
    GITLEAKS_EXIT_CODE=$?
else
    echo "⚠️  Docker not found. Falling back to Surgical Pattern Scan..."
    # Pattern-based scan for secrets in staged files
    SECRET_FOUND=$(git diff --cached | grep -E "(password|passwd|pwd|secret|token|api_key|apikey)\s*[=:]\s*['\"][^'\"]{8,}['\"]" || true)
    if [ -n "$SECRET_FOUND" ]; then
        echo "🚨 CRITICAL: Potential hardcoded secret found!"
        echo "$SECRET_FOUND"
        GITLEAKS_EXIT_CODE=1
    fi
fi

if [ $GITLEAKS_EXIT_CODE -ne 0 ]; then
    echo "❌ Secrets Detected! Commit rejected."
    exit 1
fi

# 3. Supply Chain Audit (S9)
echo "🛡️  [3/3] Running Supply Chain Audit (S9)..."
bun audit || {
    echo "❌ S9 FAILED: Known security vulnerabilities detected in dependencies!"
    exit 1
}

echo "✅ Security Checks Passed."
exit 0
