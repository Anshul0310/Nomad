"""
Actor Node — Executes the task chosen by the Thinker.

Dispatches to the appropriate tool (sentiment, report, trade signal)
and returns the result.
"""

import time
from langchain_core.messages import AIMessage

from agent.state import AgentState
from agent.tools.sentiment import analyze_sentiment
from agent.tools.report import generate_report
from agent.tools.trade_signal import generate_trade_signal
from agent.memory.store import MemoryStore


# Map task types to their handler functions
TASK_HANDLERS = {
    "sentiment_report": lambda params: analyze_sentiment(
        token=params.get("token", "SOL"),
        context=params.get("context", ""),
    ),
    "market_report": lambda params: generate_report(
        token=params.get("token", "SOL"),
        report_type=params.get("report_type", "full"),
        context=params.get("context", ""),
    ),
    "trade_signal": lambda params: generate_trade_signal(
        token=params.get("token", "SOL"),
        timeframe=params.get("timeframe", "short_term"),
        context=params.get("context", ""),
    ),
}


def act(state: AgentState) -> dict:
    """
    The Act node — executes the chosen task using the appropriate tool.
    
    Returns partial state update with:
        - task_result
        - decision = "earn_check"
        - cycle_log entry
    """
    task = state.get("current_task", "sentiment_report")
    params = state.get("task_params", {"token": "SOL"})

    handler = TASK_HANDLERS.get(task)
    if not handler:
        error_msg = f"Unknown task type: {task}"
        return {
            "task_result": {"error": error_msg},
            "decision": "earn_check",
            "error": error_msg,
            "messages": [AIMessage(content=error_msg)],
            "cycle_log": [f"❌ ACT ERROR: {error_msg}"],
        }

    start_time = time.time()

    try:
        result = handler(params)
        duration = time.time() - start_time

        # Save task to memory
        memory = MemoryStore()
        outcome = "failure" if result.get("error") else "success"
        memory.save_task(
            task_type=task,
            input_data=params,
            output_data=result,
            outcome=outcome,
            earnings=result.get("price_sol", 0) if outcome == "success" else 0,
            duration_s=duration,
            error_msg=result.get("error", ""),
        )

        token = params.get("token", "?")
        price = result.get("price_sol", 0)

        if outcome == "success":
            log_entry = f"⚡ ACT: Completed '{task}' for {token} in {duration:.1f}s — worth {price} SOL"
            msg = f"Task completed: {task} for {token}. Result ready, priced at {price} SOL."
        else:
            log_entry = f"❌ ACT: Failed '{task}' for {token} — {result.get('error', 'unknown error')}"
            msg = f"Task failed: {task} for {token}. Error: {result.get('error')}"

        return {
            "task_result": result,
            "decision": "earn_check",
            "messages": [AIMessage(content=msg)],
            "cycle_log": [log_entry],
        }

    except Exception as e:
        duration = time.time() - start_time
        error_msg = f"Act node exception: {str(e)}"

        memory = MemoryStore()
        memory.save_task(
            task_type=task,
            input_data=params,
            output_data={"error": str(e)},
            outcome="failure",
            duration_s=duration,
            error_msg=str(e),
        )

        return {
            "task_result": {"error": str(e)},
            "decision": "earn_check",
            "error": error_msg,
            "messages": [AIMessage(content=error_msg)],
            "cycle_log": [f"💥 ACT EXCEPTION: {error_msg}"],
        }
