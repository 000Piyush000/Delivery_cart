import {
  getRiderByUserId,
  getRiderTasks,
  getRiders,
  updateRiderAvailability
} from "../models/riderModel.js";
import { createAuditLog } from "../models/auditModel.js";

export const listRiders = async (req, res) => {
  const result = await getRiders();
  return res.json(result.rows);
};

export const getMyTasks = async (req, res) => {
  const riderResult = await getRiderByUserId(req.user.id);
  if (!riderResult.rows.length) {
    return res.status(404).json({ message: "Rider profile not found" });
  }

  const result = await getRiderTasks(Number(riderResult.rows[0].id));
  return res.json(result.rows);
};

export const setAvailability = async (req, res) => {
  const { riderId } = req.params;
  const { availability } = req.body;
  const result = await updateRiderAvailability(Number(riderId), availability);

  if (!result.rows.length) {
    return res.status(404).json({ message: "Rider not found" });
  }

  await createAuditLog({
    userId: req.user.id,
    action: "RIDER_AVAILABILITY_UPDATED",
    metadata: { riderId: Number(riderId), availability }
  });

  return res.json(result.rows[0]);
};
