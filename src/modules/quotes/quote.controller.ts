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