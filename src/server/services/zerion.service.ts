/**
 * Zerion API Service
 *
 * Handles all interactions with the Zerion API for fetching
 * wallet portfolio and position data.
 */

import axios from "axios";
import { ZERION_API_KEY } from "../config";

/**
 * Portfolio data returned from Zerion API
 */
export interface PortfolioData {
  portfolio: any;
  positions: any[];
}

/**
 * Fetch wallet portfolio from Zerion API
 *
 * Retrieves both portfolio summary and individual positions
 * for a given wallet address.
 *
 * @param address - The wallet address to analyze
 * @returns Portfolio and positions data
 * @throws Error if Zerion API request fails
 */
export async function fetchPortfolio(address: string): Promise<PortfolioData> {
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
 * Extract total portfolio value from Zerion API response
 *
 * Handles different possible API response structures.
 *
 * @param portfolio - Portfolio data from Zerion API
 * @returns Total portfolio value in USD
 */
export function extractTotalValue(portfolio: any): number {
  const data = portfolio.data || portfolio;
  const attributes = data.attributes || data;

  return (
    attributes.stats?.total_value ||
    attributes.total_value ||
    attributes.positions_value ||
    0
  );
}

/**
 * Extract and format top holdings from positions
 *
 * @param positions - Array of position data
 * @param totalValue - Total portfolio value
 * @param limit - Maximum number of holdings to return
 * @returns Array of top holdings with name, symbol, value, and percentage
 */
export function extractTopHoldings(
  positions: any[],
  totalValue: number,
  limit: number = 5
) {
  const sortedPositions = positions
    .sort((a: any, b: any) => b.attributes.value - a.attributes.value)
    .slice(0, limit);

  return sortedPositions.map((pos: any) => ({
    name: pos.attributes.fungible_info?.name || pos.attributes.name || "Unknown",
    symbol: pos.attributes.fungible_info?.symbol || "N/A",
    value: pos.attributes.value,
    percentage: totalValue > 0 ? (pos.attributes.value / totalValue) * 100 : 0,
  }));
}

/**
 * Calculate chain distribution from positions
 *
 * @param positions - Array of position data
 * @returns Record mapping chain IDs to their total values
 */
export function calculateChainDistribution(positions: any[]): Record<string, number> {
  const chainDistribution: Record<string, number> = {};

  positions.forEach((pos: any) => {
    const chain = pos.relationships?.chain?.data?.id || "unknown";
    chainDistribution[chain] = (chainDistribution[chain] || 0) + pos.attributes.value;
  });

  return chainDistribution;
}
