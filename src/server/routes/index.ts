import { Router, Request, Response } from "express";
import walletRoutes from "./wallet.routes";
import premiumRoutes from "./premium.routes";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "x402 Server with AI Portfolio Analysis",
    endpoints: {
      "/": "Public - no payment required",
      "/premium": "Protected - $0.0001 USDC",
      "POST /analyze-basic": "Protected - $0.005 USDC",
    },
  });
});

router.use(walletRoutes);
router.use(premiumRoutes);

export default router;
