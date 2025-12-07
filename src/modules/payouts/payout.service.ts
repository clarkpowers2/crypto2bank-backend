import { pool } from "../../config/db";

export async function createPayout(userId: string, transactionId: string, type: string) {
  // Simulate Moov call success
  const moovId = "moov_transfer_" + Math.floor(Math.random() * 100000);
  
  const { rows } = await pool.query(
    `INSERT INTO payouts (user_id, transaction_id, type, provider, provider_ref, status)
     VALUES ($1, $2, $3, 'MOOV', $4, 'PROCESSING')
     RETURNING id, status, provider_ref`,
    [userId, transactionId, type, moovId]
  );
  return rows[0];
}