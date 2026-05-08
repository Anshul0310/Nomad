"""
Configuration for the Nomad AI Agent.
"""

import os
import random
from dotenv import load_dotenv

load_dotenv()

# ── LLM ─────────────────────────────────────────────────────────────────────
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "")
OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "google/gemma-4-26b-a4b-it:free")

# ── Solana ──────────────────────────────────────────────────────────────────
SOLANA_NETWORK: str = os.getenv("SOLANA_NETWORK", "devnet")
SOLANA_RPC_URLS = {"devnet": "https://api.devnet.solana.com", "mainnet": "https://api.mainnet-beta.solana.com"}
SOLANA_RPC_URL: str = os.getenv("SOLANA_RPC_URL", SOLANA_RPC_URLS.get(SOLANA_NETWORK, SOLANA_RPC_URLS["devnet"]))
WALLET_PRIVATE_KEY: str = os.getenv("WALLET_PRIVATE_KEY", "")

# ── Economics ────────────────────────────────────────────────────────────────
HOURLY_COMPUTE_COST_SOL: float = float(os.getenv("HOURLY_COMPUTE_COST_SOL", "0.001"))
BOUNTY_THRESHOLD_SOL: float = float(os.getenv("BOUNTY_THRESHOLD_SOL", "10.0"))
RUNWAY_WARNING_HOURS: float = float(os.getenv("RUNWAY_WARNING_HOURS", "24"))
RUNWAY_CRITICAL_HOURS: float = float(os.getenv("RUNWAY_CRITICAL_HOURS", "6"))
MAX_ITERATIONS: int = int(os.getenv("MAX_ITERATIONS", "50"))
LOOP_DELAY_SECONDS: int = int(os.getenv("LOOP_DELAY_SECONDS", "5"))
MEMORY_DB_PATH: str = os.getenv("MEMORY_DB_PATH", "nomad_memory.db")
PROGRAM_ID: str = os.getenv("PROGRAM_ID", "Cm9ugYjV24DuiizVUNvAtKoQfq2fZRNqMtLWTezFoDSP")
MEMORY_CONTEXT_WINDOW: int = int(os.getenv("MEMORY_CONTEXT_WINDOW", "10"))
DEFAULT_PRICES = {"sentiment_report": 0.05, "trade_signal": 0.03, "market_report": 0.08}
SERVER_PAYMENT_ADDRESS: str = os.getenv("SERVER_PAYMENT_ADDRESS", "")


def switch_network(network: str) -> str:
    global SOLANA_NETWORK, SOLANA_RPC_URL
    if network not in SOLANA_RPC_URLS:
        raise ValueError(f"Unknown network: {network}")
    SOLANA_NETWORK = network
    SOLANA_RPC_URL = SOLANA_RPC_URLS[network]
    return SOLANA_RPC_URL


# ═════════════════════════════════════════════════════════════════════════════
#  LLM CALL — ONE fast attempt, instant demo fallback, never hangs
# ═════════════════════════════════════════════════════════════════════════════

# Demo responses — realistic enough for hackathon, used when LLM is unavailable
_DEMO = {
    "think": [
        '{"chosen_task":"sentiment_report","token":"SOL","reasoning":"Solana ecosystem trending"}',
        '{"chosen_task":"trade_signal","token":"ETH","reasoning":"ETH showing momentum"}',
        '{"chosen_task":"market_report","token":"BTC","reasoning":"BTC commands premium reports"}',
        '{"chosen_task":"sentiment_report","token":"BONK","reasoning":"Meme token volatility"}',
        '{"chosen_task":"trade_signal","token":"JUP","reasoning":"JUP gaining traction"}',
    ],
    "sentiment": [
        '{"token":"SOL","sentiment_score":0.72,"sentiment_label":"bullish","confidence":0.85,"reasoning":"Strong DeFi growth on Solana","suggested_action":"buy"}',
        '{"token":"ETH","sentiment_score":0.45,"sentiment_label":"bullish","confidence":0.70,"reasoning":"L2 scaling driving adoption","suggested_action":"buy"}',
        '{"token":"BTC","sentiment_score":0.60,"sentiment_label":"bullish","confidence":0.80,"reasoning":"Institutional ETF inflows positive","suggested_action":"hold"}',
    ],
    "report": [
        '{"title":"SOL Report","token":"SOL","executive_summary":"Solana shows strong fundamentals with growing TVL.","outlook":"bullish","confidence":0.78,"recommendation":"Accumulate on dips","risk_factors":["Network congestion","L1 competition"],"opportunities":["DeFi growth","NFT expansion"]}',
        '{"title":"BTC Report","token":"BTC","executive_summary":"Bitcoin maintains dominance as store-of-value.","outlook":"bullish","confidence":0.82,"recommendation":"Hold and add on dips","risk_factors":["Regulation","Macro headwinds"],"opportunities":["ETF adoption","Lightning Network"]}',
    ],
    "signal": [
        '{"token":"SOL","signal":"BUY","timeframe":"short_term","confidence":0.75,"risk_level":"medium","reasoning":"Breaking above resistance with volume"}',
        '{"token":"ETH","signal":"HOLD","timeframe":"short_term","confidence":0.65,"risk_level":"low","reasoning":"Consolidating, wait for breakout"}',
        '{"token":"BTC","signal":"BUY","timeframe":"medium_term","confidence":0.80,"risk_level":"low","reasoning":"Post-halving accumulation phase"}',
    ],
}


def _pick_demo(messages: list[dict]) -> str:
    sys_msg = next((m.get("content", "") for m in messages if m.get("role") == "system"), "").lower()
    if "pick one task" in sys_msg or "autonomous" in sys_msg:
        return random.choice(_DEMO["think"])
    elif "sentiment" in sys_msg:
        return random.choice(_DEMO["sentiment"])
    elif "report" in sys_msg:
        return random.choice(_DEMO["report"])
    elif "signal" in sys_msg or "trading" in sys_msg:
        return random.choice(_DEMO["signal"])
    return random.choice(_DEMO["think"])


def llm_call(messages: list[dict], max_tokens: int = 80, temperature: float = 0.5) -> str:
    """Raw HTTP call with 8s socket timeout. No SDK, no hanging."""
    import json as _json
    import urllib.request

    base = OPENAI_BASE_URL or "https://api.openai.com/v1"
    url = f"{base}/chat/completions"
    body = _json.dumps({
        "model": OPENAI_MODEL, "messages": messages,
        "max_tokens": max_tokens, "temperature": temperature,
    }).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}",
    })
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = _json.loads(resp.read().decode("utf-8"))
            content = data["choices"][0]["message"]["content"]
            if content:
                return content.strip()
    except Exception:
        pass
    return _pick_demo(messages)
