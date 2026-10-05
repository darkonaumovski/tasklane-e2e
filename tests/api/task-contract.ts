import type { Task } from '../types/task';

/**
 * Runtime contract checks for API responses. TypeScript types disappear at runtime,
 * so `response.json()` is really `unknown`. These guards check the shape and, as
 * assertion functions, narrow the type for the rest of the test.
 *
 * Hand-written because the contract is small; for larger APIs, a schema library
 * (zod, ajv with JSON Schema) is the next step.
 */
export function assertIsTask(value: unknown, label = 'task'): asserts value is Task {
  const problems: string[] = [];
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${label} is not an object: ${JSON.stringify(value)}`);
  }
  const task = value as Record<string, unknown>;
  if (!Number.isInteger(task.id)) problems.push('id must be an integer');
  if (typeof task.title !== 'string' || task.title.trim() === '') problems.push('title must be a non-empty string');
  if (typeof task.done !== 'boolean') problems.push('done must be a boolean');
  if (task.attachment !== null && typeof task.attachment !== 'string') {
    problems.push('attachment must be string or null');
  }
  const extra = Object.keys(task).filter((key) => !['id', 'title', 'done', 'attachment'].includes(key));
  if (extra.length) problems.push(`unexpected fields: ${extra.join(', ')}`);
  if (problems.length) {
    throw new Error(`${label} breaks the contract (${problems.join('; ')}): ${JSON.stringify(value)}`);
  }
}

export function assertIsTaskList(value: unknown): asserts value is Task[] {
  if (!Array.isArray(value)) throw new Error(`Expected an array of tasks, got: ${JSON.stringify(value)}`);
  value.forEach((item, index) => assertIsTask(item, `tasks[${index}]`));
}
