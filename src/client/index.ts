import axios from "axios";
import { withPaymentInterceptor } from "x402-axios";
import { SERVER_URL } from "./config";
import { loadMultiNetworkSigners } from "./loadWallet";

async function main() {
  console.log("🚀 x402 Client\n");
  console.log(`🌐 Server: ${SERVER_URL}\n`);

  // Load wallets and create signers
  const { signer, walletInfo } = await loadMultiNetworkSigners();

  // Display wallet info
  if (walletInfo.solana) {
    console.log(`💳 Solana (${walletInfo.solana.network})`);
    console.log(`   ${walletInfo.solana.address}\n`);
  }
  if (walletInfo.evm) {
    console.log(`💳 EVM (${walletInfo.evm.network})`);
    console.log(`   Private key configured ✓\n`);
  }

  console.log("=".repeat(70) + "\n");

  // Create axios client with x402 payment interceptor
  const client = withPaymentInterceptor(axios.create({ baseURL: SERVER_URL }), signer);

  try {
    // Test wallet address
    const TEST_WALLET = "MJKqp326RZCHnAAbew9MDdui3iCKWco7fsK9sVuZTX2";

    // 1. Public endpoint
    console.log("1️⃣  Public endpoint (/)");
    const publicRes = await client.get("/");
    console.log(`✅ ${publicRes.data.message}\n`);

    // 2. Premium endpoint ($0.0001 USDC)
    console.log("2️⃣  Premium endpoint (/premium)");
    const premiumRes = await client.get("/premium");
    console.log(`✅ ${premiumRes.data.message}\n`);

    // 3. Wallet analysis ($0.005 USDC)
    // console.log("3️⃣  Wallet analysis (/analyze-basic)");
    // console.log(`   Analyzing: ${TEST_WALLET}`);

    // const analysisRes = await client.post("/analyze-basic", { address: TEST_WALLET });
    // const analysis = analysisRes.data.analysis;

    // console.log(`\n✅ Analysis Complete`);
    // console.log(`   Health Score: ${analysis.healthScore}/100`);
    // console.log(`   Risk Level: ${analysis.riskLevel}`);
    // console.log(`   Total Value: $${analysis.totalValue.toLocaleString()}`);
    // console.log(`   Summary: ${analysis.summary}\n`);

    console.log("=".repeat(70));
    console.log("🎉 All requests completed successfully!");
    console.log("=".repeat(70) + "\n");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`\n❌ Request failed: ${error.response?.status}`);
      console.error(`   ${JSON.stringify(error.response?.data, null, 2)}`);

      if (error.response?.status === 402) {
        console.log("\n💡 Common issues:");
        console.log("   - Insufficient USDC balance");
        console.log("   - Get devnet USDC: https://faucet.circle.com/");
        console.log("   - Get devnet SOL: solana airdrop 1 <address> --url devnet");
      }
    } else {
      console.error("\n❌ Error:", error);
    }
    process.exit(1);
  }
}

main().catch(console.error);
