import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { cleanJSONText } from "../utils/json.utils";
import { fetchPortfolio, extractTotalValue, extractTopHoldings } from "./zerion.service";

export interface BasicAnalysis {
  healthScore: number;
  summary: string;
  strengths: string[];
  concerns: string[];
  quickWins: string[];
  riskLevel: string;
  riskExplanation: string;
  topHoldings: any[];
  totalValue: number;
  timestamp: number;
}

export async function analyzeBasicWallet(address: string): Promise<BasicAnalysis> {
  const { portfolio, positions } = await fetchPortfolio(address);

  const totalValue = extractTotalValue(portfolio);
  const topHoldings = extractTopHoldings(positions, totalValue, 5);

  const data = portfolio.data || portfolio;
  const attributes = data.attributes || data;

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
