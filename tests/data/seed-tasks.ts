import type { Task } from '../types/task';

/**
 * Mirrors SEED in app/server.js. Every test starts from exactly this data because
 * the resetData fixture calls POST /api/reset first.
 */
export const seedTasks: readonly Task[] = [
  { id: 1, title: 'Buy groceries', done: false, attachment: null },
  { id: 2, title: 'Write test plan', done: true, attachment: null },
  { id: 3, title: 'Review pull request', done: false, attachment: null },
  { id: 4, title: 'Book dentist appointment', done: true, attachment: null },
  { id: 5, title: 'Plan team offsite', done: false, attachment: null },
];

export const seedTitles = seedTasks.map((task) => task.title);

/** Looks up a seed task by title, so tests don't hard-code ids. */
export function seedTask(title: string): Task {
  const task = seedTasks.find((t) => t.title === title);
  if (!task) throw new Error(`No seed task titled "${title}"`);
  return task;
}
