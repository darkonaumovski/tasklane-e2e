import type { APIResponse } from '@playwright/test';
import { z } from 'zod';

/**
 * Response contracts for the Tasklane API, written once with zod. Each schema is both:
 * - a runtime check: `response.json()` is really `unknown`, and parsing proves its shape;
 * - the TypeScript type: types/task.ts derives Task from TaskSchema, so they can't drift.
 *
 * Strict objects reject unexpected fields, so an accidental leak (say, an internal
 * owner id) fails the contract instead of passing silently.
 */
export const TaskSchema = z.strictObject({
  id: z.number().int().positive(),
  title: z.string().regex(/\S/, { error: 'title must not be blank' }),
  done: z.boolean(),
  attachment: z.string().min(1).nullable(),
});

export const TaskListSchema = z.array(TaskSchema);

export const ApiErrorSchema = z.strictObject({ error: z.string().min(1) });

/**
 * Reads a response body and validates it against a schema. On failure the error names
 * the endpoint and every broken field, e.g. "✖ Invalid input: expected boolean → at [2].done".
 */
export async function parseBody<T extends z.ZodType>(schema: T, response: APIResponse): Promise<z.infer<T>> {
  const result = schema.safeParse(await response.json());
  if (!result.success) {
    throw new Error(`Response from ${response.url()} breaks the contract:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
