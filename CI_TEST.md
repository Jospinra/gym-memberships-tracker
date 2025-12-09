# CI/CD Workflow Test - Fresh Run

This file triggers a new GitHub Actions workflow run to clear cached v3 artifact action errors.

## Workflow Status
- ✅ `actions/upload-artifact@v4` (v3 deprecated, v4 now active)
- ✅ CD deployment pipeline added (Kubernetes rolling updates)
- ✅ Zero-downtime deployments configured

## Changes Made
1. Updated all artifact upload steps to v4
2. Added deploy job with kubectl integration
3. Configured rolling update strategy (maxSurge: 1, maxUnavailable: 0)
4. Added resource limits and HPA configuration

## Next Steps
Push this commit to trigger a fresh workflow run that should resolve the deprecation error.

Last updated: 2025-12-09 UTC
