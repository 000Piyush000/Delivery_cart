import { createHub, getHubs } from "../models/hubModel.js";

export const listHubs = async (req, res) => {
  const result = await getHubs();
  return res.json(result.rows);
};

export const createNewHub = async (req, res) => {
  const result = await createHub(req.body);
  return res.status(201).json(result.rows[0]);
};
