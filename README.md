# tasklane-e2e

A learning project for Playwright + TypeScript: a small task app (`app/`) and an end-to-end test framework (`tests/`) for it.

- **App under test:** plain HTML/CSS/JS served by Express, with login, task CRUD, search and status filter, a delete confirmation modal and file attachments. The API is in-memory and has an artificial 1–2 s delay on `GET /api/tasks`.
- **Tests:** API, mocked-UI and full end-to-end specs on Chromium, Firefox and a Pixel 7 viewport.

## Quick start

Requires Node 20+.

```bash
npm install
npx playwright install chromium firefox
npm test
```

Playwright starts the app automatically. To use the app yourself, run `npm start` and open http://localhost:3000.

## Commands

| Command                 | What it does                                                       |
| ----------------------- | ------------------------------------------------------------------ |
| `npm test`              | Full suite, headless                                               |
| `npm run test:smoke`    | Only `@smoke` tests: the critical paths, about 15 s                |
| `npm run test:api`      | Only the API specs (no browser)                                    |
| `npm run test:mocked`   | Only the mocked-network UI specs                                   |
| `npm run test:a11y`     | Only the axe accessibility scans (WCAG 2.1 A/AA)                   |
| `npm run test:visual`   | Only the visual regression tests (run on Linux; skipped elsewhere) |
| `npm run test:ui`       | Playwright UI mode: watch, filter, time-travel through steps       |
| `npm run test:headed`   | Runs with visible browsers                                         |
| `npm run test:debug`    | Opens the Playwright Inspector to step through a test              |
| `npm run report`        | Opens the last HTML report                                         |
| `npm run test:allure`   | Full suite, then builds the Allure report in `allure-report/`      |
| `npm run report:allure` | Serves the last Allure report                                      |
| `npm run check`         | Type-check + lint + format check (what CI runs before the tests)   |
| `npm run format`        | Formats the code with Prettier                                     |

Narrow a run with standard Playwright flags, for example `npx playwright test --project=chromium tests/specs/e2e/login.spec.ts`.

## Environment

All environment access goes through `tests/config/env.ts`. The precedence is: real environment variables, then `.env`, then `.env.example`.

| Variable                                | Purpose                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `BASE_URL`                              | Run against a deployed environment (dev, staging). When set, the local app is not started.       |
| `PORT`                                  | Port of the local app (default `3000`).                                                          |
| `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` | The test account. `.env.example` holds the fake demo user; use CI secrets for real environments. |

## Architecture

```
tests/
├── specs/            Test specifications, grouped by test type
│   ├── api/          Pure API tests (APIRequestContext, no browser), run once
│   ├── e2e/          Real browser against the real backend
│   ├── mocked/       Real browser, network intercepted with page.route()
│   └── visual/       Screenshot comparisons against committed Linux baselines
├── setup/            Setup project: logs in once and saves storageState
├── fixtures/         Typed custom fixtures: page objects, API client, data isolation
├── pages/            Page Objects, one per screen (LoginPage, TasksPage)
├── components/       Reusable UI parts (TaskRow, ConfirmDialog)
├── api/              API client and zod response schemas
├── data/             Static test data (the seed tasks)
├── factories/        Builders for dynamic test data (buildTask)
├── mocks/            Shared page.route() helpers (routeTaskList)
├── config/           Environment variables and paths
└── types/            Shared TypeScript types
```

**Test types.** Use `api/` for status codes, contracts and negative cases; it's fast. Use `mocked/` for UI states that are hard to produce for real (errors, empty, slow, offline). Use `e2e/` for real user journeys. Use `visual/` for layout and styling regressions that functional assertions can't see.

**Tags.** Every spec has a type tag (`@api`, `@mocked`, `@e2e`). Critical paths also carry `@smoke`, accessibility scans carry `@a11y`, and screenshot tests carry `@visual`. Filter with `--grep @tag`.

**Accessibility.** `specs/e2e/accessibility.spec.ts` runs axe-core against each meaningful UI state (login, login with errors, task list, open modal) using the `makeAxeBuilder` fixture, which targets WCAG 2.1 A and AA. A failure lists every violated rule, element and fix hint. Axe catches roughly a third of accessibility issues; keyboard behaviour such as modal focus is covered by explicit tests.

**Visual regression.** `specs/visual/` compares screenshots with baselines committed next to the spec (`*.spec.ts-snapshots/*-linux.png`). It runs in its own `visual` project on Desktop Chrome only, with mocked data so every render is identical. Fonts and anti-aliasing differ between operating systems, so baselines are rendered on Linux, the same OS as CI, and the tests are skipped on Windows and macOS.

To create or refresh baselines after an intended UI change, add the **`update-snapshots`** label to the pull request. `.github/workflows/update-snapshots.yml` renders them on `ubuntu-24.04`, commits them to the PR branch and removes the label. Review the PNG diff in the PR, then pull the commit.

Without a PR, run the workflow manually: **Actions → Update visual baselines → Run workflow**, picking the branch under "Use workflow from". The baselines are committed to that branch. Prefer a feature branch over `main`, so the new PNGs are reviewed in a PR.

**Isolation.** Every test runs fully in parallel. A fixture sends an `x-test-namespace` header unique to the test, and the server keeps separate data per namespace. An auto fixture calls `POST /api/reset` before each test, so retries also start clean. No test depends on another or on execution order.

**Authentication.** The `setup` project logs in through the UI once and saves `playwright/.auth/user.json` (git-ignored). Browser projects start from it. `login.spec.ts` opts out with an empty `storageState`. The `tasksApi` fixture logs in its own API session.

**Selectors.** Priority: `getByRole` → `getByLabel` → `getByText` → `getByTestId`, scoped to the screen's region. No CSS, XPath or positional selectors; ESLint enforces the worst cases.

## Debugging a failure

1. Run `npm run report` and open the failed test. On CI, download the `playwright-report` artifact from the workflow run.
2. A failed CI test is retried. The retry records a **trace**; open it from the report to see each step, the DOM, network and console.
3. Locally, `npm run test:ui` or `npm run test:debug` lets you step through. Add `--trace on` to record a trace on the first run.

## CI

`.github/workflows/playwright.yml` runs on pushes to `main`, pull requests and manual dispatch:

`npm ci` → install browsers → `npm run check` → `npm run test:allure` → upload the HTML report (traces, screenshots, videos of failures) and the Allure report.

**Allure report.** Every run writes raw results to `allure-results/` through the `allure-playwright` reporter. `npm run test:allure` runs the suite through `allure run`, which builds `allure-report/index.html` from that run only (older results in the folder are ignored) and keeps the test exit code. The report is a single self-contained file (settings in `allurerc.mjs`): open it directly, or with `npm run report:allure`. On CI, download the `allure-report` artifact. Extra arguments go after `--`, for example `npm run test:allure -- --project=chromium`.

`.github/workflows/update-snapshots.yml` runs when the `update-snapshots` label is added to a PR, or manually from the Actions tab (see Visual regression).

On CI, tests retry up to 2 times. A test that only passed on retry is reported as **flaky**, not hidden. Failures appear inline on the PR through the `github` reporter.

**Sharding.** Not enabled: the whole suite runs in about a minute locally and a few minutes on CI, so splitting it would add a report-merge job for little gain. Revisit it when the test step regularly takes more than about 10 minutes. The change is a job matrix running `npx playwright test --shard=${{ matrix.shard }}/N` with the `blob` reporter, followed by a job that runs `npx playwright merge-reports` to produce one HTML report.
