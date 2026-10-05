import { TasksApiClient } from '../../api/TasksApiClient';
import { ApiErrorSchema, parseBody, TaskListSchema, TaskSchema } from '../../api/schemas';
import { env } from '../../config/env';
import { seedTask, seedTitles } from '../../data/seed-tasks';
import { test, expect } from '../../fixtures';

/**
 * Pure API tests: no browser. They run in milliseconds, so this is the place for
 * detailed status, header, contract and negative-case checks.
 */
test.describe('Tasks API', { tag: '@api' }, () => {
  test.describe('without a session', () => {
    test('task endpoints return 401', async ({ request }) => {
      // `request` has no session cookie: this client is deliberately not logged in.
      const anonymous = new TasksApiClient(request);

      for (const response of [
        await anonymous.list(),
        await anonymous.create({ title: 'Nope' }),
        await anonymous.update(1, { done: true }),
        await anonymous.delete(1),
      ]) {
        expect(response.status(), response.url()).toBe(401);
      }
    });

    test('login rejects a wrong password without setting a session', async ({ request }) => {
      const response = await new TasksApiClient(request).login({ email: env.user.email, password: 'wrong-password' });

      expect(response.status()).toBe(401);
      expect(await parseBody(ApiErrorSchema, response)).toEqual({ error: 'Invalid email or password' });
      expect(response.headers()['set-cookie']).toBeUndefined();
    });

    test('login with valid credentials sets an HttpOnly session cookie', async ({ request }) => {
      const response = await new TasksApiClient(request).login(env.user);

      expect(response.status()).toBe(200);
      // HttpOnly keeps the session out of reach of page scripts (and XSS).
      expect(response.headers()['set-cookie']).toMatch(/^session=[^;]+;.*HttpOnly/i);
    });
  });

  test.describe('with a session', () => {
    test('GET /api/tasks returns the seed tasks as JSON', async ({ tasksApi }) => {
      const response = await tasksApi.list();

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      const tasks = await parseBody(TaskListSchema, response);
      expect(tasks.map((task) => task.title)).toEqual(seedTitles);
    });

    test('a task can be created, updated and deleted', async ({ tasksApi }) => {
      const created = await test.step('POST creates the task', async () => {
        const response = await tasksApi.create({ title: '  From the API  ' });
        expect(response.status()).toBe(201);
        const task = await parseBody(TaskSchema, response);
        expect(task).toMatchObject({ title: 'From the API', done: false, attachment: null });
        return task;
      });

      await test.step('PUT updates only the given fields', async () => {
        const response = await tasksApi.update(created.id, { done: true });
        expect(response.status()).toBe(200);
        expect(await parseBody(TaskSchema, response)).toEqual({ ...created, done: true });
      });

      await test.step('DELETE removes it, and a second DELETE finds nothing', async () => {
        expect((await tasksApi.delete(created.id)).status()).toBe(204);
        expect((await tasksApi.delete(created.id)).status()).toBe(404);
        expect((await tasksApi.listTasks()).map((task) => task.id)).not.toContain(created.id);
      });
    });

    test('blank titles are rejected on create and update', async ({ tasksApi }) => {
      const existing = seedTask('Buy groceries');

      for (const response of [
        await tasksApi.create({ title: '   ' }),
        await tasksApi.update(existing.id, { title: '' }),
      ]) {
        expect(response.status()).toBe(400);
        expect(await parseBody(ApiErrorSchema, response)).toEqual({ error: 'Title is required' });
      }
      expect((await tasksApi.listTasks()).map((task) => task.title)).toEqual(seedTitles);
    });

    test('unknown task ids return 404', async ({ tasksApi }) => {
      const update = await tasksApi.update(9999, { done: true });
      const remove = await tasksApi.delete(9999);

      expect(update.status()).toBe(404);
      expect(await parseBody(ApiErrorSchema, update)).toEqual({ error: 'Task not found' });
      expect(remove.status()).toBe(404);
    });

    test('POST /api/reset restores the seed data', async ({ tasksApi }) => {
      await tasksApi.delete(seedTask('Buy groceries').id);
      await tasksApi.createTask({ title: 'Temporary' });

      expect((await tasksApi.reset()).status()).toBe(204);

      expect((await tasksApi.listTasks()).map((task) => task.title)).toEqual(seedTitles);
    });
  });
});
