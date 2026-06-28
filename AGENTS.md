# AGENTS.md

Guidance for AI coding agents (Claude Code, OpenAI Codex, Cursor, Aider, GitHub Copilot, Windsurf, Cline) working in this repository.

## Project

**PatriotSolutions** — Salesforce DX project (API v67.0). Recruitment/HR app built on Lightning Web Components, Apex, and Flows.

- Single package directory: `force-app/` (default, no namespace)
- Org config: `config/project-scratch-def.json`
- Remote: https://github.com/yyonathan/PatriotSolutions

## Commands

Always use the npm scripts — they wire in the right ESLint/Prettier plugins for Apex, LWC, and XML metadata. Don't call `jest`, `eslint`, or `prettier` directly.

| Task                   | Command                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| Run LWC Jest tests     | `npm run test:unit`                                                                         |
| Watch LWC tests        | `npm run test:unit:watch`                                                                   |
| Lint Aura + LWC JS     | `npm run lint`                                                                              |
| Format all metadata    | `npm run prettier`                                                                          |
| Verify formatting      | `npm run prettier:verify`                                                                   |
| Deploy to personal org | `sf project deploy start --target-org patriot-dev`                                          |
| Pull from personal org | `sf project retrieve start --target-org patriot-dev`                                        |
| Live local preview     | `sf lightning dev component -n <componentName> -o patriot-dev`                              |
| Run Apex tests in org  | `sf apex test run --target-org patriot-dev --result-format human --code-coverage --wait 10` |

Salesforce CLI is the **new `sf` binary**, not legacy `sfdx`. Always use `sf project deploy start`, never `sfdx force:source:push`.

## Workflow — local first, PR to share

Each developer has their **own personal Developer Edition org** (alias `patriot-dev` for Sweekar). Day-to-day work happens there, never in the shared team sandbox.

1. **Local edit** — change `.js`, `.html`, `.css`, `.cls`, etc. under `force-app/`.
2. **Live preview (LWC only)** — `sf lightning dev component -n patriotSolutionsHome -o patriot-dev` opens a browser that hot-reloads on save. Apex edits do _not_ hot-reload — you must redeploy.
3. **Deploy to personal org** — `sf project deploy start --target-org patriot-dev`. This is your private space; deploy freely.
4. **Test** — `npm run test:unit` for LWC Jest, `sf apex test run --target-org patriot-dev` for Apex.
5. **Open a PR to `main`** — branches follow `<author>/<short-description>` (e.g., `Sweekar/working`). A reviewer deploys to the shared team sandbox after merge. **Do not deploy to the shared sandbox from a feature branch.**

**Pre-commit**: Husky runs `lint-staged`, which auto-formats staged files and runs LWC Jest with `--bail`. If a commit fails, fix the underlying issue — do not bypass with `--no-verify`.

**Never assume a default org.** Always pass `--target-org patriot-dev` (or the user's org alias) explicitly. Running `sf` commands without `--target-org` deploys to whatever org is set as default, which may be the shared sandbox.

## Deploying safely

- `--target-org <alias>` is an explicit address — only the named org receives the deploy. The shared sandbox and production are never reached unless their alias is named.
- **Pin a safe default once** so flag-less commands stay personal: `sf config set target-org patriot-dev`. After this, every `sf` command in this repo defaults to `patriot-dev`, and reaching anything else requires an explicit `--target-org`.
- **Dry-run when uncertain:** `sf project deploy start --target-org patriot-dev --dry-run` shows what would deploy without touching the org. Zero risk — use it any time you're not 100% sure.
- **Verify the default before deploying:** `sf org list` — the 🍁 marker shows the current default org. If it's anything other than `patriot-dev`, stop and re-pin before continuing.

## Apex

- Classes live in `force-app/main/default/classes/`.
- Every new Apex class needs a paired test class — the org rejects deploys under 75% code coverage.
- Main controller: `PatriotSolutionsHomeController` (candidates, interviews, jobs, pipeline, onboarding).

## LWC

- Components live in `force-app/main/default/lwc/<componentName>/`.
- Tests live alongside each component in `__tests__/`.
- Jest config extends `@salesforce/sfdx-lwc-jest` (see `jest.config.js`).
- `@wire` adapters are the canonical data-loading pattern in this project (`getAllCandidates`, `getDashboardStats`, etc. on `PatriotSolutionsHomeController`).

## Flows

Three automation flows live in `force-app/main/default/flows/`. Edit flows in Salesforce Setup (Flow Builder), then pull metadata via `sf project retrieve start --metadata Flow`. Hand-editing flow XML is discouraged.

## ESLint / Prettier

- ESLint v9 **flat config** in `eslint.config.js` — separate rule sets for Aura, LWC, and Jest mocks. LWC test files disable `@lwc/lwc/no-unexpected-wire-adapter-usages`.
- Prettier uses `prettier-plugin-apex` and `@prettier/plugin-xml`. Always go through `npm run prettier` so the plugins load.

## Don't touch

- `.forceignore` — already tuned to skip `package.xml`, `jsconfig.json`, `__tests__/`, `node_modules/`.
- `sfdx-project.json` `sourceApiVersion` — keep at `67.0` across the team.
