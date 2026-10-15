import { http, HttpResponse } from 'msw';
import type { Task } from '@devxtools/shared';

// In-memory task store for MSW
let mockTasks: Task[] = [
  {
    id: '1',
    title: 'Tap the circle to complete me, swipe left to delete',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

// Helper to generate unique IDs
function generateId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Base handlers for normal operation
export const handlers = [
  // GET /tasks
  http.get('*/tasks', async () => {
    return HttpResponse.json({ tasks: mockTasks });
  }),

  // GET /tasks/:id
  http.get('*/tasks/:id', async ({ params }) => {
    const { id } = params;
    const task = mockTasks.find(t => t.id === id);

    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return HttpResponse.json({ task });
  }),

  // POST /tasks
  http.post('*/tasks', async ({ request }) => {
    const body = (await request.json()) as { title: string };

    if (!body.title || typeof body.title !== 'string') {
      return HttpResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const title = body.title.trim();

    if (title.length === 0) {
      return HttpResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }

    if (title.length > 200) {
      return HttpResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      );
    }

    const newTask: Task = {
      id: generateId(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    mockTasks.unshift(newTask);
    return HttpResponse.json({ task: newTask }, { status: 201 });
  }),

  // PATCH /tasks/:id
  http.patch('*/tasks/:id', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as { completed?: boolean; title?: string };
    const task = mockTasks.find(t => t.id === id);

    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (typeof body.completed === 'boolean') {
      task.completed = body.completed;
    }

    if (typeof body.title === 'string') {
      const title = body.title.trim();

      if (title.length === 0) {
        return HttpResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }

      if (title.length > 200) {
        return HttpResponse.json(
          { error: 'Title must be 200 characters or less' },
          { status: 400 }
        );
      }

      task.title = title;
    }

    return HttpResponse.json({ task });
  }),

  // DELETE /tasks/:id
  http.delete('*/tasks/:id', async ({ params }) => {
    const { id } = params;
    const index = mockTasks.findIndex(t => t.id === id);

    if (index === -1) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    mockTasks.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),

  // Health endpoint
  http.get('*/health', async () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: 0,
      source: 'msw',
    });
  }),
];

// Reset mock tasks to initial state
export function resetMockTasks() {
  mockTasks = [
    {
      id: '1',
      title: 'Tap the circle to complete me, swipe left to delete',
      completed: false,
      createdAt: new Date().toISOString(),
    },
  ];
}
