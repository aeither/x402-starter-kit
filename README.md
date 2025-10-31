# 🚀 x402 Starter Kit

> **Minimal starter for building micropayment-enabled APIs using the x402 protocol on Solana.**

Build APIs that accept crypto micropayments ($0.005-$0.01 per request) instead of subscriptions. Perfect for AI services, data APIs, or any pay-per-use application.

**What's Included:**
- Express server with x402 payment middleware
- Example client with automatic payment handling
- Solana devnet USDC integration (gasless for users)
- TypeScript, production-ready

---

## 🏗️ How It Works

```
1. Client makes request
2. Server returns "402 Payment Required" with payment details
3. x402-axios interceptor auto-pays with USDC
4. x402-express middleware verifies payment
5. Server processes request and returns response
```

**Stack:**
- `x402-express` - Payment middleware for Express
- `x402-axios` - Client with automatic payment handling
- Solana devnet USDC (facilitator pays gas)
- TypeScript + Bun

---

## 🚀 Quick Start

### 1. Install

```bash
bun install
```

### 2. Setup Wallet

```bash
# Generate a client wallet for testing
solana-keygen new --outfile client.json

# Get devnet USDC from https://faucet.circle.com/
# Use: solana address -k client.json
```

### 3. Configure

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Add your recipient address to `.env`:
```env
RECIPIENT_ADDRESS=your_solana_address_here
```

### 4. Run

```bash
# Terminal 1
bun run server

# Terminal 2
bun run client
```

---

## 💡 Why x402?

- Pay-per-use instead of subscriptions
- Crypto payments from anyone, globally
- Facilitator covers gas fees (gasless for users)
- Standard HTTP 402 protocol
- Zero payment code needed (libraries handle it)

---

## 📊 Usage

**Server** - Add payment middleware:
```typescript
app.post('/api/endpoint',
  x402Middleware({ price: 0.01 }),
  async (req, res) => {
    // Your logic
    res.json({ result })
  }
)
```

**Client** - Payments happen automatically:
```typescript
const client = createX402Axios({
  keypair: wallet,
  network: 'solana-devnet'
})

await client.post('/api/endpoint', { data })
```

---

## 🎯 Use Cases

- AI/LLM APIs (GPT, Claude, Groq)
- Data APIs (market data, blockchain queries)
- Image/video processing
- Any pay-per-use service

---

## 📝 Resources

- [x402 Protocol](https://x402.org)
- [Coinbase x402 SDK](https://github.com/coinbase/x402)
- [Solana CLI Tools](https://docs.solana.com/cli/install-solana-cli-tools)
- [USDC Devnet Faucet](https://faucet.circle.com)
