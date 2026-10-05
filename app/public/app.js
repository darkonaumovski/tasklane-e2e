// Tasklane front end: plain DOM code, no framework.
const $ = (selector) => document.querySelector(selector);
let tasks = [];
let editingId = null;

// Tiny element builder: attributes starting with "on" become event listeners.
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, '');
    else if (value !== false && value != null) node.setAttribute(key, value);
  }
  node.append(...children);
  return node;
}

async function api(method, url, body) {
  const headers = body ? { 'Content-Type': 'application/json' } : undefined;
  const res = await fetch(url, { method, headers, body: body && JSON.stringify(body) });
  if (res.status === 401 && url !== '/api/login') show('login');
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

// Runs an action and shows any error in the task view's alert region.
function run(fn) {
  $('#tasks-error').textContent = '';
  return fn().catch((err) => ($('#tasks-error').textContent = err.message));
}

function show(view) {
  $('#login-view').hidden = view !== 'login';
  $('#tasks-view').hidden = view !== 'tasks';
}

function setFieldError(field, message) {
  $(`#${field}-error`).textContent = message;
  $(`#${field}`).setAttribute('aria-invalid', String(Boolean(message)));
}

$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = $('#email').value.trim();
  const password = $('#password').value;
  const emailError = !email ? 'Email is required' : /^\S+@\S+\.\S+$/.test(email) ? '' : 'Enter a valid email address';
  const passwordError = !password ? 'Password is required' : password.length < 8 ? 'Password must be at least 8 characters' : '';
  setFieldError('email', emailError);
  setFieldError('password', passwordError);
  $('#login-error').textContent = '';
  if (emailError || passwordError) return;
  try {
    await api('POST', '/api/login', { email, password });
    $('#login-form').reset();
    enterApp();
  } catch (err) {
    $('#login-error').textContent = err.message;
  }
});

async function enterApp() {
  show('tasks');
  $('#loading').hidden = false;
  $('#task-list').setAttribute('aria-busy', 'true');
  await run(async () => { tasks = await api('GET', '/api/tasks'); render(); });
  $('#loading').hidden = true;
  $('#task-list').setAttribute('aria-busy', 'false');
}

function render() {
  const query = $('#search').value.trim().toLowerCase();
  const status = $('#status').value;
  const visible = tasks.filter(
    (t) => t.title.toLowerCase().includes(query) && (status === 'all' || (status === 'done') === t.done),
  );
  $('#task-list').replaceChildren(...visible.map(taskItem));
  $('#empty').hidden = visible.length > 0;
}

function taskItem(t) {
  const checkbox = el('input', { type: 'checkbox', id: `done-${t.id}`, checked: t.done, 'data-testid': 'task-checkbox',
    onchange: (e) => run(() => updateTask(t.id, { done: e.target.checked })) });
  if (editingId === t.id) {
    const input = el('input', { value: t.title, 'aria-label': 'Edit title', 'data-testid': 'edit-input' });
    queueMicrotask(() => input.focus());
    const save = (e) => { e.preventDefault(); run(() => updateTask(t.id, { title: input.value })); };
    const cancel = () => { editingId = null; render(); };
    return el('li', { 'data-testid': 'task-item' }, checkbox, el('form', { onsubmit: save }, input,
      el('button', { type: 'submit', 'data-testid': 'save-edit' }, 'Save'),
      el('button', { type: 'button', class: 'secondary', onclick: cancel, 'data-testid': 'cancel-edit' }, 'Cancel')));
  }
  const attach = (e) => e.target.files[0] && run(() => updateTask(t.id, { attachment: e.target.files[0].name }));
  return el('li', { class: t.done ? 'done' : null, 'data-testid': 'task-item' }, checkbox,
    el('label', { for: `done-${t.id}`, class: 'title', 'data-testid': 'task-title' }, t.title),
    t.attachment ? el('span', { class: 'attachment', 'data-testid': 'task-attachment' }, `📎 ${t.attachment}`) : '',
    el('label', { class: 'btn' }, 'Attach', el('input', { type: 'file', class: 'sr-only', onchange: attach,
      'aria-label': `Attach file to ${t.title}`, 'data-testid': 'task-attachment-input' })),
    el('button', { type: 'button', class: 'secondary', 'aria-label': `Edit ${t.title}`, 'data-testid': 'edit-task',
      onclick: () => { editingId = t.id; render(); } }, 'Edit'),
    el('button', { type: 'button', class: 'danger', 'aria-label': `Delete ${t.title}`, 'data-testid': 'delete-task',
      onclick: () => confirmDelete(t) }, 'Delete'));
}

async function updateTask(id, changes) {
  const updated = await api('PUT', `/api/tasks/${id}`, changes);
  tasks = tasks.map((t) => (t.id === id ? updated : t));
  editingId = null;
  render();
}

function confirmDelete(task) {
  const dialog = $('#confirm-dialog');
  $('#confirm-text').textContent = `"${task.title}" will be permanently deleted.`;
  dialog.returnValue = '';
  dialog.onclose = () => dialog.returnValue === 'confirm' && run(async () => {
    await api('DELETE', `/api/tasks/${task.id}`);
    tasks = tasks.filter((t) => t.id !== task.id);
    render();
  });
  dialog.showModal();
}

$('#add-form').addEventListener('submit', (event) => {
  event.preventDefault();
  run(async () => {
    const title = $('#new-title').value.trim();
    if (!title) throw new Error('Task title is required');
    tasks.push(await api('POST', '/api/tasks', { title }));
    $('#new-title').value = '';
    render();
  });
});
$('#search').addEventListener('input', render);
$('#status').addEventListener('change', render);
$('#logout').addEventListener('click', () => api('POST', '/api/logout').then(() => show('login')));

api('GET', '/api/me').then(enterApp, () => show('login'));
