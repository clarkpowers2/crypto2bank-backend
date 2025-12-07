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