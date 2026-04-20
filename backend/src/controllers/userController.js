import { getUsersByRole } from "../models/userModel.js";

export const listUsersByRole = async (req, res) => {
  const result = await getUsersByRole(req.params.role);
  return res.json(result.rows);
};
