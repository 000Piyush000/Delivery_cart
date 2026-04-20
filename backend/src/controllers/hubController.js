import { createAuditLog } from "../models/auditModel.js";
import { createHub, getHubs } from "../models/hubModel.js";

export const listHubs = async (req, res) => {
  const result = await getHubs();
  return res.json(result.rows);
};

export const createNewHub = async (req, res) => {
  const { name, latitude, longitude } = req.body;
  const normalizedName = String(name ?? "").trim();
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);

  if (!normalizedName) {
    return res.status(400).json({ message: "Hub name is required" });
  }

  if (!Number.isFinite(numericLatitude) || !Number.isFinite(numericLongitude)) {
    return res.status(400).json({ message: "Hub latitude and longitude are required" });
  }

  const result = await createHub({
    name: normalizedName,
    latitude: numericLatitude,
    longitude: numericLongitude
  });

  await createAuditLog({
    userId: req.user.id,
    action: "HUB_CREATED",
    metadata: { hubId: result.rows[0].id, hubName: normalizedName }
  });

  return res.status(201).json(result.rows[0]);
};
