# 🏛️ Nomad AI — Blockchain Layer

> The wallet & nervous system of Nomad AI. All money flows through here.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      NOMAD AI                            │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────┐ │
│  │  Agent Brain  │───▶│  Treasury    │───▶│  Akash     │ │
│  │  (Atharva)    │    │  Manager     │    │  Payment   │ │
│  └──────────────┘    └──────┬───────┘    └────────────┘ │
│         │                   │                            │
│         ▼                   ▼                            │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │  Payment     │    │  Bounty      │                   │
│  │  Listener    │    │  Client      │                   │
│  │  (WebSocket) │    │  (Anchor)    │                   │
│  └──────┬───────┘    └──────┬───────┘                   │
│         │                   │                            │
└─────────┼───────────────────┼────────────────────────────┘
          │                   │
          ▼                   ▼
   ┌──────────────────────────────────┐
   │        SOLANA BLOCKCHAIN          │
   │  ┌────────────┐  ┌────────────┐  │
   │  │  Treasury   │  │  Bounty    │  │
   │  │  PDA        │  │  PDAs      │  │
   │  └────────────┘  └────────────┘  │
   └──────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
# Solana + Anchor (in WSL)
curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash

# Python SDK
pip install -r blockchain/requirements.txt

# TypeScript tests
npm install
```

### 2. Build & Test the Smart Contract

```bash
# In WSL
anchor build
anchor test
```

### 3. Deploy to Devnet

```bash
solana config set --url devnet
solana airdrop 5
anchor deploy
```

After deploying, update `PROGRAM_ID` in `.env` with the new program ID.

### 4. Use the Python SDK

```python
from blockchain import get_wallet, TreasuryManager, PaymentListener

# Initialize wallet
wallet = get_wallet()
print(f"AI Address: {wallet.public_key_str}")
print(f"Balance: {wallet.get_balance_sol()} SOL")

# Treasury management
treasury = TreasuryManager(wallet)
report = treasury.get_financial_report()
print(f"Runway: {report.runway_days} days")
print(f"Status: {report.status}")

# Split incoming payment
treasury.split_income(1_000_000_000)  # 1 SOL
```

## Project Structure

```
├── programs/nomad_treasury/        ← Anchor smart contract (Rust) — "Nomad Treasury"
│   └── src/
│       ├── lib.rs                  ← Program entry point
│       ├── state.rs                ← Account structs
│       ├── errors.rs               ← Custom errors
│       └── instructions/           ← 5 instructions
├── blockchain/                     ← Python SDK (for agent brain)
│   ├── wallet.py                   ← Keypair management
│   ├── payment_listener.py         ← WebSocket listener
│   ├── treasury_manager.py         ← Financial logic
│   └── bounty_client.py            ← On-chain bounty client
├── sdk/                            ← TypeScript (for React dashboard)
│   └── src/
│       ├── client.ts               ← Dashboard client
│       └── types.ts                ← Type definitions
└── tests/                          ← Anchor integration tests
```

## For Teammates

### Atharva (Agent Brain)
Import the Python SDK in your agent code:
```python
from blockchain import get_wallet, TreasuryManager, PaymentListener
```

### Frontend Team
Install the SDK:
```bash
cd sdk && npm install && npm run build
```

Then import in React:
```typescript
import { NomadTreasuryClient } from '@nomad-ai/sdk';

const client = new NomadTreasuryClient();
const health = await client.getHealthStatus(walletAddress);
```
