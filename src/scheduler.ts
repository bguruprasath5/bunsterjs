import cron from "node-cron";

export class Scheduler {
  private taskMap: Map<string, cron.ScheduledTask> = new Map();

  schedule(
    taskId: string,
    cronExpression: string,
    taskFunction: () => void
  ): void {
    if (!cron.validate(cronExpression)) {
      throw new Error("Invalid Cron Expression!");
    }

    if (this.taskMap.has(taskId)) {
      throw new Error(
        `Task with id: ${taskId} already exists. Please use a unique identifier.`
      );
    }

    const task = cron.schedule(cronExpression, taskFunction);
    this.taskMap.set(taskId, task);
  }

  listTasks(): string[] {
    return [...this.taskMap.keys()];
  }
}
