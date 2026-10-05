import { test, expect } from '../fixtures';
import { seedTitles, testUser } from '../support/test-data';

/**
 * Pure API tests: no browser at all. The `request` fixture is an HTTP client
 * that uses baseURL from the config and keeps its own cookie jar.
 * They run in milliseconds, so they're a good place for detailed checks of
 * status codes and payloads.
 */
test.describe('Tasks API', () => {
  test('rejects requests without a session', async ({ request }) => {
    const response = await request.get('/api/tasks');
    expect(response.status()).toBe(401);
  });

  test('rejects a wrong password', async ({ request }) => {
    const response = await request.post('/api/login', {
      data: { email: testUser.email, password: 'wrong-password' },
    });
    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: 'Invalid email or password' });
  });

  test.describe('when logged in', () => {
    test.beforeEach(async ({ request }) => {
      // The session cookie from this response stays in `request`'s cookie jar,
      // so later calls in the same test are authenticated automatically.
      const login = await request.post('/api/login', { data: testUser });
      expect(login.ok()).toBeTruthy();
    });

    test('GET /api/tasks returns the seed data', async ({ request }) => {
      const response = await request.get('/api/tasks');

      expect(response.status()).toBe(200);
      const tasks: Array<{ title: string }> = await response.json();
      expect(tasks.map((t) => t.title)).toEqual(seedTitles);
    });

    test('create, update and delete a task', async ({ request }) => {
      // test.step groups actions into named sections in the report and trace viewer.
      const id = await test.step('POST creates the task', async () => {
        const response = await request.post('/api/tasks', { data: { title: 'From the API' } });
        expect(response.status()).toBe(201);
        const task = await response.json();
        // expect.any(Number): we don't know the id in advance, only its type.
        expect(task).toEqual({ id: expect.any(Number), title: 'From the API', done: false, attachment: null });
        return task.id as number;
      });

      await test.step('PUT updates it', async () => {
        const response = await request.put(`/api/tasks/${id}`, { data: { title: 'Renamed', done: true } });
        expect(response.status()).toBe(200);
        expect(await response.json()).toMatchObject({ id, title: 'Renamed', done: true });
      });

      await test.step('DELETE removes it', async () => {
        expect((await request.delete(`/api/tasks/${id}`)).status()).toBe(204);
        expect((await request.delete(`/api/tasks/${id}`)).status()).toBe(404);
      });
    });

    test('POST rejects a blank title', async ({ request }) => {
      const response = await request.post('/api/tasks', { data: { title: '   ' } });
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ error: 'Title is required' });
    });

    test('POST /api/reset restores the seed data', async ({ request }) => {
      await request.delete('/api/tasks/1');
      await request.post('/api/reset');

      const tasks: Array<{ title: string }> = await (await request.get('/api/tasks')).json();
      expect(tasks.map((t) => t.title)).toEqual(seedTitles);
    });
  });
});
