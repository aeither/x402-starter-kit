import { config } from "dotenv";
import { type Network } from "x402/types";
config();

export const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";
export const SOLANA_WALLET_PATH = process.env.SOLANA_WALLET_PATH || "./src/client.json";
export const EVM_PRIVATE_KEY = process.env.EVM_PRIVATE_KEY;

// Networks: solana-devnet, solana-mainnet, base-sepolia, ethereum-sepolia, etc.
export const SOLANA_NETWORK = process.env.SOLANA_NETWORK || "solana-devnet" as Network;
export const EVM_NETWORK = process.env.EVM_NETWORK || "base-sepolia" as Network;
