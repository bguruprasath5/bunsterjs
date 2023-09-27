import cron from "node-cron";

export class Scheduler {
  schedule(cronExpression: string, taskFunction: () => void): void {
    if (!cron.validate(cronExpression)) {
      throw new Error("Invalid Cron Expression!");
    }
    cron.schedule(cronExpression, taskFunction);
  }
}
