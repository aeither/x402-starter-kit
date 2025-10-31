import { Router, Request, Response } from "express";
import { analyzeBasicWallet } from "../services/ai.service";

const router = Router();

router.post("/analyze-basic", async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        error: "Missing required field: address",
        message: "Please provide a wallet address to analyze",
      });
    }

    console.log(`📊 Basic analysis: ${address}`);
    const analysis = await analyzeBasicWallet(address);
    console.log(`✅ Complete - Score: ${analysis.healthScore}/100`);

    res.json({
      message: "🎉 Basic wallet analysis complete!",
      analysis,
      info: {
        model: "Groq AI (Moonshot Kimi K2)",
        dataSource: "Zerion API",
        analysisType: "basic",
      },
    });
  } catch (error: any) {
    console.error(`❌ Analysis failed: ${error.message}`);
    res.status(500).json({
      error: "Analysis failed",
      message: error.message,
    });
  }
});

export default router;
