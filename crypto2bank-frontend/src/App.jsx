import { useState } from "react";

function App() {
  const [asset, setAsset] = useState("ETH");
  const [amountCrypto, setAmountCrypto] = useState("0.05");

  const [depositId, setDepositId] = useState("");
  const [createdDepositId, setCreatedDepositId] = useState("");
  const [hostedUrl, setHostedUrl] = useState("");

  const [conversion, setConversion] = useState(null);
  const [payout, setPayout] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  // 1) Create a deposit (Coinbase charge)
  const handleCreateDeposit = async () => {
    try {
      const body = {
        asset,
        amountCrypto: Number(amountCrypto),
        userId: null
      };

      const res = await fetch(`${backendUrl}/api/deposits/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!data.ok) {
        alert(data.error || "Failed to create deposit");
        return;
      }

      setHostedUrl(data.hosted_url);
      setCreatedDepositId(data.deposit_id);
      setDepositId(data.deposit_id); // auto-fill for conversion

      alert("Deposit created. Pay using the hosted link, then convert once confirmed.");
    } catch (err) {
      console.error(err);
      alert("Error creating deposit");
    }
  };

  // 2) Convert deposit to USD
  const handleConvert = async () => {
    try {
      if (!depositId) {
        alert("Enter a depositId first.");
        return;
      }

      const res = await fetch(`${backendUrl}/api/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId })
      });

      const data = await res.json();
      if (data.ok) setConversion(data.conversion);
      else alert(data.error || "Conversion failed");
    } catch (err) {
      console.error(err);
      alert("Error converting deposit");
    }
  };

  // 3) Payout to bank (fake provider for now)
  const handlePayout = async () => {
    try {
      if (!conversion) {
        alert("Run a conversion first.");
        return;
      }

      const bankAccountId = prompt("Enter bankAccountId from Supabase bank_accounts:");
      if (!bankAccountId) return;

      const res = await fetch(`${backendUrl}/api/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversionId: conversion.id,
          bankAccountId
        })
      });

      const data = await res.json();
      if (data.ok) setPayout(data.payout);
      else alert(data.error || "Payout failed");
    } catch (err) {
      console.error(err);
      alert("Error creating payout");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-2">Crypto2Bank</h1>
      <p className="text-slate-300 mb-8">
        From wallet to bank in one flow.
      </p>

      <div className="w-full max-w-3xl grid md:grid-cols-2 gap-8">
        {/* CREATE DEPOSIT SECTION */}
        <div className="border border-slate-700 rounded-lg p-5 bg-slate-900">
          <h2 className="text-xl font-semibold mb-4">1. Create Deposit</h2>

          <label className="block text-sm mb-1">Asset</label>
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="w-full mb-3 px-3 py-2 rounded bg-slate-800 border border-slate-700"
          >
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="USDT">USDT</option>
            <option value="USDC">USDC</option>
          </select>

          <label className="block text-sm mb-1">Amount (crypto)</label>
          <input
            type="number"
            step="0.0001"
            value={amountCrypto}
            onChange={(e) => setAmountCrypto(e.target.value)}
            className="w-full mb-4 px-3 py-2 rounded bg-slate-800 border border-slate-700"
          />

          <button
            onClick={handleCreateDeposit}
            className="w-full py-2.5 rounded bg-emerald-500 font-semibold hover:bg-emerald-600"
          >
            Create Deposit Link
          </button>

          {hostedUrl && (
            <div className="mt-4 text-sm">
              <div className="mb-1 font-medium">Hosted payment link:</div>
              <a
                href={hostedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 underline break-all"
              >
                {hostedUrl}
              </a>
              {createdDepositId && (
                <div className="mt-2 text-xs text-slate-400">
                  Deposit ID (also auto-filled below):<br />
                  {createdDepositId}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CONVERT + PAYOUT SECTION */}
        <div className="border border-slate-700 rounded-lg p-5 bg-slate-900">
          <h2 className="text-xl font-semibold mb-4">2. Convert & Payout</h2>

          <label className="block text-sm mb-1">Deposit ID</label>
          <input
            value={depositId}
            onChange={(e) => setDepositId(e.target.value)}
            placeholder="DepositId from Supabase or Step 1"
            className="w-full mb-3 px-3 py-2 rounded bg-slate-800 border border-slate-700"
          />

          <button
            onClick={handleConvert}
            className="w-full mb-4 py-2.5 rounded bg-sky-500 font-semibold hover:bg-sky-600"
          >
            Convert to USD
          </button>

          {conversion && (
            <div className="mt-2 border border-slate-700 rounded p-3 text-sm">
              <div><strong>Conversion ID:</strong> {conversion.id}</div>
              <div><strong>Gross:</strong> ${Number(conversion.amount_fiat_gross).toFixed(2)}</div>
              <div>
                <strong>Fee:</strong> ${Number(conversion.fee_amount).toFixed(2)} ({conversion.fee_percent}%)
              </div>
              <div><strong>Net:</strong> ${Number(conversion.amount_fiat_net).toFixed(2)}</div>

              <button
                onClick={handlePayout}
                className="mt-3 w-full py-2.5 rounded bg-indigo-500 font-semibold hover:bg-indigo-600"
              >
                Payout to Bank
              </button>
            </div>
          )}

          {payout && (
            <div className="mt-3 border border-emerald-600 rounded p-3 text-sm">
              <div><strong>Payout ID:</strong> {payout.id}</div>
              <div><strong>Status:</strong> {payout.status}</div>
              <div><strong>Amount Sent:</strong> ${Number(payout.amount_fiat).toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

