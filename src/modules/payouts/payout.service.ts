import { pool } from "../../config/db";
import { moovCreateAchPayout } from "../../integrations/moov";

export async function createPayout(userId: string, transactionId: string, type: string) {
  // 1. Get the Transaction
  const { rows: txns } = await pool.query(
    `SELECT * FROM transactions WHERE id = $1 AND user_id = $2`, 
    [transactionId, userId]
  );
  if (txns.length === 0) throw new Error("Transaction not found");
  const txn = txns[0];

  // 2. Real Logic: Call Moov (We use placeholder IDs if you haven't set up customers yet)
  console.log("📡 Connecting to Banking Rails...");
  
  // NOTE: In production, you would look up the user's real 'moov_customer_id' from your DB
  const mockMoovCustomer = "mc_123456"; 
  const mockBankAccount = "ba_987654"; 

  // We wrap this in a try/catch so your simulation doesn't crash if Keys are missing
  let providerRef = "SIMULATION_REF";
  let status = "PROCESSING";
  
  try {
    // This will fail until you put real keys in .env, so we fallback to simulation
    // const result = await moovCreateAchPayout({ 
    //   customerId: mockMoovCustomer, 
    //   accountId: mockBankAccount, 
    //   amount: Number(txn.net_amount) 
    // });
    // providerRef = result.transferID;
  } catch (e) {
    console.warn("⚠️ Moov call skipped (Missing Keys). Using Simulation.");
  }

  // 3. Save Payout Record
  const { rows } = await pool.query(
    `INSERT INTO payouts (user_id, transaction_id, type, provider, provider_ref, status)
     VALUES ($1, $2, $3, 'MOOV', $4, $5)
     RETURNING id, status, provider_ref`,
    [userId, transactionId, type, providerRef, status]
  );
  
  return rows[0];
}