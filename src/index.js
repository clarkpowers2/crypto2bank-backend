// src/index.js - Crypto2Bank backend (DEMO-STABLE)

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------- SUPABASE ----------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---------- LIVE PRICE FEED (COINGECKO) ----------
const COINGECKO_IDS = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin"
};

async function getUsdRateForAsset(assetSymbol) {
  const symbol = (assetSymbol || "").toUpperCase();
  const id = COINGECKO_IDS[symbol];

  if (!id) {
    throw new Error(`Unsupported asset: ${symbol}`);
  }

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;

  const res = await axios.get(url, { timeout: 5000 });
  const price = res.data?.[id]?.usd;
  if (!price) throw new Error("No price from CoinGecko");
  return price;
}

// ---------- ROUTE: CREATE DEPOSIT (DEMO, NO COINBASE) ----------
app.post("/api/deposits/create", async (req, res) => {
  try {
    const { asset, amountCrypto, userId } = req.body;

    if (!asset || !amountCrypto) {
      return res
        .status(400)
        .json({ ok: false, error: "asset and amountCrypto required" });
    }

    const assetSymbol = String(asset).toUpperCase();
    const amount = Number(amountCrypto);

    if (isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ ok: false, error: "amountCrypto must be > 0" });
    }

    const { data: deposit, error } = await supabase
      .from("deposits")
      .insert({
        user_id: userId || null,
        wallet_id: null,
        provider: "demo",
        external_id: null,
        asset: assetSymbol,
        amount_crypto: amount,
        status: "pending"
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase deposit insert error:", error);
      return res.status(500).json({ ok: false, error: "db_error" });
    }

    // Fake hosted payment link for demo
    const hostedUrl = `https://demo.crypto2bank.local/pay/${deposit.id}`;

    return res.json({
      ok: true,
      hosted_url: hostedUrl,
      deposit_id: deposit.id,
      charge_id: deposit.id
    });
  } catch (err) {
    console.error("Create deposit error:", err.message || err);
    return res.status(500).json({ ok: false, error: "create_deposit_failed" });
  }
});

// ---------- ROUTE: CONVERT DEPOSIT ----------
app.post("/api/convert", async (req, res) => {
  try {
    const { depositId } = req.body;

    if (!depositId) {
      return res.status(400).json({ ok: false, error: "depositId required" });
    }

    const { data: deposit, error } = await supabase
      .from("deposits")
      .select("*")
      .eq("id", depositId)
      .single();

    if (error || !deposit) {
      return res.status(404).json({ ok: false, error: "deposit_not_found" });
    }

    // For demo, we don’t enforce status = confirmed
    const amountCrypto = Number(deposit.amount_crypto);
    const asset = deposit.asset;

const liveRateUsd = await getUsdRateForAsset(asset);
const grossFiat = amountCrypto * liveRateUsd;

// New fee logic: 3% + $1.50 flat
const feePercent = 3;          // 3%
const feeFlat = 1.5;           // $1.50
const feeFromPercent = (grossFiat * feePercent) / 100;
const feeAmount = feeFromPercent + feeFlat;
const netFiat = grossFiat - feeAmount;

const { data: conversion, error: convErr } = await supabase
  .from("conversions")
  .insert({
    deposit_id: deposit.id,
    user_id: deposit.user_id,
    asset_in: asset,
    amount_in_crypto: amountCrypto,
    fiat_currency: "USD",
    amount_fiat_gross: grossFiat,
    fee_percent: feePercent,    // store 3
    fee_amount: feeAmount,      // includes both 3% + 1.50
    amount_fiat_net: netFiat,
    provider: "coingecko",
    status: "completed"
  })

      .select()
      .single();

    if (convErr) {
      console.error("Supabase conversion insert error:", convErr);
      return res.status(500).json({ ok: false, error: "db_error" });
    }

    return res.json({ ok: true, conversion });
  } catch (err) {
    console.error("Convert error:", err.message || err);
    return res.status(500).json({ ok: false, error: "convert_failed" });
  }
});

// ---------- ROUTE: PAYOUT (DEMO) ----------
app.post("/api/payouts", async (req, res) => {
  try {
    const { conversionId, bankAccountId } = req.body;

    if (!conversionId || !bankAccountId) {
      return res.status(400).json({
        ok: false,
        error: "conversionId and bankAccountId required"
      });
    }

    const { data: conversion, error: convErr } = await supabase
      .from("conversions")
      .select("*")
      .eq("id", conversionId)
      .single();

    if (convErr || !conversion) {
      return res.status(404).json({ ok: false, error: "conversion_not_found" });
    }

    const { data: bankAccount, error: bankErr } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("id", bankAccountId)
      .single();

    if (bankErr || !bankAccount) {
      return res
        .status(404)
        .json({ ok: false, error: "bank_account_not_found" });
    }

    const externalId = "demo_payout_123";

    const { data: payout, error: payoutErr } = await supabase
      .from("payouts")
      .insert({
        user_id: conversion.user_id,
        conversion_id: conversion.id,
        bank_account_id: bankAccount.id,
        fiat_currency: "USD",
        amount_fiat: conversion.amount_fiat_net,
        provider: "demo",
        external_id: externalId,
        status: "processing"
      })
      .select()
      .single();

    if (payoutErr) {
      console.error("Supabase payout insert error:", payoutErr);
      return res.status(500).json({ ok: false, error: "db_error" });
    }

    return res.json({ ok: true, payout });
  } catch (err) {
    console.error("Payout error:", err.message || err);
    return res.status(500).json({ ok: false, error: "payout_failed" });
  }
});
// ---------- ADMIN SUMMARY ----------
app.get("/api/admin/summary", async (req, res) => {
  try {
    // All conversions
    const { data: conversions, error: convErr } = await supabase
      .from("conversions")
      .select("*");

    if (convErr) {
      console.error("Admin summary conversions error:", convErr);
      return res.status(500).json({ ok: false, error: "db_error" });
    }

    let totalGross = 0;
    let totalFees = 0;
    let totalNet = 0;

    (conversions || []).forEach((c) => {
      totalGross += Number(c.amount_fiat_gross || 0);
      totalFees += Number(c.fee_amount || 0);
      totalNet += Number(c.amount_fiat_net || 0);
    });

    // Count payouts
    const { data: payouts, error: payErr } = await supabase
      .from("payouts")
      .select("*");

    if (payErr) {
      console.error("Admin summary payouts error:", payErr);
      return res.status(500).json({ ok: false, error: "db_error" });
    }

    const summary = {
      total_gross: totalGross,
      total_fees: totalFees,
      total_net: totalNet,
      conversion_count: (conversions || []).length,
      payout_count: (payouts || []).length
    };

    return res.json({ ok: true, summary });
  } catch (err) {
    console.error("Admin summary error:", err);
    return res.status(500).json({ ok: false, error: "summary_failed" });
  }
});
// ---------- ADMIN ACTIVITY (recent rows, no created_at dependency) ----------
app.get("/api/admin/activity", async (req, res) => {
  try {
    const limit = 10;

    const { data: deposits, error: depErr } = await supabase
      .from("deposits")
      .select("*")
      .limit(limit);

    const { data: conversions, error: convErr } = await supabase
      .from("conversions")
      .select("*")
      .limit(limit);

    const { data: payouts, error: payErr } = await supabase
      .from("payouts")
      .select("*")
      .limit(limit);

    if (depErr || convErr || payErr) {
      console.error("Admin activity error:", depErr || convErr || payErr);
      return res.status(500).json({ ok: false, error: "db_error" });
    }

    return res.json({
      ok: true,
      deposits: deposits || [],
      conversions: conversions || [],
      payouts: payouts || []
    });
  } catch (err) {
    console.error("Admin activity error:", err);
    return res.status(500).json({ ok: false, error: "activity_failed" });
  }
});

// ---------- HEALTH ----------
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "Crypto2Bank backend (demo)" });
});

// ---------- START ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Crypto2Bank backend (demo) running on :${PORT}`);
});
