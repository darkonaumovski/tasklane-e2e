// Shared test data. Keeping it in one place means a change to the app's seed data
// only needs one edit here, not one per spec.

/** Reads a required environment variable and fails loudly if it's missing. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Check .env or .env.example.`);
  return value;
}

/** The single valid user, loaded from .env / .env.example by playwright.config.ts. */
export const testUser = {
  email: requireEnv('TEST_USER_EMAIL'),
  password: requireEnv('TEST_USER_PASSWORD'),
};

/** Mirrors SEED in app/server.js. POST /api/reset restores exactly these tasks. */
export const seedTasks = [
  { title: 'Buy groceries', done: false },
  { title: 'Write test plan', done: true },
  { title: 'Review pull request', done: false },
  { title: 'Book dentist appointment', done: true },
  { title: 'Plan team offsite', done: false },
] as const;

export const seedTitles = seedTasks.map((t) => t.title);

/** The values of the status dropdown. A union type stops typos like 'Done' at compile time. */
export type StatusFilter = 'all' | 'open' | 'done';
