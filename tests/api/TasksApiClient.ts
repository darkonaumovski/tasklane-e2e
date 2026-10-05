import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Credentials, NewTask, Task, TaskUpdate } from '../types/task';
import { assertIsTask, assertIsTaskList } from './task-contract';

/**
 * Client for the Tasklane HTTP API, built on Playwright's APIRequestContext.
 *
 * Two layers:
 * - Endpoint methods (list, create, update, ...) return the raw APIResponse, so API
 *   tests can assert status codes, headers and negative cases themselves.
 * - "Arrange" helpers (createTask, listTasks) return typed data and throw if the
 *   call fails, for UI tests that just need data in place.
 *
 * baseURL and the x-test-namespace header come from the `request` fixture, so they
 * are never repeated here. No cleanup is needed: each test works in its own data
 * namespace, which the resetData fixture resets before the test.
 */
export class TasksApiClient {
  constructor(private readonly request: APIRequestContext) {}

  login(credentials: Credentials): Promise<APIResponse> {
    return this.request.post('/api/login', { data: credentials });
  }

  reset(): Promise<APIResponse> {
    return this.request.post('/api/reset');
  }

  list(): Promise<APIResponse> {
    return this.request.get('/api/tasks');
  }

  create(task: NewTask): Promise<APIResponse> {
    return this.request.post('/api/tasks', { data: task });
  }

  update(id: number, changes: TaskUpdate): Promise<APIResponse> {
    return this.request.put(`/api/tasks/${id}`, { data: changes });
  }

  delete(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/tasks/${id}`);
  }

  async loginAs(credentials: Credentials): Promise<void> {
    await expectStatus(await this.login(credentials), 200, 'POST /api/login');
  }

  async listTasks(): Promise<Task[]> {
    const response = await this.list();
    await expectStatus(response, 200, 'GET /api/tasks');
    const body: unknown = await response.json();
    assertIsTaskList(body);
    return body;
  }

  async createTask(task: NewTask): Promise<Task> {
    const response = await this.create(task);
    await expectStatus(response, 201, 'POST /api/tasks');
    const body: unknown = await response.json();
    assertIsTask(body);
    return body;
  }
}

/** Fails an arrange step with the server's response in the message, not just "expected 201". */
async function expectStatus(response: APIResponse, status: number, label: string): Promise<void> {
  if (response.status() !== status) {
    throw new Error(`${label} returned ${response.status()} (expected ${status}): ${await response.text()}`);
  }
}
