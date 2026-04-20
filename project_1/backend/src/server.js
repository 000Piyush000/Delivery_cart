import dotenv from "dotenv";
import app from "./app.js";
import { startDailyReportJob } from "./jobs/dailyReportJob.js";

dotenv.config();

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
  startDailyReportJob();
});
