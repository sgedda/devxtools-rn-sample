import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import type { Task } from '@devxtools/shared';

// In-memory store for demo purposes
const tasks: Task[] = [
  {
    id: '1',
    title: 'Welcome to devxtools.dev sample app',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

// Health check endpoint
app.get('/health', c => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Logging endpoint for observability demos
app.post('/logs', async c => {
  const body = await c.req.json();
  console.log('[CLIENT LOG]', body);
  return c.json({ received: true });
});

// Tasks endpoints
app.get('/tasks', c => {
  return c.json({ tasks });
});

app.get('/tasks/:id', c => {
  const id = c.req.param('id');
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }

  return c.json({ task });
});

app.post('/tasks', async c => {
  const body = await c.req.json<{ title: string }>();

  if (!body.title || typeof body.title !== 'string') {
    return c.json({ error: 'Title is required' }, 400);
  }

  const newTask: Task = {
    id: String(Date.now()),
    title: body.title,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.push(newTask);
  return c.json({ task: newTask }, 201);
});

app.patch('/tasks/:id', async c => {
  const id = c.req.param('id');
  const body = await c.req.json<{ completed?: boolean; title?: string }>();
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }

  if (typeof body.completed === 'boolean') {
    task.completed = body.completed;
  }
  if (typeof body.title === 'string') {
    task.title = body.title;
  }

  return c.json({ task });
});

app.delete('/tasks/:id', c => {
  const id = c.req.param('id');
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return c.json({ error: 'Task not found' }, 404);
  }

  tasks.splice(index, 1);
  return c.json({ success: true });
});

export default app;
