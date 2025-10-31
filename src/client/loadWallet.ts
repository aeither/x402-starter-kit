import { readFileSync, existsSync } from "fs";
import bs58 from "bs58";
import { createSigner, type MultiNetworkSigner, type Hex } from "x402-axios";
import {
  SOLANA_WALLET_PATH,
  EVM_PRIVATE_KEY,
  SOLANA_NETWORK,
  EVM_NETWORK,
} from "./config";

interface SolanaWallet {
  privateKeyBase58: string;
  publicKey: string;
}

// Load Solana wallet from client.json
function loadSolanaWallet(walletPath: string = SOLANA_WALLET_PATH): SolanaWallet {
  if (!existsSync(walletPath)) {
    throw new Error(`Solana wallet not found at: ${walletPath}`);
  }

  const keypairData = JSON.parse(readFileSync(walletPath, "utf-8"));
  const secretKey = Uint8Array.from(keypairData);
  const privateKeyBase58 = bs58.encode(secretKey);
  const publicKeyBytes = secretKey.slice(32, 64);
  const publicKey = bs58.encode(publicKeyBytes);

  return { privateKeyBase58, publicKey };
}

// Load multi-network signers (Solana + EVM)
export async function loadMultiNetworkSigners() {
  let solanaWallet: SolanaWallet | undefined;
  let hasEVM = false;

  // Try loading Solana wallet
  try {
    solanaWallet = loadSolanaWallet();
  } catch (error) {
    console.log("⚠️  Solana wallet not found");
  }

  // Check EVM wallet
  if (EVM_PRIVATE_KEY) {
    hasEVM = true;
  }

  // Must have at least one wallet
  if (!solanaWallet && !hasEVM) {
    console.error("❌ No wallets found");
    console.log("\n💡 Setup:");
    console.log("   Solana: solana-keygen new --outfile ./src/client.json");
    console.log("   EVM: Add EVM_PRIVATE_KEY=0x... to .env");
    throw new Error("No wallets available");
  }

  // Create signers
  let signer: any;
  const walletInfo: any = {};

  if (solanaWallet && hasEVM) {
    // Multi-network mode
    const svmSigner = await createSigner(SOLANA_NETWORK as any, solanaWallet.privateKeyBase58);
    const evmSigner = await createSigner(EVM_NETWORK as any, EVM_PRIVATE_KEY as Hex);
    signer = { evm: evmSigner, svm: svmSigner } as MultiNetworkSigner;
    walletInfo.solana = { address: solanaWallet.publicKey, network: SOLANA_NETWORK };
    walletInfo.evm = { network: EVM_NETWORK };
  } else if (solanaWallet) {
    // Solana only
    signer = await createSigner(SOLANA_NETWORK as any, solanaWallet.privateKeyBase58);
    walletInfo.solana = { address: solanaWallet.publicKey, network: SOLANA_NETWORK };
  } else {
    // EVM only
    signer = await createSigner(EVM_NETWORK as any, EVM_PRIVATE_KEY as Hex);
    walletInfo.evm = { network: EVM_NETWORK };
  }

  return { signer, walletInfo };
}
