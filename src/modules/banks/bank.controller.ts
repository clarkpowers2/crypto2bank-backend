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