import crypto from "crypto";
import fs from "fs";

export const hashBuffer = (buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex");

export const hashFile = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  return hashBuffer(fileBuffer);
};
