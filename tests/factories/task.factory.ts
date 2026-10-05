import type { Task } from '../types/task';

let sequence = 0;

/**
 * Builds a valid Task with sensible defaults. Tests override only the fields they
 * care about, so each test shows its intent instead of a wall of JSON:
 *
 *   buildTask({ title: 'Mocked done task', done: true })
 */
export function buildTask(overrides: Partial<Task> = {}): Task {
  sequence += 1;
  return { id: 1000 + sequence, title: `Generated task ${sequence}`, done: false, attachment: null, ...overrides };
}
