/** A task as returned by the Tasklane API. */
export type Task = {
  id: number;
  title: string;
  done: boolean;
  /** File name of the attachment, or null. The app stores names only, not file contents. */
  attachment: string | null;
};

export type NewTask = Pick<Task, 'title'>;
export type TaskUpdate = Partial<Pick<Task, 'title' | 'done' | 'attachment'>>;

/** Error body returned by every failing API endpoint. */
export type ApiError = { error: string };

/** Values of the status dropdown. A union type turns a typo like 'Done' into a compile error. */
export type StatusFilter = 'all' | 'open' | 'done';

export type Credentials = { email: string; password: string };
