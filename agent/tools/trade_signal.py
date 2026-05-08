"""
Trade Signal Tool — Generate BUY/SELL/HOLD signals.
"""

import json
from agent import config


SYSTEM_PROMPT = """You are a crypto trading signal generator. Return ONLY a JSON object:
{"token":"SOL","signal":"BUY","timeframe":"short_term","confidence":0.7,"risk_level":"medium","reasoning":"brief reason"}

signal: STRONG_BUY/BUY/HOLD/SELL/STRONG_SELL. risk_level: low/medium/high. Return ONLY JSON."""


def generate_trade_signal(token: str, timeframe: str = "short_term", context: str = "") -> dict:
    """Generate a trading signal for a token."""
    prompt = f"Generate a {timeframe} trading signal for {token}."
    if context:
        prompt += f" Context: {context}"

    try:
        raw = config.llm_call(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            max_tokens=200,
            temperature=0.3,
        )

        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            raw = raw[start:end]

        result = json.loads(raw)
        result["service_type"] = "trade_signal"
        result["price_sol"] = config.DEFAULT_PRICES.get("trade_signal", 0.03)
        return result

    except Exception as e:
        return {
            "token": token,
            "error": str(e),
            "service_type": "trade_signal",
            "price_sol": 0.0,
        }
