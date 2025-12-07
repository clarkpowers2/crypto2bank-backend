import { pool } from "../../config/db";
import crypto from "crypto";

export async function addBankAccount(userId: string, routingNumber: string, accountNumber: string) {
  const masked = "****" + accountNumber.slice(-4);
  const routingHash = crypto.createHash("sha256").update(routingNumber).digest("hex");
  const accountHash = crypto.createHash("sha256").update(accountNumber).digest("hex");
  
  const { rows } = await pool.query(
    `INSERT INTO bank_accounts (user_id, masked_account, routing_hash, account_hash, status)
     VALUES ($1, $2, $3, $4, 'VERIFIED') RETURNING id, masked_account, status`,
    [userId, masked, routingHash, accountHash]
  );
  return rows[0];
}