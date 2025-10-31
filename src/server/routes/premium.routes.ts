/**
 * Premium Content Routes
 *
 * Handles premium content endpoints protected by x402 payment middleware.
 */

import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /premium
 *
 * Premium content endpoint demonstrating basic x402 payment protection.
 *
 * Protected by x402 payment middleware ($0.0001 USDC)
 *
 * Response:
 * - message: Success message
 * - data: Premium content and timestamp
 */
router.get("/premium", (req: Request, res: Response) => {
  res.json({
    message: "🎉 Premium content accessed!",
    data: {
      secret: "This is premium content",
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
