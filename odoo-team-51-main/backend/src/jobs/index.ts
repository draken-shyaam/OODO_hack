import cron from "node-cron";
import { runDailyReportJob } from "./dailyReports.job";
import { runLowStockAlertJob } from "./lowStockAlert.job";

export function startCronJobs(): void {
  cron.schedule("0 6 * * *", () => {
    runDailyReportJob().catch((e) => console.error("[Daily Report] failed:", e));
  });

  cron.schedule("0 * * * *", () => {
    runLowStockAlertJob().catch((e) => console.error("[Low Stock Alert] failed:", e));
  });

  // eslint-disable-next-line no-console
  console.log("Cron jobs scheduled: daily report (06:00), low-stock alert (hourly)");
}
