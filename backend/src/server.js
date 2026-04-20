import dotenv from "dotenv";
import app from "./app.js";
import { startDailyReportJob } from "./jobs/dailyReportJob.js";
import { ensureBackwardCompatibleSchema } from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await ensureBackwardCompatibleSchema();

    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
      startDailyReportJob();
    });
  } catch (error) {
    console.error("Failed to start backend", error);
    process.exit(1);
  }
};

startServer();
