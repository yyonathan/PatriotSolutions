# Patriot Solutions — Handoff

Recruitment & HR app built on Salesforce Lightning Web Components, Apex, and Flows. Hackathon submission targeting veteran/military HR workflows.

---

## What this is

| Layer           | What's there                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **LWC**         | `patriotSolutionsHome` — single-page dashboard with 8 views: Dashboard, Job Openings, Candidates, Interviews, Hiring Pipeline, Onboarding, Reports, Settings |
| **Apex**        | `PatriotSolutionsHomeController` — wire methods for candidates, interviews, jobs, pipeline stages, onboarding tasks, dashboard stats, recent activity        |
| **Flows**       | Auto-reject on knockout requirements, create onboarding tasks on hire (2 variants)                                                                           |
| **Flexi Pages** | 5 page layouts including Home Page variants and Utility Bar                                                                                                  |

---

## Get started in 3 steps

```bash
# 1. Install dependencies
npm install

# 2. Deploy to your personal dev org (ask Sweekar for the alias convention)
sf project deploy start --target-org <your-org-alias>

# 3. Start live local preview — hot-reloads on every save
sf lightning dev component -n patriotSolutionsHome -o <your-org-alias>
```

> **Never deploy directly to the shared team sandbox.** That org is for reviewed, merged work only. Always use your own personal Developer Edition org for day-to-day development.

---

## Personal dev org setup (first time only)

If you don't have an org yet:

1. Sign up for a free Salesforce Developer Edition at developer.salesforce.com
2. Connect it: `sf org login web --alias <your-name>-dev`
3. Deploy the project: `sf project deploy start --target-org <your-name>-dev`
4. (Optional) Pin it as your default so you never need the flag: `sf config set target-org <your-name>-dev`

Check who's connected: `sf org list`

---

## Daily workflow

```
Edit files locally
    │
    ▼
sf lightning dev component -n patriotSolutionsHome -o <your-org>
    │  (CSS / HTML / JS changes hot-reload here — no redeploy needed)
    ▼
For Apex changes: sf project deploy start --target-org <your-org>
    │
    ▼
npm run test:unit          ← LWC Jest (no org needed)
npm run lint               ← ESLint on JS
npm run prettier           ← Format everything
    │
    ▼
git commit                 ← Husky runs lint + Jest automatically
    │
    ▼
Open PR → main             ← Someone reviews, then deploys to shared sandbox
```

---

## Key commands

| Task                          | Command                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Deploy to personal org        | `sf project deploy start --target-org <your-org>`                                          |
| Live preview                  | `sf lightning dev component -n patriotSolutionsHome -o <your-org>`                         |
| Run LWC tests                 | `npm run test:unit`                                                                        |
| Run a single test             | `npm run test:unit -- --testPathPattern=patriotSolutionsHome`                              |
| Lint                          | `npm run lint`                                                                             |
| Format                        | `npm run prettier`                                                                         |
| Run Apex tests                | `sf apex test run --target-org <your-org> --result-format human --code-coverage --wait 10` |
| Preview a deploy (no changes) | `sf project deploy start --target-org <your-org> --dry-run`                                |
| Check your connected orgs     | `sf org list`                                                                              |

> Use `sf` (new CLI), not `sfdx` (legacy). Always pass `--target-org` explicitly.

---

## Important files

```
force-app/main/default/
├── lwc/patriotSolutionsHome/
│   ├── patriotSolutionsHome.html       ← All 8 views in one template
│   ├── patriotSolutionsHome.js         ← Wire methods, state, event handlers
│   ├── patriotSolutionsHome.css        ← Full SLDS visual layer (rewritten)
│   └── __tests__/                      ← LWC Jest suite
├── classes/
│   ├── PatriotSolutionsHomeController.cls   ← All Apex data methods
│   └── PatriotSolutionsHomeControllerTest.cls
└── flows/
    ├── Auto_Reject_Knockout_Requirements
    ├── Create_Onboarding_Tasks_On_Hire
    └── Create_Onboarding_Tasks_When_Hired

AGENTS.md          ← Read this — shared guidance for ALL AI tools (Claude, Copilot, Cursor, etc.)
CLAUDE.md          ← Claude Code entry point (imports AGENTS.md)
.claude/skills/    ← /deploy-sandbox and /run-tests slash commands
```

---

## Editing Flows

Do **not** hand-edit Flow XML. Instead:

1. Edit the Flow in Salesforce Setup → Flow Builder
2. Pull the updated metadata: `sf project retrieve start --metadata Flow`
3. Commit the retrieved XML

---

## Branching & PRs

- Branch naming: `<your-name>/<short-description>` (e.g., `sweekar/working`, `alex/onboarding-ui`)
- Open a PR to `main` when your feature is ready
- A reviewer deploys to the shared sandbox after merge — you do not

---

## What was done in this session

- **Full SLDS redesign** of `patriotSolutionsHome.css` — replaced Material You / "bubbly AI" aesthetic with native Salesforce Lightning Design System: white cards on `#F3F3F3`, `#0176D3` primary blue, Salesforce Sans font, 4px corners, subtle box-shadow, SLDS tables, status badges, sidebar with left-bar active indicator
- **All 7 LWC tests pass** after the CSS rewrite
- **AGENTS.md** — canonical AI agent guidance checked into the repo (read by Claude, Codex, Cursor, Copilot, Cline, Aider)
- **`.claude/skills/`** — `/deploy-sandbox` and `/run-tests` slash commands for Claude Code users
- **`.claude/settings.json`** — auto-Prettier hook on every file Claude edits
- **`.github/copilot-instructions.md`** — GitHub Copilot pointer

---

## Open items / pick these up

- [ ] **See the UI** — deploy to your personal org + run `sf lightning dev component` to review the SLDS redesign
- [ ] **Apex test coverage** — verify `PatriotSolutionsHomeControllerTest` hits ≥ 75% before deploying to any shared org
- [ ] **Real data in personal org** — the dashboard shows mock/empty states until you seed candidates, jobs, and interview records in your dev org
- [ ] **Flows testing** — validate the 3 automation flows work end-to-end in a dev org before demo
- [ ] **Footer text** — "Version 4.2.1-stable" is placeholder; update or remove before the judges see it
- [ ] **Page assignment** — confirm `patriotSolutionsHome` is assigned to the correct Flexi Page / app for the demo org

---

## Contacts

| Person    | Role                                                    |
| --------- | ------------------------------------------------------- |
| Sweekar   | Built the LWC + CSS redesign, branch: `Sweekar/Working` |
| Team repo | https://github.com/yyonathan/PatriotSolutions           |
