"""
Sentiment Analysis Tool — Analyze token market sentiment.
"""

import json
from agent import config


SYSTEM_PROMPT = """You are a crypto sentiment analyst. Analyze the token and return ONLY a JSON object:
{"token":"SOL","sentiment_score":0.6,"sentiment_label":"bullish","confidence":0.8,"reasoning":"brief reason","suggested_action":"buy"}

sentiment_score: -1.0 to 1.0. sentiment_label: very_bearish/bearish/neutral/bullish/very_bullish.
suggested_action: strong_sell/sell/hold/buy/strong_buy. Return ONLY JSON."""


def analyze_sentiment(token: str, context: str = "") -> dict:
    """Analyze market sentiment for a token."""
    prompt = f"Analyze sentiment for {token}."
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
        result["service_type"] = "sentiment_report"
        result["price_sol"] = config.DEFAULT_PRICES.get("sentiment_report", 0.05)
        return result

    except Exception as e:
        return {
            "token": token,
            "error": str(e),
            "service_type": "sentiment_report",
            "price_sol": 0.0,
        }
