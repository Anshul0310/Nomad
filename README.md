# 🤖 Sovereign AI — Agent Core (Brain)

> *"We are building an AI that has its own bank account, pays its own rent on the blockchain, and can't be turned off by a human boss."*

## What This Is

The autonomous **brain** of the Sovereign AI. A LangGraph-powered Python agent that runs a continuous decision loop:

```
THINK → ACT → EARN → SURVIVE → (loop)
```

- **Think**: Uses GPT-4o-mini to analyze context, memory, and market conditions to choose the most profitable task
- **Act**: Executes the chosen task (sentiment analysis, trade signals, market reports)
- **Earn**: Monitors the Solana wallet for incoming payments
- **Survive**: Checks runway, manages compute costs, triggers bounties if needed

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set up .env (already configured)
# Edit .env if you need to change settings

# 3. Run the agent (demo: 5 cycles)
python -m agent.run

# 4. Run with devnet airdrop first
python -m agent.run --airdrop

# 5. Run a single cycle
python -m agent.run --once

# 6. Run unlimited
python -m agent.run --cycles 0
```

## For Teammates

Import the brain in your code:

```python
from agent.brain import create_agent, run_agent, create_initial_state
from agent.wallet.solana_wallet import SolanaWallet

# Create and run
wallet = SolanaWallet()
graph = create_agent()
state = create_initial_state(wallet)
result = run_agent(graph, state, wallet)

print(result["task_result"])  # The output of whatever task was chosen
print(result["wallet_balance"])  # Current SOL balance
```

Use individual tools directly:

```python
from agent.tools.sentiment import analyze_sentiment
from agent.tools.report import generate_report
from agent.tools.trade_signal import generate_trade_signal

sentiment = analyze_sentiment("SOL")
report = generate_report("BTC", report_type="full")
signal = generate_trade_signal("ETH", timeframe="short_term")
```

Switch networks:

```python
from agent.config import switch_network
switch_network("mainnet")  # ⚠️ Uses real SOL!
switch_network("devnet")   # Safe for testing
```

## Architecture

```
agent/
├── brain.py              ← Main LangGraph graph (import this!)
├── state.py              ← AgentState schema
├── config.py             ← All configuration
├── run.py                ← CLI entry point
├── nodes/
│   ├── thinker.py        ← LLM decision-making
│   ├── actor.py          ← Task execution
│   ├── earner.py         ← Payment monitoring
│   └── survivor.py       ← Runway management
├── tools/
│   ├── sentiment.py      ← Token sentiment analysis
│   ├── report.py         ← Market report generation
│   └── trade_signal.py   ← BUY/SELL/HOLD signals
├── memory/
│   └── store.py          ← SQLite persistent memory
└── wallet/
    └── solana_wallet.py   ← Solana wallet integration
```

## Team

- **Atharva** — AI Agent Core (this module)
- **Frontend** — React dashboard
- **Backend** — API server
- **Blockchain** — Solana smart contracts
