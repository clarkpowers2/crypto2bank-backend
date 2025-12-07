import { pool } from "../../config/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export async function createUser(email: string, password: string) {
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, kyc_tier`,
    [email, hash]
  );
  return rows[0];
}

export async function loginUser(email: string, password: string) {
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return null;
  const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET);
  return { user, token };
}