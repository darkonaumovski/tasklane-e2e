import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load the test user (and PORT) the same way the server does: .env first, then .env.example.
// Worker processes inherit these variables, so specs can read process.env too.
dotenv.config({ path: [path.join(__dirname, '.env'), path.join(__dirname, '.env.example')], quiet: true });

const baseURL = `http://localhost:${process.env.PORT ?? 3000}`;

// Where the setup project saves the logged-in browser state (cookies + localStorage).
// It is git-ignored: it contains a live session cookie.
const authFile = 'playwright/.auth/user.json';

export default defineConfig({
  testDir: './tests',
  // Tests in a file run in parallel too. That's safe because every test gets its own
  // copy of the server data (see the x-test-namespace fixture in tests/fixtures.ts).
  fullyParallel: true,
  // Fail the CI build if someone accidentally commits test.only.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    // Lets specs call page.goto('/') instead of repeating the full URL.
    baseURL,
    // A trace is a recording of a test you can step through. Only record one when a
    // test fails and gets retried, so passing runs stay fast.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // 1. Log in once and save the session to authFile.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    // 2. Pure API tests: no browser needed, so they run once, not once per browser.
    { name: 'api', testDir: './tests/api' },

    // 3. UI tests in each browser. `dependencies` makes them wait for setup, and
    //    `storageState` starts every test already logged in.
    {
      name: 'chromium',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'], storageState: authFile },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      testDir: './tests/ui',
      use: { ...devices['Desktop Firefox'], storageState: authFile },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      testDir: './tests/ui',
      use: { ...devices['Pixel 7'], storageState: authFile },
      dependencies: ['setup'],
    },
  ],

  // Playwright starts the app before the tests and stops it afterwards.
  // Locally it reuses a server you already started with `npm start`.
  webServer: {
    command: 'npm start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
