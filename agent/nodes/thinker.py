"""
Thinker Node — Decides what task to execute next.
"""

import json
from langchain_core.messages import AIMessage

from agent import config
from agent.state import AgentState
from agent.memory.store import MemoryStore


SYSTEM_PROMPT = """You are an autonomous AI agent that earns crypto by selling analysis services.
Pick ONE task and ONE token. Reply with ONLY a JSON object, no extra text.

Tasks: sentiment_report (0.05 SOL), trade_signal (0.03 SOL), market_report (0.08 SOL), code_generation (0.10 SOL)
Tokens: SOL, BTC, ETH, BONK, JUP, WIF, RNDR, PYTH

{"chosen_task":"sentiment_report","token":"SOL","reasoning":"short reason"}"""


def think(state: AgentState) -> dict:
    """Analyze context and decide what task to do next."""
    memory = MemoryStore()
    memory_context = memory.build_memory_context()

    balance = state.get("wallet_balance", 0)
    runway = state.get("runway_hours", 0)
    iteration = state.get("iteration", 0)

    user_msg = f"Balance: {balance:.4f} SOL, Runway: {runway:.1f}h, Iteration: {iteration}. Pick a task."

    try:
        raw = config.llm_call(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=150,
            temperature=0.7,
        )

        # Extract JSON from response
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            raw = raw[start:end]

        decision = json.loads(raw)
        chosen_task = decision.get("chosen_task", "sentiment_report")
        token = decision.get("token", "SOL")
        reasoning = decision.get("reasoning", "Auto-selected")

        memory.save_decision(
            chosen_action=chosen_task,
            reasoning=reasoning,
            wallet_balance=balance,
            runway_hours=runway,
        )

        return {
            "current_task": chosen_task,
            "task_params": {"token": token, "reasoning": reasoning},
            "decision": "act",
            "memory_context": memory_context,
            "messages": [AIMessage(content=f"Chose {chosen_task} for {token}")],
            "cycle_log": [f"[THINK] Chose '{chosen_task}' for {token} - {reasoning}"],
        }

    except Exception as e:
        return {
            "current_task": "sentiment_report",
            "task_params": {"token": "SOL", "reasoning": "Fallback"},
            "decision": "act",
            "memory_context": memory_context,
            "error": str(e),
            "messages": [AIMessage(content=f"Fallback: {e}")],
            "cycle_log": [f"[THINK] Error: {e}. Falling back to SOL sentiment."],
        }
