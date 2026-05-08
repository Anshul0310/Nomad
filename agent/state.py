"""
AgentState — the shared state schema that flows through the LangGraph decision loop.
"""

from __future__ import annotations

import operator
from typing import Annotated, Optional
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage


class AgentState(TypedDict):
    """
    The central state flowing through the Nomad AI's decision graph.
    
    Fields:
        messages:         Full conversation history with the LLM.
        current_task:     The task the agent decided to execute this cycle
                          ("sentiment_report", "trade_signal", "market_report", or None).
        task_params:      Parameters for the chosen task (e.g. token name).
        task_result:      The output of executing the task.
        wallet_balance:   Current SOL balance of the agent's wallet.
        runway_hours:     Estimated hours of compute the agent can still afford.
        iteration:        Loop counter — the circuit breaker.
        memory_context:   Relevant past tasks/outcomes fetched from the memory store.
        decision:         Routing decision for the next step:
                          "act" | "earn_check" | "survive" | "think" | "stop"
        earnings_this_cycle: SOL earned during this cycle.
        error:            Error message if something went wrong.
        cycle_log:        Human-readable log entries for the current cycle.
    """

    # ── Core loop state ──────────────────────────────────────────────────
    messages: Annotated[list[BaseMessage], operator.add]
    current_task: Optional[str]
    task_params: Optional[dict]
    task_result: Optional[dict]

    # ── Financial state ──────────────────────────────────────────────────
    wallet_balance: float
    runway_hours: float
    earnings_this_cycle: float

    # ── Control state ────────────────────────────────────────────────────
    iteration: int
    decision: Optional[str]
    error: Optional[str]

    # ── Context state ────────────────────────────────────────────────────
    memory_context: list[dict]
    cycle_log: Annotated[list[str], operator.add]
