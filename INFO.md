# Setup in src/client.json

solana-keygen new --outfile src/client.json

# Sending SOL to fund another wallet

solana transfer 7U3ZBgjuZVDHAf7ubTD8bykWMjx1iZFtVjmE8Vtt7fHi 0.1 --keypair src/client.json --url https://api.devnet.solana.com --allow-unfunded-recipient

NB: fund both sender and receiver with SOL and USDC so it has account to receive the USDC