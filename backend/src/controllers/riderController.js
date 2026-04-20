import bcrypt from "bcryptjs";
import {
  createRider,
  deleteRider,
  getRiderByUserId,
  getRiderTasks,
  getRiders,
  updateRiderAvailability
} from "../models/riderModel.js";
import { findUserByName } from "../models/userModel.js";
import { createAuditLog } from "../models/auditModel.js";

export const listRiders = async (req, res) => {
  const result = await getRiders();
  return res.json(result.rows);
};

export const addRider = async (req, res) => {
  const { name, password, location = "", latitude, longitude, availability = true } = req.body;
  const normalizedName = String(name ?? "").trim();
  const normalizedLocation = String(location ?? "").trim();
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);
  const resolvedAvailability = !(availability === false || availability === "false");

  if (!normalizedName || !String(password ?? "").trim()) {
    return res.status(400).json({ message: "Rider name and password are required" });
  }

  if (!Number.isFinite(numericLatitude) || !Number.isFinite(numericLongitude)) {
    return res.status(400).json({ message: "A valid rider latitude and longitude are required" });
  }

  const existingUser = await findUserByName(normalizedName);
  if (existingUser.rows.length) {
    return res.status(409).json({ message: "A user with this rider name already exists" });
  }

  const passwordHash = await bcrypt.hash(String(password).trim(), 10);
  const result = await createRider({
    name: normalizedName,
    passwordHash,
    location: normalizedLocation || null,
    latitude: numericLatitude,
    longitude: numericLongitude,
    availability: resolvedAvailability
  });

  await createAuditLog({
    userId: req.user.id,
    action: "RIDER_CREATED",
    metadata: { riderId: result.rows[0].id, riderName: normalizedName }
  });

  return res.status(201).json(result.rows[0]);
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

export const removeRider = async (req, res) => {
  const riderId = Number(req.params.riderId);
  const result = await deleteRider(riderId);

  if (!result.rows.length) {
    return res.status(404).json({ message: "Rider not found" });
  }

  await createAuditLog({
    userId: req.user.id,
    action: "RIDER_REMOVED",
    metadata: { riderId, riderName: result.rows[0].name }
  });

  return res.json({
    message: "Rider removed successfully",
    rider: result.rows[0]
  });
};
