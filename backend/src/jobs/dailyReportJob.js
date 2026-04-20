import fs from "fs";
import path from "path";
import cron from "node-cron";
import { fileURLToPath } from "url";
import { getDailyReportData } from "../models/orderModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportsDirectory = path.resolve(__dirname, "../../reports");

if (!fs.existsSync(reportsDirectory)) {
  fs.mkdirSync(reportsDirectory, { recursive: true });
}

export const generateDailyReport = async () => {
  const reportResult = await getDailyReportData();
  const report = {
    generatedAt: new Date().toISOString(),
    ...reportResult.rows[0]
  };

  const fileName = `report-${new Date().toISOString().slice(0, 10)}.json`;
  fs.writeFileSync(path.join(reportsDirectory, fileName), JSON.stringify(report, null, 2));
  return report;
};

export const startDailyReportJob = () => {
  cron.schedule("0 23 * * *", async () => {
    await generateDailyReport();
  });
};
