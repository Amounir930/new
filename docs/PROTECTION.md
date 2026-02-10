# S1.6: Branch Protection Protocol

To ensure the integrity of the Apex Platform, the following branch protection rules must be enforced on the `main` and `develop` branches.

## Mandatory GitHub Settings

### 1. Require Status Checks
The following CI gates MUST pass before a pull request can be merged:
- ✅ `S1 Environment` (S1.1 - S1.5)
- ✅ `S2 Tenant Isolation`
- ✅ `S3 Input Validation`
- ✅ `S4 Audit Logging`
- ✅ `S5 Exception Handling`
- ✅ `S6 Rate Limiting`
- ✅ `S7 Encryption`
- ✅ `S8 Security Headers`
- ✅ `S9-S13 Penetration Tests`
- ✅ `Lighthouse Performance`

### 2. Require Pull Request Reviews
- Minimum of **1 approved review** from a code owner.
- "Dismiss stale pull request approvals when new commits are pushed" must be ENABLED.

### 3. Prevent Force Pushes
- Force pushing to `main` and `develop` is strictly FORBIDDEN.

### 4. Require Signed Commits
- All commits to production branches must be GPG/SSH signed to verify authorship.

---
> [!IMPORTANT]
> This document serves as the living protocol for S1.6 compliance. Any changes to the CI pipeline must be reflected here.
