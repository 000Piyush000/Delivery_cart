import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { upsertPod, getPodByOrderId } from "../models/podModel.js";
import { createAuditLog } from "../models/auditModel.js";
import { hashBuffer, hashFile } from "../utils/hash.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDirectory = path.resolve(__dirname, "../../uploads");

export const uploadPod = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "POD file is required" });
  }

  const orderId = Number(req.params.orderId);
  const fileHash = hashBuffer(fs.readFileSync(req.file.path));
  const relativeFileUrl = `/uploads/${path.basename(req.file.path)}`;

  const podResult = await upsertPod({
    orderId,
    fileUrl: process.env.STORAGE_MODE === "local"
      ? `${process.env.APP_BASE_URL}${relativeFileUrl}`
      : relativeFileUrl,
    fileHash
  });

  await createAuditLog({
    userId: req.user.id,
    action: "POD_UPLOADED",
    metadata: { orderId, fileHash }
  });

  return res.status(201).json(podResult.rows[0]);
};

export const verifyAndGetPod = async (req, res) => {
  const orderId = Number(req.params.orderId);
  const podResult = await getPodByOrderId(orderId);

  if (!podResult.rows.length) {
    return res.status(404).json({ message: "POD not found" });
  }

  const podRecord = podResult.rows[0];
  const localPath = path.resolve(uploadsDirectory, path.basename(podRecord.file_url));

  if (!fs.existsSync(localPath)) {
    return res.status(404).json({ message: "POD file is missing from storage" });
  }

  // Recompute the stored artifact hash at read time so auditors can detect tampering.
  const recomputedHash = hashFile(localPath);
  const verified = recomputedHash === podRecord.file_hash;

  await createAuditLog({
    userId: req.user.id,
    action: "POD_ACCESSED",
    metadata: { orderId, verified }
  });

  return res.json({
    ...podRecord,
    verified,
    recomputedHash
  });
};
