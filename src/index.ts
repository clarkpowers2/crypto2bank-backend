import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.controller";
import { bankRouter } from "./modules/banks/bank.controller";
import { quoteRouter } from "./modules/quotes/quote.controller";

const app = express();
app.use(cors());
app.use(express.json());

// 1. Log every request (So we can see it in Render logs)
app.use((req, res, next) => {
  console.log(`📢 Incoming Request: ${req.method} ${req.path}`);
  next();
});

// 2. The Routes
app.use("/auth", authRouter);
app.use("/bank-accounts", bankRouter);
app.use("/quote", quoteRouter);

// 3. The Health Check (Service Entrance)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", env: "production", timestamp: new Date() });
});

// 4. The Homepage (Front Door)
app.get("/", (req, res) => {
  res.status(200).send("✅ Crypto2Bank API is Alive! Go to /health to check status.");
});

app.listen(env.PORT, () => {
  console.log(`🚀 API Server listening on port ${env.PORT}`);
});
