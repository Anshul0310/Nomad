"""
Report Generation Tool — Generate market analysis reports.
"""

import json
from agent import config


SYSTEM_PROMPT = """You are a crypto market analyst. Generate a report and return ONLY a JSON object:
{"title":"SOL Market Report","token":"SOL","executive_summary":"2 sentences","outlook":"bullish","confidence":0.7,"recommendation":"brief recommendation","risk_factors":["risk1","risk2"],"opportunities":["opp1","opp2"]}

outlook: bearish/neutral/bullish. Return ONLY JSON."""


def generate_report(token: str, report_type: str = "full", context: str = "") -> dict:
    """Generate a market report for a token."""
    prompt = f"Generate a {report_type} market report for {token}."
    if context:
        prompt += f" Context: {context}"

    try:
        raw = config.llm_call(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            max_tokens=400,
            temperature=0.4,
        )

        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            raw = raw[start:end]

        result = json.loads(raw)
        result["service_type"] = "market_report"
        result["price_sol"] = config.DEFAULT_PRICES.get("market_report", 0.08)
        return result

    except Exception as e:
        return {
            "token": token,
            "error": str(e),
            "service_type": "market_report",
            "price_sol": 0.0,
        }
