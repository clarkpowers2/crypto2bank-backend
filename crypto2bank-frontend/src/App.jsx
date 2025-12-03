import { useState } from "react";

function App() {
  const [asset, setAsset] = useState("ETH");
  const [amountCrypto, setAmountCrypto] = useState("0.05");

  const [depositId, setDepositId] = useState("");
  const [createdDepositId, setCreatedDepositId] = useState("");
  const [hostedUrl, setHostedUrl] = useState("");

  const [conversion, setConversion] = useState(null);
  const [payout, setPayout] = useState(null);

  const [adminSummary, setAdminSummary] = useState(null);
  const [adminActivity, setAdminActivity] = useState(null);

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  // 1) Create a deposit (demo backend)
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

      alert("Deposit created. Use the link (demo) and then convert.");
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

  // 3) Payout to bank (demo)
  const handlePayout = async () => {
    try {
      if (!conversion) {
        alert("Run a conversion first.");
        return;
      }

      const bankAccountId = prompt(
        "Enter bankAccountId from Supabase bank_accounts:"
      );
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

  // 4) Load admin summary (totals)
  const handleLoadSummary = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/admin/summary`);
      const data = await res.json();
      if (data.ok) setAdminSummary(data.summary);
      else alert(data.error || "Failed to load summary");
    } catch (err) {
      console.error(err);
      alert("Error loading summary");
    }
  };

  // 5) Load recent activity
  const handleLoadActivity = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/admin/activity`);
      const data = await res.json();
      if (data.ok) setAdminActivity(data);
      else alert(data.error || "Failed to load activity");
    } catch (err) {
      console.error(err);
      alert("Error loading activity");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-2">Crypto2Bank</h1>
      <p className="text-slate-300 mb-8">
        Convert crypto to USD and send it to any bank (demo stack).
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
            onChange={(e) => setAmountCrypto(e.value)}
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
              <div className="mb-1 font-medium">Hosted payment link (demo):</div>
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
                  Deposit ID (auto-filled below):<br />
                  {createdDepositId}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CONVERT + PAYOUT SECTION */}
        <div className="border border-slate-700 rounded-lg p-5 bg-slate-900">
          <h2 className="text-xl font-semibold mb-4">2. Convert &amp; Payout</h2>

          <label className="block text-sm mb-1">Deposit ID</label>
          <input
            value={depositId}
            onChange={(e) => setDepositId(e.target.value)}
            placeholder="DepositId from Step 1 or Supabase"
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
              <div>
                <strong>Conversion ID:</strong> {conversion.id}
              </div>
              <div>
                <strong>Gross:</strong>{" "}
                ${Number(conversion.amount_fiat_gross).toFixed(2)}
              </div>
              <div>
                <strong>Fee:</strong>{" "}
                ${Number(conversion.fee_amount).toFixed(2)} (3% + $1.50)
              </div>
              <div>
                <strong>Net:</strong>{" "}
                ${Number(conversion.amount_fiat_net).toFixed(2)}
              </div>

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
              <div>
                <strong>Payout ID:</strong> {payout.id}
              </div>
              <div>
                <strong>Status:</strong> {payout.status}
              </div>
              <div>
                <strong>Amount Sent:</strong>{" "}
                ${Number(payout.amount_fiat).toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADMIN SECTION */}
      <div className="w-full max-w-3xl mt-10 border border-slate-700 rounded-lg p-5 bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Admin Overview</h2>
          <div className="flex gap-2">
            <button
              onClick={handleLoadSummary}
              className="px-3 py-1.5 text-sm rounded bg-slate-800 hover:bg-slate-700"
            >
              Load Summary
            </button>
            <button
              onClick={handleLoadActivity}
              className="px-3 py-1.5 text-sm rounded bg-slate-800 hover:bg-slate-700"
            >
              Load Activity
            </button>
          </div>
        </div>

        {adminSummary && (
          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <div className="text-slate-400 text-xs">Total Volume</div>
              <div className="text-lg font-semibold">
                $
                {Number(adminSummary.total_gross ?? 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">
                Total Fees (3% + $1.50)
              </div>
              <div className="text-lg font-semibold">
                $
                {Number(adminSummary.total_fees ?? 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Total Net to Users</div>
              <div className="text-lg font-semibold">
                $
                {Number(adminSummary.total_net ?? 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {adminActivity && (
          <div className="grid md:grid-cols-3 gap-4 text-xs mt-4">
            <div>
              <div className="font-semibold mb-1">Recent Deposits</div>
              {(adminActivity.deposits || []).map((d) => (
                <div
                  key={d.id}
                  className="mb-1 border-b border-slate-800 pb-1"
                >
                  <div>
                    {d.asset} {Number(d.amount_crypto).toFixed(4)}
                  </div>
                  <div className="text-slate-400">{d.status}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="font-semibold mb-1">Recent Conversions</div>
              {(adminActivity.conversions || []).map((c) => (
                <div
                  key={c.id}
                  className="mb-1 border-b border-slate-800 pb-1"
                >
                  <div>
                    ${Number(c.amount_fiat_net).toFixed(2)} net
                  </div>
                  <div className="text-slate-400">{c.fiat_currency}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="font-semibold mb-1">Recent Payouts</div>
              {(adminActivity.payouts || []).map((p) => (
                <div
                  key={p.id}
                  className="mb-1 border-b border-slate-800 pb-1"
                >
                  <div>
                    ${Number(p.amount_fiat).toFixed(2)}
                  </div>
                  <div className="text-slate-400">{p.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!adminSummary && !adminActivity && (
          <div className="text-slate-500 text-sm">
            Click &quot;Load Summary&quot; or &quot;Load Activity&quot; to see
            system stats.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
