export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

export type HealthResponse = {
  status: string;
  timestamp: string;
  uptime: number;
};

export type TasksResponse = {
  tasks: Task[];
};

export type TaskResponse = {
  task: Task;
};

export type CreateTaskRequest = {
  title: string;
};

export type UpdateTaskRequest = {
  completed?: boolean;
  title?: string;
};
