"""
Earner Node — Checks if the Nomad AI got paid for its work.

Monitors the Solana wallet for incoming payments and updates
the financial state.
"""

from langchain_core.messages import AIMessage

from agent.state import AgentState
from agent.wallet.solana_wallet import SolanaWallet
from agent.memory.store import MemoryStore


def earn(state: AgentState) -> dict:
    """
    The Earn node — checks wallet balance and monitors for payments.
    
    In a real production system, this would listen for specific payment
    transactions tied to delivered services. For the hackathon demo,
    we check the overall balance change.
    
    Returns partial state update with:
        - wallet_balance (updated)
        - earnings_this_cycle
        - decision = "survive"
        - cycle_log entry
    """
    try:
        wallet = SolanaWallet()
        memory = MemoryStore()

        previous_balance = state.get("wallet_balance", 0.0)
        current_balance = wallet.get_balance(force=True)

        # Calculate earnings this cycle
        balance_diff = current_balance - previous_balance
        earnings = max(0, balance_diff)  # Only count positive changes

        if earnings > 0:
            # Log the earning
            memory.log_earning(
                amount_sol=earnings,
                source=state.get("current_task", "unknown"),
            )
            log_entry = f"💰 EARN: Received {earnings:.4f} SOL! Balance: {current_balance:.4f} SOL"
            msg = f"Payment received: {earnings:.4f} SOL. New balance: {current_balance:.4f} SOL."
        else:
            # For demo: simulate expected earnings from the task result
            expected = 0.0
            task_result = state.get("task_result", {})
            if task_result and not task_result.get("error"):
                expected = task_result.get("price_sol", 0.0)
                # In demo mode, we credit the expected earnings
                current_balance += expected
                earnings = expected
                memory.log_earning(
                    amount_sol=expected,
                    source=f"demo_{state.get('current_task', 'unknown')}",
                )
                log_entry = f"💰 EARN (demo): Credited {expected:.4f} SOL for service. Balance: {current_balance:.4f} SOL"
                msg = f"Demo credit: {expected:.4f} SOL for {state.get('current_task')}. Balance: {current_balance:.4f} SOL."
            else:
                log_entry = f"📊 EARN: No payment received. Balance: {current_balance:.4f} SOL"
                msg = f"No payment yet. Balance unchanged: {current_balance:.4f} SOL."

        return {
            "wallet_balance": current_balance,
            "earnings_this_cycle": earnings,
            "decision": "survive",
            "messages": [AIMessage(content=msg)],
            "cycle_log": [log_entry],
        }

    except Exception as e:
        error_msg = f"Earn node error: {str(e)}"
        return {
            "wallet_balance": state.get("wallet_balance", 0.0),
            "earnings_this_cycle": 0.0,
            "decision": "survive",
            "error": error_msg,
            "messages": [AIMessage(content=error_msg)],
            "cycle_log": [f"⚠️ EARN ERROR: {error_msg}"],
        }
