import { createUser, loginUser } from "./src/modules/auth/auth.service";
import { addBankAccount } from "./src/modules/banks/bank.service";
import { getQuote } from "./src/modules/quotes/quote.service";
import { createTransaction } from "./src/modules/transactions/transaction.service";
import { createPayout } from "./src/modules/payouts/payout.service";
import { pool } from "./src/config/db";

async function run() {
  try {
    const email = `test_user_${Date.now()}@crypto2bank.online`;
    const password = "Password123!";

    console.log(`\n🔵 1. SIGNUP: Creating user ${email}...`);
    const user = await createUser(email, password);
    console.log(`✅ User Created: ID ${user.id} | Tier: ${user.kyc_tier}`);

    console.log(`\n🔵 2. BANK: Adding bank account...`);
    const bank = await addBankAccount(user.id, "123456789", "987654321");
    console.log(`✅ Bank Added: ${bank.masked_account} | Status: ${bank.status}`);

    console.log(`\n🔵 3. QUOTE: Selling 0.1 BTC...`);
    const quote = await getQuote(user.id, "BTC", 0.1, "ACH");
    console.log(`📊 Quote: ${quote.cryptoAmount} BTC = $${quote.fiatAmount}`);
    console.log(`   Fees: $${quote.fees.total}`);
    console.log(`   Net Payout: $${quote.netAmount}`);

    console.log(`\n🔵 4. CONVERT: Executing trade...`);
    const txn = await createTransaction(user.id, quote);
    console.log(`✅ Trade Done: TxID ${txn.id}`);

    console.log(`\n🔵 5. PAYOUT: Sending $${quote.netAmount} to Bank...`);
    const payout = await createPayout(user.id, txn.id, "ACH");
    console.log(`💸 Payout Started! Provider Ref: ${payout.provider_ref}`);
    console.log(`   Status: ${payout.status}`);

    console.log("\n✨ SUCCESS! End-to-end flow complete.\n");

  } catch (err) {
    console.error("❌ ERROR:", err);
  } finally {
    await pool.end();
  }
}

run();
