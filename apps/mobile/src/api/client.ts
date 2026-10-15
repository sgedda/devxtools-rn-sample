import Constants from 'expo-constants';
import type { Task, TasksResponse, TaskResponse, CreateTaskRequest } from '@devxtools/shared';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${this.baseUrl}/tasks`);
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    const data: TasksResponse = await response.json();
    return data.tasks;
  }

  async createTask(title: string): Promise<Task> {
    const body: CreateTaskRequest = { title };
    const response = await fetch(`${this.baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    const data: TaskResponse = await response.json();
    return data.task;
  }

  async toggleTask(id: string, completed: boolean): Promise<Task> {
    const response = await fetch(`${this.baseUrl}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    if (!response.ok) {
      throw new Error('Failed to update task');
    }
    const data: TaskResponse = await response.json();
    return data.task;
  }

  async deleteTask(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
  }
}

export const apiClient = new ApiClient();
