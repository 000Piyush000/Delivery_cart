import { createDispute, getDisputes, updateDispute } from "../models/disputeModel.js";
import { createAuditLog } from "../models/auditModel.js";

export const listDisputes = async (req, res) => {
  const result = await getDisputes();
  return res.json(result.rows);
};

export const raiseDispute = async (req, res) => {
  const orderId = Number(req.params.orderId);
  const { reason } = req.body;

  const result = await createDispute({
    orderId,
    reason,
    customerId: req.user.id
  });

  await createAuditLog({
    userId: req.user.id,
    action: "DISPUTE_OPENED",
    metadata: { orderId, reason }
  });

  return res.status(201).json(result.rows[0]);
};

export const resolveDispute = async (req, res) => {
  const disputeId = Number(req.params.id);
  const { status, resolution } = req.body;

  const allowedStatuses = ["investigate", "resolve", "close"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid dispute status" });
  }

  const result = await updateDispute({
    id: disputeId,
    status,
    resolution,
    supportAgentId: req.user.id
  });

  if (!result.rows.length) {
    return res.status(404).json({ message: "Dispute not found" });
  }

  await createAuditLog({
    userId: req.user.id,
    action: "DISPUTE_UPDATED",
    metadata: { disputeId, status, resolution }
  });

  return res.json(result.rows[0]);
};
