import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createCustomer, findUserByName } from "../models/userModel.js";

dotenv.config();

const buildAuthResponse = (user) => {
  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      address: user.address ?? null
    }
  };
};

export const login = async (req, res) => {
  const { name, password } = req.body;
  const normalizedName = name?.trim();
  const result = await findUserByName(normalizedName);

  if (!result.rows.length) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = result.rows[0];
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.json(buildAuthResponse(user));
};

export const registerCustomer = async (req, res) => {
  const { name, password, address } = req.body;
  const normalizedName = name?.trim();
  const normalizedAddress = address?.trim();

  if (!normalizedName || !password?.trim() || !normalizedAddress) {
    return res.status(400).json({ message: "Name, password, and address are required" });
  }

  const existingUser = await findUserByName(normalizedName);

  if (existingUser.rows.length) {
    return res.status(409).json({ message: "A user with this name already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const createdUser = await createCustomer({
    name: normalizedName,
    passwordHash,
    address: normalizedAddress
  });

  return res.status(201).json(buildAuthResponse(createdUser.rows[0]));
};
