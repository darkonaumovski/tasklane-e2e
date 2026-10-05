# tasklane-e2e

A learning project for Playwright + TypeScript: a small task app (`/app`) and an end-to-end test suite (`/tests`) for it.

- **App:** plain HTML/CSS/JS served by Express, with login, task CRUD, search and status filter, a delete confirmation modal and file attachments. The API is in-memory and has an artificial 1–2 s delay on `GET /api/tasks`.
- **Tests:** Page Object Model exposed through custom fixtures, login once via a setup project (`storageState`), data-driven specs, a mocked-network spec (`page.route`) and pure API tests (`request` fixture). They run on Chromium, Firefox and a Pixel 7 viewport.

## Run it

Requires Node 20.6+.

```bash
npm install
npx playwright install chromium firefox
npm test
```

| Script | What it does |
|---|---|
| `npm start` | Runs the app alone at http://localhost:3000 |
| `npm test` | Full suite, headless (starts the app automatically) |
| `npm run test:ui` | Playwright UI mode |
| `npm run test:headed` | Runs with visible browsers |
| `npm run report` | Opens the last HTML report |
| `npm run typecheck` | Strict TypeScript check |

The test user lives in `.env.example` (fake credentials for this demo only). Copy it to `.env` to override.

Parallel tests don't interfere with each other: a fixture sends an `x-test-namespace` header, the server keeps separate data per namespace, and each test starts with `POST /api/reset`.

CI: `.github/workflows/playwright.yml` runs the suite on every push to `main` and on pull requests, and uploads the HTML report as an artifact.
