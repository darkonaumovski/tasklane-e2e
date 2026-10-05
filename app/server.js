// Tasklane: a tiny Express server that serves the demo app and an in-memory JSON API.
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');

// .env wins if present; otherwise fall back to the committed .env.example test user.
const root = path.join(__dirname, '..');
require('dotenv').config({ path: [path.join(root, '.env'), path.join(root, '.env.example')], quiet: true });
const { TEST_USER_EMAIL, TEST_USER_PASSWORD, PORT = 3000 } = process.env;

const SEED = [
  { id: 1, title: 'Buy groceries', done: false, attachment: null },
  { id: 2, title: 'Write test plan', done: true, attachment: null },
  { id: 3, title: 'Review pull request', done: false, attachment: null },
  { id: 4, title: 'Book dentist appointment', done: true, attachment: null },
  { id: 5, title: 'Plan team offsite', done: false, attachment: null },
];

// Test seam: each namespace (sent in the x-test-namespace header) gets its own copy of the
// data, so parallel tests never see each other's changes. Real users all share 'default'.
const stores = new Map();
const sessions = new Set();
const ns = (req) => req.get('x-test-namespace') || 'default';
function store(req) {
  if (!stores.has(ns(req))) stores.set(ns(req), { tasks: structuredClone(SEED), nextId: SEED.length + 1 });
  return stores.get(ns(req));
}
const cookies = (req) =>
  Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((c) => c.trim().split('=')));
const requireAuth = (req, res, next) =>
  sessions.has(cookies(req).session) ? next() : res.status(401).json({ error: 'Not logged in' });
const findTask = (req) => store(req).tasks.find((t) => t.id === Number(req.params.id));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email !== TEST_USER_EMAIL || password !== TEST_USER_PASSWORD) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = crypto.randomUUID();
  sessions.add(token);
  res.cookie('session', token, { httpOnly: true, sameSite: 'lax' }).json({ email });
});

app.post('/api/logout', (req, res) => {
  sessions.delete(cookies(req).session);
  res.clearCookie('session').status(204).end();
});

app.get('/api/me', requireAuth, (req, res) => res.json({ email: TEST_USER_EMAIL }));

app.post('/api/reset', (req, res) => {
  stores.delete(ns(req));
  res.status(204).end();
});

app.get('/api/tasks', requireAuth, async (req, res) => {
  await sleep(1000 + Math.random() * 1000); // artificial 1-2 s delay
  res.json(store(req).tasks);
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const title = String(req.body?.title ?? '').trim();
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const s = store(req);
  const task = { id: s.nextId++, title, done: false, attachment: null };
  s.tasks.push(task);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', requireAuth, (req, res) => {
  const task = findTask(req);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const { title, done, attachment } = req.body || {};
  if (title !== undefined) {
    if (!String(title).trim()) return res.status(400).json({ error: 'Title is required' });
    task.title = String(title).trim();
  }
  if (typeof done === 'boolean') task.done = done;
  if (attachment !== undefined) task.attachment = attachment;
  res.json(task);
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const s = store(req);
  const task = findTask(req);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  s.tasks = s.tasks.filter((t) => t !== task);
  res.status(204).end();
});

app.listen(PORT, () => console.log(`Tasklane running on http://localhost:${PORT}`));
