import { getAnalyticsSummary, getRiderPerformance } from "../models/analyticsModel.js";
import { getAuditLogs } from "../models/auditModel.js";

export const getAnalytics = async (req, res) => {
  const [summaryResult, performanceResult, auditResult] = await Promise.all([
    getAnalyticsSummary(),
    getRiderPerformance(),
    getAuditLogs()
  ]);

  return res.json({
    summary: summaryResult.rows[0],
    riderPerformance: performanceResult.rows,
    auditLogs: auditResult.rows.slice(0, 25)
  });
};

export const getAuditTrail = async (req, res) => {
  const result = await getAuditLogs();
  return res.json(result.rows);
};
