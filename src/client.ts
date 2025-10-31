/**
 * x402 Compliant Multi-Network Client
 *
 * This client automatically handles x402 payment flow across multiple networks:
 * 1. Receives 402 response with payment requirements
 * 2. Creates transfer transaction (SPL for Solana, ERC20 for EVM)
 * 3. Signs transaction (but doesn't submit)
 * 4. Sends to server in X-Payment header
 * 5. Server's facilitator submits transaction
 * 6. Returns content + transaction signature
 *
 * Supports:
 * - EVM networks (Base Sepolia, etc.)
 * - SVM networks (Solana Devnet, etc.)
 *
 * Setup:
 * 1. npm install axios x402-axios @solana/web3.js
 * 2. Create client.json keypair: solana-keygen new --outfile pay-using-coinbase/client.json
 * 3. Set EVM_PRIVATE_KEY in .env file (optional, for EVM network support)
 * 4. npm install -D tsx dotenv
 * 5. Make sure you have devnet USDC in your wallet
 * 6. Run: tsx pay-using-coinbase/x402-demo-client.ts
 *
 * Get devnet USDC:
 * - Airdrop SOL: solana airdrop 1 <your-address> --url devnet
 * - Get USDC: https://faucet.circle.com/ (select Solana Devnet)
 */

import axios from "axios";
import {
  withPaymentInterceptor,
  createSigner,
  MultiNetworkSigner,
  type Hex
} from "x402-axios";
import { readFileSync } from "fs";
import bs58 from "bs58";
import { config } from "dotenv";

config();

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";

// Load your Solana wallet from client.json
function loadWallet(): { privateKeyBase58: string; publicKey: string } {
  try {
    const keypairData = JSON.parse(
      readFileSync("./src/client.json", "utf-8")
    );
    const secretKey = Uint8Array.from(keypairData);
    const privateKeyBase58 = bs58.encode(secretKey);

    // Derive public key from secret key (last 32 bytes are the public key in Solana keypairs)
    const publicKeyBytes = secretKey.slice(32, 64);
    const publicKey = bs58.encode(publicKeyBytes);

    return { privateKeyBase58, publicKey };
  } catch (error) {
    console.error("❌ Error: Could not load client.json");
    console.log("\n💡 To generate a keypair:");
    console.log(
      "   solana-keygen new --outfile pay-using-coinbase/client.json"
    );
    console.log("\n   Or use the Solana CLI:");
    console.log("   solana-keygen grind --starts-with c:1");
    process.exit(1);
  }
}

async function main() {
  const wallet = loadWallet();

  console.log("🚀 x402 Client Demo\n");
  console.log(`💳 Wallet: ${wallet.publicKey}`);
  console.log(`🌐 Server: ${SERVER_URL}\n`);

  // Create SVM signer (Solana Devnet)
  const svmSigner = await createSigner("solana-devnet", wallet.privateKeyBase58);

  // Create EVM signer (Base Sepolia) if private key is available
  let signer: any;
  const evmPrivateKey = process.env.EVM_PRIVATE_KEY as Hex | undefined;

  if (evmPrivateKey) {
    const evmSigner = await createSigner("base-sepolia", evmPrivateKey);
    signer = { evm: evmSigner, svm: svmSigner } as MultiNetworkSigner;
    console.log("✅ Multi-network mode (EVM + SVM)");
  } else {
    signer = svmSigner;
    console.log("✅ Solana mode (set EVM_PRIVATE_KEY for multi-network)");
  }

  console.log("=".repeat(70) + "\n");

  // Create axios client with x402 payment interceptor
  // This interceptor automatically handles 402 responses:
  // - Parses payment requirements
  // - Creates transfer transaction (SPL for Solana, ERC20 for EVM)
  // - Signs it with your wallet
  // - Retries the request with X-Payment header
  const client = withPaymentInterceptor(
    axios.create({ baseURL: SERVER_URL }),
    signer
  );

  try {
    // 1. Public endpoint (no payment)
    console.log("1️⃣  Accessing public endpoint (/)...");
    const publicResponse = await client.get("/");
    console.log("✅ Success (no payment required)");
    console.log(`   Response: ${publicResponse.data.message}\n`);

    // 2. Premium endpoint ($0.0001 USDC payment)
    console.log("2️⃣  Accessing premium endpoint (/premium)...");
    const premiumResponse = await client.get("/premium");
    console.log(`✅ ${premiumResponse.data.message}\n`);

    // 3. Basic wallet analysis ($0.005 USDC payment)
    console.log("3️⃣  Accessing basic wallet analysis (/analyze-basic)...");
    const TEST_WALLET_ADDRESS = "MJKqp326RZCHnAAbew9MDdui3iCKWco7fsK9sVuZTX2";

    const basicAnalysisResponse = await client.post("/analyze-basic", {
      address: TEST_WALLET_ADDRESS,
    });

    console.log("✅ Basic Analysis Complete:");
    console.log(`   Health Score: ${basicAnalysisResponse.data.analysis.healthScore}/100`);
    console.log(`   Risk Level: ${basicAnalysisResponse.data.analysis.riskLevel}`);
    console.log(`   Summary: ${basicAnalysisResponse.data.analysis.summary}\n`);
    console.log(`   Top Holdings: ${basicAnalysisResponse.data.analysis.topHoldings.length} assets`);
    console.log(`   Total Value: $${basicAnalysisResponse.data.analysis.totalValue.toLocaleString()}\n`);

    // 4. Comprehensive wallet analysis ($0.01 USDC payment)
    // console.log("4️⃣  Accessing comprehensive wallet analysis (/analyze-comprehensive)...");

    // const analysisResponse = await client.post("/analyze-comprehensive", {
    //   address: TEST_WALLET_ADDRESS,
    // });

    // console.log("✅ Comprehensive Analysis Complete:");
    // console.log(`   Total Value: $${analysisResponse.data.analysis.totalValue.toLocaleString()}`);
    // console.log(`   Risk Score: ${analysisResponse.data.analysis.riskScore}/100`);
    // console.log(`   Diversification Score: ${analysisResponse.data.analysis.diversificationScore}/100`);
    // console.log(`   Networks Analyzed: ${analysisResponse.data.info.networksAnalyzed}\n`);

    console.log("=".repeat(70));
    console.log("🎉 All requests completed successfully!");
    console.log("=".repeat(70));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("\n❌ Request failed:");
      console.error(`   Status: ${error.response?.status}`);
      console.error(
        `   Message: ${JSON.stringify(error.response?.data, null, 2)}`
      );
      console.error(`   Error message: ${error.message}`);

      if (error.code) {
        console.error(`   Error code: ${error.code}`);
      }

      if (error.response?.status === 402) {
        console.log("\n💡 Common issues:");
        console.log("   - Insufficient USDC balance in wallet");
        console.log("   - No SOL for gas fees (though facilitator should pay)");
        console.log("   - Get devnet USDC: https://faucet.circle.com/");
        console.log(
          "   - Get devnet SOL: solana airdrop 1 <address> --url devnet"
        );
      }
    } else {
      console.error("\n❌ Unexpected error:", error);
    }
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
