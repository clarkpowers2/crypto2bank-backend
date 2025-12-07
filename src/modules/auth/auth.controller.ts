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