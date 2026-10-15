import { apiClient } from '../client';
import { server } from '../../mocks/server.test-setup';
import { http, HttpResponse } from 'msw';

describe('API Client with MSW', () => {
  it('should fetch tasks successfully', async () => {
    const tasks = await apiClient.getTasks();

    expect(tasks).toBeDefined();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
  });

  it('should handle 500 server error', async () => {
    server.use(
      http.get('*/tasks', () => {
        return HttpResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      })
    );

    await expect(apiClient.getTasks()).rejects.toThrow();
  });

  it('should handle empty task list', async () => {
    server.use(
      http.get('*/tasks', () => {
        return HttpResponse.json({ tasks: [] });
      })
    );

    const tasks = await apiClient.getTasks();
    expect(tasks).toEqual([]);
  });

  it('should create a task', async () => {
    const newTask = await apiClient.createTask('Test task from Jest');

    expect(newTask).toHaveProperty('id');
    expect(newTask).toHaveProperty('title', 'Test task from Jest');
    expect(newTask).toHaveProperty('completed', false);
  });

  it('should reject empty task title', async () => {
    await expect(apiClient.createTask('   ')).rejects.toThrow('Title cannot be empty');
  });
});
