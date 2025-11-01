/**
 * x402 Compliant Multi-Network Server with LLM Portfolio Analysis
 *
 * This server uses the official x402-express middleware to handle
 * micropayments in USDC on Solana devnet and provides AI-powered
 * wallet portfolio analysis using Zerion API and Groq AI.
 *
 * Features:
 * - Multi-network payment support (EVM + SVM)
 * - Real-time portfolio data from Zerion API
 * - LLM-powered analysis using Groq AI (Moonshot Kimi K2)
 * - Basic and comprehensive wallet analysis endpoints
 */

import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";
import { payai } from 'facilitators';
import { paymentMiddleware, type SolanaAddress } from "x402-express";
import { type Network } from "x402/types";
dotenv.config();

const app = express();
const PORT = 3000;
const NETWORK: Network = "solana-devnet";

// Middleware to parse JSON bodies
app.use(express.json());

// Your Solana address to receive USDC payments
const RECIPIENT: SolanaAddress =
  (process.env.RECIPIENT_ADDRESS as SolanaAddress) ||
  ("seFkxFkXEY9JGEpCyPfCWTuPZG9WK6ucf95zvKCfsRX" as SolanaAddress);

// API keys for Zerion and Groq
const ZERION_API_KEY = process.env.ZERION_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!ZERION_API_KEY || !GROQ_API_KEY) {
  console.error("❌ Error: Missing required API keys");
  console.log("   - ZERION_API_KEY: " + (ZERION_API_KEY ? "✓" : "✗"));
  console.log("   - GROQ_API_KEY: " + (GROQ_API_KEY ? "✓" : "✗"));
  console.log("\n💡 Please set these in your .env file");
  process.exit(1);
}

console.log("🚀 Starting x402 Server with AI Portfolio Analysis");
console.log(`💰 Recipient: ${RECIPIENT}`);
console.log(`🌐 Network: solana-devnet`);

// =============================================================================
// Wallet Analyzer Utility Functions
// =============================================================================

/**
 * Clean JSON text by removing markdown fences and invalid control characters
 */
function cleanJSONText(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/m, '');
  cleaned = cleaned.replace(/^```\s*/m, '');
  cleaned = cleaned.replace(/```\s*$/m, '');
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.trim();
}

/**
 * Fetch wallet portfolio from Zerion API
 */
async function fetchPortfolio(address: string): Promise<any> {
  const headers = {
    Authorization: `Basic ${Buffer.from(`${ZERION_API_KEY}:`).toString("base64")}`,
  };

  try {
    const portfolioResponse = await axios.get(
      `https://api.zerion.io/v1/wallets/${address}/portfolio`,
      { headers }
    );

    const positionsResponse = await axios.get(
      `https://api.zerion.io/v1/wallets/${address}/positions`,
      { headers }
    );

    return {
      portfolio: portfolioResponse.data,
      positions: positionsResponse.data.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Zerion API error: ${error.response?.status} - ${error.response?.data?.errors?.[0]?.title || error.message}`
      );
    }
    throw error;
  }
}

/**
 * Generate basic wallet analysis using Groq AI
 */
async function analyzeBasicWallet(address: string): Promise<any> {
  const { portfolio, positions } = await fetchPortfolio(address);

  // Try different possible paths for the data (Zerion API structure can vary)
  const data = portfolio.data || portfolio;
  const attributes = data.attributes || data;

  // Try to find total value in different possible locations
  const totalValue =
    attributes.stats?.total_value ||
    attributes.total_value ||
    attributes.positions_value ||
    0;

  const sortedPositions = positions
    .sort((a: any, b: any) => b.attributes.value - a.attributes.value)
    .slice(0, 5);

  const topHoldings = sortedPositions.map((pos: any) => ({
    name: pos.attributes.fungible_info?.name || pos.attributes.name || "Unknown",
    symbol: pos.attributes.fungible_info?.symbol || "N/A",
    value: pos.attributes.value,
    percentage: totalValue > 0 ? (pos.attributes.value / totalValue) * 100 : 0,
  }));

  const portfolioData = {
    totalValue,
    positionCount: positions.length,
    topHoldings,
    typeDistribution: attributes.positions_distribution_by_type || {},
  };

  const prompt = `You are a friendly crypto portfolio advisor. Analyze this wallet and provide consumer-friendly insights in simple, non-technical language.

Portfolio Data:
${JSON.stringify(portfolioData, null, 2)}

Provide a consumer-friendly analysis with:

1. **Portfolio Health Score** (0-100): Overall wellness of the portfolio
   - 80-100: Excellent - Well diversified and balanced
   - 60-79: Good - Solid but room for improvement
   - 40-59: Fair - Needs attention
   - 0-39: Poor - Requires immediate action

2. **Simple Summary**: 2-3 sentences in plain English explaining what's in this wallet and whether it's healthy

3. **What's Going Well**: 2-3 bullet points highlighting portfolio strengths

4. **What Needs Attention**: 2-3 bullet points about areas to improve

5. **Quick Wins**: 3-4 actionable recommendations anyone can understand (e.g., "Consider adding stablecoins for stability" or "Your portfolio is too concentrated in one asset")

6. **Risk Level**: Simple rating (Low/Medium/High) with brief explanation

Format your response as JSON:
{
  "healthScore": <number 0-100>,
  "summary": "2-3 sentences in simple language",
  "strengths": ["strength1", "strength2", "strength3"],
  "concerns": ["concern1", "concern2", "concern3"],
  "quickWins": ["action1", "action2", "action3", "action4"],
  "riskLevel": "Low|Medium|High",
  "riskExplanation": "Brief explanation of risk level"
}

IMPORTANT:
- Use simple, friendly language - no jargon
- Be conversational and helpful
- Focus on actionable insights
- Return ONLY the raw JSON object. Do NOT wrap it in markdown code fences. Do NOT include any additional text before or after the JSON.`;

  const { text } = await generateText({
    model: groq("moonshotai/kimi-k2-instruct"),
    prompt: prompt,
  });

  const cleanedText = cleanJSONText(text);
  const analysisResult = JSON.parse(cleanedText);

  return {
    healthScore: analysisResult.healthScore,
    summary: analysisResult.summary,
    strengths: analysisResult.strengths,
    concerns: analysisResult.concerns,
    quickWins: analysisResult.quickWins,
    riskLevel: analysisResult.riskLevel,
    riskExplanation: analysisResult.riskExplanation,
    topHoldings,
    totalValue,
    timestamp: Date.now(),
  };
}

// =============================================================================
// x402 Payment Middleware Configuration
// =============================================================================

// Apply x402 payment middleware
// This automatically handles:
// - 402 responses with payment requirements
// - Payment verification (pre-flight checks)
// - Transaction submission via facilitator
// - Settlement confirmation
app.use(
  paymentMiddleware(RECIPIENT, {
    // Protected endpoint: requires $0.0001 USDC payment
    "GET /premium": {
      price: "$0.0001", // Price in USD (converted to USDC)
      network: NETWORK, // Solana devnet
    },

    // Basic wallet analysis endpoint
    "POST /analyze-basic": {
      price: "$0.005",
      network: NETWORK,
    },

    // Comprehensive wallet analysis endpoint
    "POST /analyze-comprehensive": {
      price: "$0.01",
      network: NETWORK,
    },
  },
    payai
  )
);

// Protected endpoints - only accessible after payment
app.get("/premium", (req, res) => {
  res.json({
    message: "🎉 Premium content accessed!",
    data: {
      secret: "This is premium content",
      timestamp: new Date().toISOString(),
    },
  });
});

// =============================================================================
// AI-Powered Wallet Analysis Endpoints
// =============================================================================

// Basic wallet analysis endpoint - 3 paragraph summary with risk score
app.post("/analyze-basic", async (req, res) => {
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

// Comprehensive wallet analysis endpoint - detailed multi-page analysis
app.post("/analyze-comprehensive", async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        error: "Missing required field: address",
        message: "Please provide a wallet address to analyze",
      });
    }

    console.log(`📊 Comprehensive analysis: ${address}`);

    // Fetch full portfolio data
    const { portfolio, positions } = await fetchPortfolio(address);

    // Try different possible paths for the data (Zerion API structure can vary)
    const data = portfolio.data || portfolio;
    const attributes = data.attributes || data;

    // Try to find total value in different possible locations
    const totalValue =
      attributes.stats?.total_value ||
      attributes.total_value ||
      attributes.positions_value ||
      0;

    const sortedPositions = positions
      .sort((a: any, b: any) => b.attributes.value - a.attributes.value)
      .slice(0, 10);

    const topHoldings = sortedPositions.map((pos: any) => ({
      name: pos.attributes.fungible_info?.name || pos.attributes.name || "Unknown",
      symbol: pos.attributes.fungible_info?.symbol || "N/A",
      value: pos.attributes.value,
      percentage: totalValue > 0 ? (pos.attributes.value / totalValue) * 100 : 0,
    }));

    // Calculate chain distribution
    const chainDistribution: Record<string, number> = {};
    positions.forEach((pos: any) => {
      const chain = pos.relationships?.chain?.data?.id || "unknown";
      chainDistribution[chain] = (chainDistribution[chain] || 0) + pos.attributes.value;
    });

    const comprehensiveData = {
      totalValue,
      positionCount: positions.length,
      topHoldings,
      chainDistribution,
      typeDistribution: attributes.positions_distribution_by_type || {},
    };

    const prompt = `Conduct a comprehensive analysis of this crypto wallet portfolio. Provide deep insights across multiple dimensions:

Portfolio Data:
${JSON.stringify(comprehensiveData, null, 2)}

Provide a detailed analysis covering:

1. **Executive Summary** (3-4 paragraphs)
2. **Risk Analysis**:
   - Concentration risk (top holdings dominance)
   - Volatility risk (based on asset volatility)
   - Liquidity risk (ability to exit positions)
   - Overall risk score (0-100)
3. **Diversification Analysis**:
   - Score (0-100, where 100 is perfectly diversified)
   - Assessment across chains, asset types, and sectors
4. **Recommendations** (5-7 actionable recommendations)
5. **Chain Distribution Analysis** (multi-network portfolio insights)

Format your response as JSON:
{
  "summary": "Executive summary paragraphs",
  "riskScore": <number 0-100>,
  "detailedRiskAnalysis": {
    "concentrationRisk": "analysis",
    "volatilityRisk": "analysis",
    "liquidityRisk": "analysis"
  },
  "diversificationScore": <number 0-100>,
  "recommendations": ["rec1", "rec2", ...],
  "chainAnalysis": "Multi-network distribution and implications"
}

IMPORTANT: Return ONLY the raw JSON object. Do NOT wrap it in markdown code fences. Do NOT include any additional text before or after the JSON.`;

    const { text } = await generateText({
      model: groq("moonshotai/kimi-k2-instruct"),
      prompt: prompt,
    });

    const cleanedText = cleanJSONText(text);
    const analysisResult = JSON.parse(cleanedText);

    const comprehensiveAnalysis = {
      summary: analysisResult.summary,
      riskScore: analysisResult.riskScore,
      topHoldings,
      totalValue,
      timestamp: Date.now(),
      detailedRiskAnalysis: analysisResult.detailedRiskAnalysis,
      diversificationScore: analysisResult.diversificationScore,
      recommendations: analysisResult.recommendations,
      chainDistribution,
      chainAnalysis: analysisResult.chainAnalysis,
    };

    console.log(`✅ Complete - Risk: ${analysisResult.riskScore}/100`);

    res.json({
      message: "🎉 Comprehensive wallet analysis complete!",
      analysis: comprehensiveAnalysis,
      info: {
        model: "Groq AI (Moonshot Kimi K2)",
        dataSource: "Zerion API (Multi-Network)",
        analysisType: "comprehensive",
        networksAnalyzed: Object.keys(chainDistribution).length,
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

// =============================================================================
// Public Endpoints
// =============================================================================

// Public endpoint (no payment required)
app.get("/", (req, res) => {
  res.json({
    message: "x402 Server with AI Portfolio Analysis",
    endpoints: {
      "/": "Public - no payment required",
      "/premium": "Protected - $0.0001 USDC",
      "POST /analyze-basic": "Protected - $0.005 USDC - Basic analysis",
      "POST /analyze-comprehensive": "Protected - $0.01 USDC - Comprehensive analysis",
    },
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ Server running at http://localhost:${PORT}\n`);
  console.log(`📍 Endpoints:`);
  console.log(`   GET  /                        - Public`);
  console.log(`   GET  /premium                 - $0.0001 USDC`);
  console.log(`   POST /analyze-basic           - $0.005 USDC`);
  console.log(`   POST /analyze-comprehensive   - $0.01 USDC\n`);
});
