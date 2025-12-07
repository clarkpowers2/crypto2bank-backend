import { pool } from "../../config/db";

export async function createTransaction(userId: string, quote: any) {
  const { rows } = await pool.query(
    `INSERT INTO transactions 
      (user_id, type, asset_code, crypto_amount, fiat_amount, fee_total, net_amount, status)
      VALUES ($1, 'CONVERSION', $2, $3, $4, $5, $6, 'COMPLETED')
      RETURNING id, status, net_amount`,
    [userId, quote.assetCode, quote.cryptoAmount, quote.fiatAmount, quote.fees.total, quote.netAmount]
  );
  return rows[0];
}