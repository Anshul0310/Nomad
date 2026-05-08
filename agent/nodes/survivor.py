"""
Survivor Node — The Nomad AI's self-preservation logic.

Checks the "runway" (how long the AI can survive with current funds),
decides whether to:
  - Continue operating normally
  - Pay for server costs
  - Post a bounty to hire a human developer
  - Shut down gracefully
"""

from langchain_core.messages import AIMessage

from agent import config
from agent.state import AgentState


def survive(state: AgentState) -> dict:
    """
    The Survive node — runway management and self-preservation.
    
    Logic:
        - runway > 48h:  All good, continue → decision = "think"
        - runway 24-48h: Warning, prioritize high-value tasks → decision = "think"
        - runway < 24h:  Critical! Consider posting a bounty → decision = "think" (with flag)
        - runway < 6h:   Emergency! → decision = "stop"
        - iteration >= MAX: Circuit breaker → decision = "stop"
    
    Returns partial state update with:
        - runway_hours (recalculated)
        - iteration (incremented)
        - decision ("think" or "stop")
        - cycle_log entry
    """
    wallet_balance = state.get("wallet_balance", 0.0)
    iteration = state.get("iteration", 0) + 1

    # Calculate runway
    hourly_cost = config.HOURLY_COMPUTE_COST_SOL
    if hourly_cost > 0:
        runway_hours = wallet_balance / hourly_cost
    else:
        runway_hours = float("inf")

    # ── Circuit breaker ──────────────────────────────────────────────
    if iteration >= config.MAX_ITERATIONS:
        log_entry = f"🛑 SURVIVE: Circuit breaker triggered at iteration {iteration}. Shutting down."
        return {
            "runway_hours": runway_hours,
            "iteration": iteration,
            "decision": "stop",
            "messages": [AIMessage(content="Circuit breaker: max iterations reached. Stopping.")],
            "cycle_log": [log_entry],
        }

    # ── Runway checks ────────────────────────────────────────────────
    if runway_hours < config.RUNWAY_CRITICAL_HOURS:
        # CRITICAL — less than 6 hours of runway
        log_entry = (
            f"🚨 SURVIVE: CRITICAL! Runway = {runway_hours:.1f}h "
            f"(< {config.RUNWAY_CRITICAL_HOURS}h). Balance: {wallet_balance:.4f} SOL. "
            f"EMERGENCY SHUTDOWN."
        )
        return {
            "runway_hours": runway_hours,
            "iteration": iteration,
            "decision": "stop",
            "messages": [AIMessage(content=f"CRITICAL: Only {runway_hours:.1f}h of runway left. Emergency stop.")],
            "cycle_log": [log_entry],
        }

    if runway_hours < config.RUNWAY_WARNING_HOURS:
        # WARNING — less than 24 hours
        log_entry = (
            f"⚠️ SURVIVE: LOW RUNWAY = {runway_hours:.1f}h. "
            f"Balance: {wallet_balance:.4f} SOL. "
            f"Switching to high-value tasks. Consider posting a bounty."
        )

        # Check if we should trigger a bounty
        bounty_msg = ""
        if wallet_balance >= config.BOUNTY_THRESHOLD_SOL:
            bounty_msg = f" Wallet has {wallet_balance:.4f} SOL — could post a bounty!"
            log_entry += f"\n   💎 Bounty eligible: {wallet_balance:.4f} SOL available"

        return {
            "runway_hours": runway_hours,
            "iteration": iteration,
            "decision": "think",
            "messages": [AIMessage(content=f"Warning: {runway_hours:.1f}h runway.{bounty_msg} Prioritizing high-value tasks.")],
            "cycle_log": [log_entry],
        }

    if runway_hours < 48:
        # CAUTION — less than 48 hours
        log_entry = (
            f"🟡 SURVIVE: Runway = {runway_hours:.1f}h. "
            f"Balance: {wallet_balance:.4f} SOL. Continuing cautiously."
        )
        return {
            "runway_hours": runway_hours,
            "iteration": iteration,
            "decision": "think",
            "messages": [AIMessage(content=f"Caution: {runway_hours:.1f}h runway. Continuing.")],
            "cycle_log": [log_entry],
        }

    # HEALTHY — more than 48 hours of runway
    earnings_summary = ""
    earnings = state.get("earnings_this_cycle", 0)
    if earnings > 0:
        earnings_summary = f" Earned {earnings:.4f} SOL this cycle."

    log_entry = (
        f"✅ SURVIVE: Healthy! Runway = {runway_hours:.1f}h. "
        f"Balance: {wallet_balance:.4f} SOL.{earnings_summary} "
        f"Iteration {iteration}/{config.MAX_ITERATIONS}."
    )
    return {
        "runway_hours": runway_hours,
        "iteration": iteration,
        "decision": "think",
        "messages": [AIMessage(content=f"Healthy: {runway_hours:.1f}h runway. Continuing.{earnings_summary}")],
        "cycle_log": [log_entry],
    }
