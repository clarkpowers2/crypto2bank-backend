const fs = require('fs');
const path = require('path');

// Helper to write files
const writeFile = (filePath, content) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content.trim());
  console.log(`✅ Created: ${filePath}`);
};

// 1. CONFIG
writeFile('src/config/env.ts', `
import dotenv from "dotenv";
dotenv.config();
export const env = {
  PORT: process.env.PORT || 4000,
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",
  MOOV_BASE_URL: process.env.MOOV_BASE_URL || "https://api.moov.io",
  MOOV_ACCOUNT_ID: process.env.MOOV_ACCOUNT_ID || ""
};
`);

writeFile('src/config/db.ts', `
import { Pool } from "pg";
import { env } from "./env";
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});
`);

// 2. AUTH SERVICE
writeFile('src/modules/auth/auth.service.ts', `
import { pool } from "../../config/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export async function createUser(email: string, password: string) {
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    \`INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, kyc_tier\`,
    [email, hash]
  );
  return rows[0];
}

export async function loginUser(email: string, password: string) {
  const { rows } = await pool.query(\`SELECT * FROM users WHERE email = $1\`, [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return null;
  const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET);
  return { user, token };
}
`);

// 3. BANK SERVICE
writeFile('src/modules/banks/bank.service.ts', `
import { pool } from "../../config/db";
import crypto from "crypto";

export async function addBankAccount(userId: string, routingNumber: string, accountNumber: string) {
  const masked = "****" + accountNumber.slice(-4);
  const routingHash = crypto.createHash("sha256").update(routingNumber).digest("hex");
  const accountHash = crypto.createHash("sha256").update(accountNumber).digest("hex");
  
  const { rows } = await pool.query(
    \`INSERT INTO bank_accounts (user_id, masked_account, routing_hash, account_hash, status)
     VALUES ($1, $2, $3, $4, 'VERIFIED') RETURNING id, masked_account, status\`,
    [userId, masked, routingHash, accountHash]
  );
  return rows[0];
}
`);

// 4. QUOTE SERVICE
writeFile('src/modules/quotes/quote.service.ts', `
import { pool } from "../../config/db";

export async function getQuote(userId: string, assetCode: string, cryptoAmount: number, payoutType: string) {
  // Simplified logic for simulation
  const price = 50000; // Mock BTC price
  const fiatAmount = cryptoAmount * price;
  const feeTotal = fiatAmount * 0.03 + 1.50; // 3% + $1.50
  const netAmount = fiatAmount - feeTotal;
  
  return {
    quoteId: "mock-quote-id",
    assetCode,
    cryptoAmount,
    fiatAmount,
    fees: { total: feeTotal },
    netAmount,
    priceUsed: price
  };
}
`);

// 5. TRANSACTION SERVICE (Helper)
writeFile('src/modules/transactions/transaction.service.ts', `
import { pool } from "../../config/db";

export async function createTransaction(userId: string, quote: any) {
  const { rows } = await pool.query(
    \`INSERT INTO transactions 
      (user_id, type, asset_code, crypto_amount, fiat_amount, fee_total, net_amount, status)
      VALUES ($1, 'CONVERSION', $2, $3, $4, $5, $6, 'COMPLETED')
      RETURNING id, status, net_amount\`,
    [userId, quote.assetCode, quote.cryptoAmount, quote.fiatAmount, quote.fees.total, quote.netAmount]
  );
  return rows[0];
}
`);

// 6. PAYOUT SERVICE (With Moov Stub)
writeFile('src/modules/payouts/payout.service.ts', `
import { pool } from "../../config/db";

export async function createPayout(userId: string, transactionId: string, type: string) {
  // Simulate Moov call success
  const moovId = "moov_transfer_" + Math.floor(Math.random() * 100000);
  
  const { rows } = await pool.query(
    \`INSERT INTO payouts (user_id, transaction_id, type, provider, provider_ref, status)
     VALUES ($1, $2, $3, 'MOOV', $4, 'PROCESSING')
     RETURNING id, status, provider_ref\`,
    [userId, transactionId, type, moovId]
  );
  return rows[0];
}
`);

console.log("🚀 ALL FILES GENERATED SUCCESSFULLY.");
