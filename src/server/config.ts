import dotenv from "dotenv";
import type { SolanaAddress } from "x402-express";
import type { Network } from "x402/types";
import { paymentMiddleware } from "x402-express";
import { payai } from 'facilitators';
dotenv.config();

// Server configuration
export const PORT = 3000;
export const NETWORK: Network = "base-sepolia" as Network;

// Payment recipient address
export const RECIPIENT: SolanaAddress = process.env.RECIPIENT_ADDRESS as SolanaAddress;

// API keys
export const ZERION_API_KEY = process.env.ZERION_API_KEY;
export const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * Payment middleware configuration
 */
export const paymentMiddlewareConfig = paymentMiddleware(RECIPIENT, {
  "GET /premium": {
    price: "$0.0001",
    network: NETWORK,
  },
  "POST /analyze-basic": {
    price: "$0.005",
    network: NETWORK,
  },
},
  payai
);
