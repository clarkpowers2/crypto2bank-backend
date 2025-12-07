import { env } from "../config/env";

const MOOV_URL = env.MOOV_BASE_URL;

// Helper to get headers (You will add your real API Keys later)
async function getMoovHeaders() {
  // In a real app, you might generate a signed JWT here.
  // For now, we assume Basic Auth or a static Key from .env
  return {
    "Authorization": `Basic ${Buffer.from(env.MOOV_ACCOUNT_ID + ":").toString('base64')}`,
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
}

export async function moovCreateAchPayout(params: { customerId: string, accountId: string, amount: number }) {
  const response = await fetch(`${MOOV_URL}/transfers`, {
    method: "POST",
    headers: await getMoovHeaders(),
    body: JSON.stringify({
      amount: { currency: "USD", value: Math.round(params.amount * 100) }, // Cents
      source: { paymentMethodID: params.accountId },
      destination: { paymentMethodID: params.customerId }, // Simplification for demo
      description: "Crypto2Bank Payout"
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Moov Error: ${JSON.stringify(data)}`);
  return data;
}