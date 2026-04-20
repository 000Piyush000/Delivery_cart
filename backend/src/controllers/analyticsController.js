import {
  getAnalyticsSummary,
  getDatabaseEntityPreviewRows,
  getDatabaseColumns,
  getDatabaseEntityCounts,
  getRiderPerformance
} from "../models/analyticsModel.js";
import { getAuditLogs } from "../models/auditModel.js";

const databaseEntities = [
  {
    key: "orders",
    label: "Orders",
    sourceTable: "orders",
    description: "Delivery lifecycle records, SLA timestamps, and routing destinations.",
    relation: "orders.customer_id -> users.id, orders.hub_id -> hubs.id"
  },
  {
    key: "customers",
    label: "Customers",
    sourceTable: "users",
    description: "Customer account details and addresses stored in the users table.",
    relation: "users.role = customer"
  },
  {
    key: "riders",
    label: "Delivery agents",
    sourceTable: "riders",
    description: "Rider profile, coordinates, availability, and workload status inputs.",
    relation: "riders.user_id -> users.id"
  },
  {
    key: "hubs",
    label: "Hub details",
    sourceTable: "hubs",
    description: "Hub master data with geographic coordinates for routing.",
    relation: "Referenced by orders.hub_id"
  },
  {
    key: "assignments",
    label: "Assignments",
    sourceTable: "assignments",
    description: "Live order-to-rider links with ETA and assignment timestamp.",
    relation: "assignments.order_id -> orders.id, assignments.rider_id -> riders.id"
  },
  {
    key: "audit_logs",
    label: "Audit logs",
    sourceTable: "audit_logs",
    description: "Operational history of admin, rider, support, and system actions.",
    relation: "audit_logs.user_id -> users.id"
  }
];

export const getAnalytics = async (req, res) => {
  const [summaryResult, performanceResult, auditResult] = await Promise.all([
    getAnalyticsSummary(),
    getRiderPerformance(),
    getAuditLogs({ limit: 10, excludeActions: ["POD_ACCESSED"] })
  ]);

  return res.json({
    summary: summaryResult.rows[0],
    riderPerformance: performanceResult.rows,
    auditLogs: auditResult.rows
  });
};

export const getAuditTrail = async (req, res) => {
  const result = await getAuditLogs({ limit: 10, excludeActions: ["POD_ACCESSED"] });
  return res.json(result.rows);
};

export const getDatabaseOverview = async (req, res) => {
  const sourceTables = [...new Set(databaseEntities.map((entity) => entity.sourceTable))];
  const [countResult, columnResult, previewRowsByEntity] = await Promise.all([
    getDatabaseEntityCounts(),
    getDatabaseColumns(sourceTables),
    getDatabaseEntityPreviewRows(3)
  ]);

  const recordCountByEntity = countResult.rows.reduce((accumulator, row) => {
    accumulator[row.entity_key] = Number(row.record_count ?? 0);
    return accumulator;
  }, {});

  const columnsByTable = columnResult.rows.reduce((accumulator, row) => {
    if (row.column_name === "password_hash") {
      return accumulator;
    }

    if (!accumulator[row.table_name]) {
      accumulator[row.table_name] = [];
    }

    accumulator[row.table_name].push({
      name: row.column_name,
      type: row.data_type
    });
    return accumulator;
  }, {});

  return res.json(
    databaseEntities.map((entity) => ({
      ...entity,
      recordCount: recordCountByEntity[entity.key] ?? 0,
      columns: columnsByTable[entity.sourceTable] || [],
      previewRows: previewRowsByEntity[entity.key] || []
    }))
  );
};
