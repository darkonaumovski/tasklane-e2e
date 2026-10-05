import type { z } from 'zod';
import type { ApiErrorSchema, TaskSchema } from '../api/schemas';

/** A task as returned by the Tasklane API. Derived from the zod schema, the single source of truth. */
export type Task = z.infer<typeof TaskSchema>;

export type NewTask = Pick<Task, 'title'>;
export type TaskUpdate = Partial<Pick<Task, 'title' | 'done' | 'attachment'>>;

/** Error body returned by every failing API endpoint. */
export type ApiError = z.infer<typeof ApiErrorSchema>;

/** Values of the status dropdown. A union type turns a typo like 'Done' into a compile error. */
export type StatusFilter = 'all' | 'open' | 'done';

export type Credentials = { email: string; password: string };
