import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.controller";
import { bankRouter } from "./modules/banks/bank.controller";
import { quoteRouter } from "./modules/quotes/quote.controller";

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRouter);
app.use("/bank-accounts", bankRouter);
app.use("/quote", quoteRouter);

app.get("/health", (req, res) => res.json({ status: "ok", env: "production" }));

app.listen(env.PORT, () => {
  console.log(`🚀 Crypto2Bank API running on port ${env.PORT}`);
});