## Description
Briefly describe the changes introduced by this PR.

## Security Checklist (Mandatory)
All PRs must pass these checks before being merged into `main` or `develop`.

- [ ] **No Secrets**: I have verified that no hardcoded credentials, API keys, or secrets are included in this PR.
- [ ] **S-Protocol Compliance**:
  - [ ] **S1**: Any new environment variables are added to `@apex/config` schema.
  - [ ] **S2**: Tenant isolation is maintained (no public schema leaks).
  - [ ] **S3**: Inputs are validated with Zod/NestJS-Zod.
  - [ ] **S4-S8**: Relevant protocols followed for logic changes.
- [ ] **Data Integrity**: New migrations (if any) are tested for rollback and data safety.
- [ ] **Test Coverage**: Logic changes include corresponding unit or integration tests (Target: 95%+).

## Related Issues
Fixes # (issue)

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Security hardening
- [ ] Documentation update
- [ ] Refactor
