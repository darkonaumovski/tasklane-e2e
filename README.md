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

| Command               | What it does                                                     |
| --------------------- | ---------------------------------------------------------------- |
| `npm test`            | Full suite, headless                                             |
| `npm run test:smoke`  | Only `@smoke` tests: the critical paths, about 15 s              |
| `npm run test:api`    | Only the API specs (no browser)                                  |
| `npm run test:mocked` | Only the mocked-network UI specs                                 |
| `npm run test:ui`     | Playwright UI mode: watch, filter, time-travel through steps     |
| `npm run test:headed` | Runs with visible browsers                                       |
| `npm run test:debug`  | Opens the Playwright Inspector to step through a test            |
| `npm run report`      | Opens the last HTML report                                       |
| `npm run check`       | Type-check + lint + format check (what CI runs before the tests) |
| `npm run format`      | Formats the code with Prettier                                   |

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
│   └── mocked/       Real browser, network intercepted with page.route()
├── setup/            Setup project: logs in once and saves storageState
├── fixtures/         Typed custom fixtures: page objects, API client, data isolation
├── pages/            Page Objects, one per screen (LoginPage, TasksPage)
├── components/       Reusable UI parts (TaskRow, ConfirmDialog)
├── api/              API client and runtime response-contract checks
├── data/             Static test data (the seed tasks)
├── factories/        Builders for dynamic test data (buildTask)
├── config/           Environment variables and paths
└── types/            Shared TypeScript types
```

**Test types.** Use `api/` for status codes, contracts and negative cases; it's fast. Use `mocked/` for UI states that are hard to produce for real (errors, empty, slow, offline). Use `e2e/` for real user journeys.

**Tags.** Every spec has a type tag (`@api`, `@mocked`, `@e2e`). Critical paths also carry `@smoke`. Filter with `--grep @tag`.

**Isolation.** Every test runs fully in parallel. A fixture sends an `x-test-namespace` header unique to the test, and the server keeps separate data per namespace. An auto fixture calls `POST /api/reset` before each test, so retries also start clean. No test depends on another or on execution order.

**Authentication.** The `setup` project logs in through the UI once and saves `playwright/.auth/user.json` (git-ignored). Browser projects start from it. `login.spec.ts` opts out with an empty `storageState`. The `tasksApi` fixture logs in its own API session.

**Selectors.** Priority: `getByRole` → `getByLabel` → `getByText` → `getByTestId`, scoped to the screen's region. No CSS, XPath or positional selectors; ESLint enforces the worst cases.

## Debugging a failure

1. Run `npm run report` and open the failed test. On CI, download the `playwright-report` artifact from the workflow run.
2. A failed CI test is retried. The retry records a **trace**; open it from the report to see each step, the DOM, network and console.
3. Locally, `npm run test:ui` or `npm run test:debug` lets you step through. Add `--trace on` to record a trace on the first run.

## CI

`.github/workflows/playwright.yml` runs on pushes to `main`, pull requests and manual dispatch:

`npm ci` → install browsers → `npm run check` → `npm test` → upload the HTML report (traces, screenshots, videos of failures).

On CI, tests retry up to 2 times. A test that only passed on retry is reported as **flaky**, not hidden. Failures appear inline on the PR through the `github` reporter.
