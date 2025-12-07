const fs = require('fs');
const path = require('path');

const writeFile = (filePath, content) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content.trim());
  console.log(`✅ Created: ${filePath}`);
};

// 1. AUTH MIDDLEWARE
writeFile('src/middleware/auth.ts', `
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
`);

// 2. AUTH CONTROLLER
writeFile('src/modules/auth/auth.controller.ts', `
import { Router } from "express";
import { createUser, loginUser } from "./auth.service";
const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const user = await createUser(req.body.email, req.body.password);
    res.status(201).json(user);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const result = await loginUser(req.body.email, req.body.password);
    if (!result) return res.status(401).json({ error: "Invalid credentials" });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
export const authRouter = router;
`);

// 3. BANK CONTROLLER
writeFile('src/modules/banks/bank.controller.ts', `
import { Router } from "express";
import { authMiddleware, AuthRequest } from "../../middleware/auth";
import { addBankAccount } from "./bank.service";
const router = Router();

router.use(authMiddleware);

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { routingNumber, accountNumber } = req.body;
    const bank = await addBankAccount(req.user!.id, routingNumber, accountNumber);
    res.status(201).json(bank);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
export const bankRouter = router;
`);

// 4. QUOTE CONTROLLER
writeFile('src/modules/quotes/quote.controller.ts', `
import { Router } from "express";
import { authMiddleware, AuthRequest } from "../../middleware/auth";
import { getQuote } from "./quote.service";
const router = Router();

router.use(authMiddleware);

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { assetCode, cryptoAmount, payoutType } = req.body;
    const quote = await getQuote(req.user!.id, assetCode, cryptoAmount, payoutType);
    res.json(quote);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
export const quoteRouter = router;
`);

// 5. MAIN SERVER (Index.ts)
writeFile('src/index.ts', `
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
  console.log(\`🚀 Crypto2Bank API running on port \${env.PORT}\`);
});
`);

console.log("🚀 API LAYER GENERATED.");
