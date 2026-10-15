import { describe, it, expect } from 'vitest';
import app from './app';
import type { TasksResponse, TaskResponse, HealthResponse } from '@devxtools/shared';

describe('API Integration Tests', () => {
  it('should return health status', async () => {
    const req = new Request('http://localhost/health');
    const res = await app.fetch(req);
    const data = (await res.json()) as HealthResponse;

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('uptime');
  });

  it('should list tasks', async () => {
    const req = new Request('http://localhost/tasks');
    const res = await app.fetch(req);
    const data = (await res.json()) as TasksResponse;

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('tasks');
    expect(Array.isArray(data.tasks)).toBe(true);
  });

  it('should create a new task with valid title', async () => {
    const req = new Request('http://localhost/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test task' }),
    });
    const res = await app.fetch(req);
    const data = (await res.json()) as TaskResponse;

    expect(res.status).toBe(201);
    expect(data.task).toHaveProperty('id');
    expect(data.task.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
    expect(data.task).toHaveProperty('title', 'Test task');
    expect(data.task).toHaveProperty('completed', false);
  });

  it('should reject empty title', async () => {
    const req = new Request('http://localhost/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    });
    const res = await app.fetch(req);
    const data = (await res.json()) as { error: string };

    expect(res.status).toBe(400);
    expect(data.error).toBe('Title cannot be empty');
  });

  it('should reject title over 200 characters', async () => {
    const longTitle = 'a'.repeat(201);
    const req = new Request('http://localhost/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: longTitle }),
    });
    const res = await app.fetch(req);
    const data = (await res.json()) as { error: string };

    expect(res.status).toBe(400);
    expect(data.error).toBe('Title must be 200 characters or less');
  });

  it('should toggle task completion', async () => {
    // First create a task
    const createReq = new Request('http://localhost/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Toggle test' }),
    });
    const createRes = await app.fetch(createReq);
    const createData = (await createRes.json()) as TaskResponse;
    const { task } = createData;

    // Then toggle it
    const toggleReq = new Request(`http://localhost/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    const toggleRes = await app.fetch(toggleReq);
    const toggleData = (await toggleRes.json()) as TaskResponse;

    expect(toggleRes.status).toBe(200);
    expect(toggleData.task.completed).toBe(true);
  });

  it('should reject updating task title to empty', async () => {
    // First create a task
    const createReq = new Request('http://localhost/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Update test' }),
    });
    const createRes = await app.fetch(createReq);
    const createData = (await createRes.json()) as TaskResponse;
    const { task } = createData;

    // Try to update with empty title
    const updateReq = new Request(`http://localhost/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    });
    const updateRes = await app.fetch(updateReq);
    const updateData = (await updateRes.json()) as { error: string };

    expect(updateRes.status).toBe(400);
    expect(updateData.error).toBe('Title cannot be empty');
  });

  it('should delete a task', async () => {
    // First create a task
    const createReq = new Request('http://localhost/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Delete test' }),
    });
    const createRes = await app.fetch(createReq);
    const createData = (await createRes.json()) as TaskResponse;
    const { task } = createData;

    // Then delete it
    const deleteReq = new Request(`http://localhost/tasks/${task.id}`, {
      method: 'DELETE',
    });
    const deleteRes = await app.fetch(deleteReq);
    const deleteData = (await deleteRes.json()) as { success: boolean };

    expect(deleteRes.status).toBe(200);
    expect(deleteData.success).toBe(true);
  });

  it('should return 404 for non-existent task', async () => {
    const req = new Request('http://localhost/tasks/00000000-0000-0000-0000-000000000000');
    const res = await app.fetch(req);

    expect(res.status).toBe(404);
  });

  it('should return 400 for missing title', async () => {
    const req = new Request('http://localhost/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await app.fetch(req);

    expect(res.status).toBe(400);
  });
});
