import path from 'node:path';
import dotenv from 'dotenv';

/**
 * The single place that reads environment variables. playwright.config.ts and
 * the tests both import from here, so a value is never looked up two ways.
 *
 * Precedence: real environment variables (CI secrets, your shell) > .env > .env.example.
 * dotenv never overrides a variable that is already set.
 */
const root = path.resolve(__dirname, '..', '..');
dotenv.config({ path: [path.join(root, '.env'), path.join(root, '.env.example')], quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}

const baseURLOverride = process.env.BASE_URL;

export const env = {
  /** BASE_URL targets a deployed environment (dev, staging); otherwise the local app on PORT. */
  baseURL: baseURLOverride ?? `http://localhost:${process.env.PORT ?? '3000'}`,
  /** True when Playwright should start the local app itself. */
  startsLocalServer: !baseURLOverride,
  isCI: !!process.env.CI,
  user: {
    email: required('TEST_USER_EMAIL'),
    password: required('TEST_USER_PASSWORD'),
  },
} as const;

export const paths = {
  /** Logged-in browser state written by the setup project. Git-ignored: it holds a live session. */
  storageState: path.join(root, 'playwright', '.auth', 'user.json'),
} as const;
