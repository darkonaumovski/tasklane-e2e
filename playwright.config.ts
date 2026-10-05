import { defineConfig, devices } from '@playwright/test';
import { env, paths } from './tests/config/env';

/**
 * Browser projects run everything under tests/specs except the browser-free API specs
 * and the visual specs, which have their own single-browser project.
 */
const browserProject = {
  testDir: './tests/specs',
  testIgnore: ['api/**', 'visual/**'],
  dependencies: ['setup'],
};

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  // Defaults, written down so nobody "fixes" a sync problem by raising them globally.
  // A slow step should wait on a real signal (see TasksPage.waitForTasksLoaded).
  timeout: 30_000,
  expect: { timeout: 5_000 },

  // Safe because every test gets its own server data (see tests/fixtures/index.ts).
  fullyParallel: true,
  forbidOnly: env.isCI,
  // Retries on CI only, to absorb infrastructure noise; a test that needed a retry is
  // reported as "flaky", so it is surfaced rather than hidden. Locally a failure is a failure.
  retries: env.isCI ? 2 : 0,
  workers: env.isCI ? 2 : undefined,
  reporter: env.isCI ? [['github'], ['list'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  metadata: { target: env.baseURL },

  use: {
    baseURL: env.baseURL,
    // Diagnostics are recorded on the first retry of a failing test, and only kept for failures.
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'setup', testDir: './tests/setup', testMatch: /.*\.setup\.ts/ },
    // No browser needed: runs once instead of once per browser.
    { name: 'api', testDir: './tests/specs/api' },
    {
      name: 'chromium',
      ...browserProject,
      use: { ...devices['Desktop Chrome'], storageState: paths.storageState },
    },
    {
      name: 'firefox',
      ...browserProject,
      use: { ...devices['Desktop Firefox'], storageState: paths.storageState },
    },
    {
      name: 'mobile-chrome',
      ...browserProject,
      use: { ...devices['Pixel 7'], storageState: paths.storageState },
    },
    // Screenshots differ per browser, so one browser keeps baselines maintainable.
    // Baselines live next to the spec in *.spec.ts-snapshots/ and are Linux-only.
    {
      name: 'visual',
      testDir: './tests/specs/visual',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: paths.storageState },
    },
  ],

  // Start the local app unless BASE_URL points at a deployed environment.
  webServer: env.startsLocalServer
    ? { command: 'npm start', url: env.baseURL, reuseExistingServer: !env.isCI, timeout: 30_000 }
    : undefined,
});
