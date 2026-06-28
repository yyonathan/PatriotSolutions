---
name: deploy-sandbox
description: Deploy current force-app source to the user's PERSONAL Salesforce dev org (alias patriot-dev by default), NOT the shared team sandbox. Use when the user wants to push their local changes to their own dev org to test in a real Salesforce environment.
disable-model-invocation: true
---

Deploy this Salesforce DX project to the user's **personal** Developer Edition org (alias `patriot-dev` by default). This is private — it does not affect the team's shared sandbox.

## Before deploying

1. Confirm the target org from `$ARGUMENTS`. **Default to `patriot-dev`** if no org alias is given. Never deploy without an explicit `--target-org`.
2. Run `git status` and surface any uncommitted changes that may not be intended.
3. Run `npm run prettier:verify` and `npm run test:unit`. If either fails, stop and report — fix locally first.

## Deploy

```
sf project deploy start --target-org patriot-dev
```

If `$ARGUMENTS` includes a different alias (e.g., the user wants to deploy elsewhere), use that instead. Pass any extra flags through (e.g., `--dry-run`).

## After deploying

- Report the deploy ID, any test failures the org ran during deploy, and how to view it in Setup.
- If Apex coverage < 75%, name the controller and suggest extending the matching `*Test` class under `force-app/main/default/classes/`.

## What this skill does NOT do

It does **not** deploy to the shared team sandbox. Sharing changes with the team is a PR workflow — open a PR to `main` and let a reviewer handle the team deploy.
