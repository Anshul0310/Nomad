"""
Brain — The Nomad AI's LangGraph Decision Loop.

This is the MAIN MODULE that teammates import and call.

Usage:
    from agent.brain import create_agent, run_agent
    
    # Create the compiled graph
    agent = create_agent()
    
    # Run a single cycle
    result = run_agent(agent)
    
    # Or run the full autonomous loop
    from agent.brain import run_autonomous_loop
    run_autonomous_loop()

The decision loop:
    THINK → ACT → EARN → SURVIVE → (loop back to THINK or STOP)
"""

from __future__ import annotations

import io
import os
import sys
import time
from typing import Optional

from langgraph.graph import StateGraph, END

from agent.state import AgentState
from agent import config
from agent.nodes.thinker import think
from agent.nodes.actor import act
from agent.nodes.earner import earn
from agent.nodes.survivor import survive
from agent.wallet.solana_wallet import SolanaWallet

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

# Force UTF-8 output on Windows to avoid emoji encoding crashes
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

console = Console(force_terminal=True)


# ── Router ───────────────────────────────────────────────────────────────────

def route_after_think(state: AgentState) -> str:
    """Route after the Think node — always goes to Act."""
    return "act"


def route_after_act(state: AgentState) -> str:
    """Route after the Act node — always goes to Earn."""
    return "earn"


def route_after_earn(state: AgentState) -> str:
    """Route after the Earn node — always goes to Survive."""
    return "survive"


def route_after_survive(state: AgentState) -> str:
    """
    Route after the Survive node.
    This is the KEY decision point:
      - "think" → loop back (the agent continues)
      - "stop"  → END (the agent shuts down)
    """
    decision = state.get("decision", "stop")
    if decision == "think":
        return "think"
    return "end"


# ── Graph Builder ────────────────────────────────────────────────────────────

def create_agent() -> StateGraph:
    """
    Build and compile the Nomad AI's LangGraph decision loop.
    
    Returns:
        A compiled LangGraph that can be invoked with an initial state.
    """
    builder = StateGraph(AgentState)

    # Add nodes
    builder.add_node("think", think)
    builder.add_node("act", act)
    builder.add_node("earn", earn)
    builder.add_node("survive", survive)

    # Set entry point
    builder.set_entry_point("think")

    # Add edges: Think → Act → Earn → Survive
    builder.add_edge("think", "act")
    builder.add_edge("act", "earn")
    builder.add_edge("earn", "survive")

    # Conditional edge: Survive → Think (loop) or END (stop)
    builder.add_conditional_edges(
        "survive",
        route_after_survive,
        {
            "think": "think",
            "end": END,
        },
    )

    graph = builder.compile()
    return graph


# ── Initial State ────────────────────────────────────────────────────────────

def create_initial_state(wallet: Optional[SolanaWallet] = None) -> AgentState:
    """Create the initial state for the agent loop."""
    balance = 0.0
    if wallet:
        try:
            balance = wallet.get_balance()
        except Exception:
            balance = 0.0

    hourly_cost = config.HOURLY_COMPUTE_COST_SOL
    runway = balance / hourly_cost if hourly_cost > 0 else float("inf")

    return {
        "messages": [],
        "current_task": None,
        "task_params": None,
        "task_result": None,
        "wallet_balance": balance,
        "runway_hours": runway,
        "earnings_this_cycle": 0.0,
        "iteration": 0,
        "decision": None,
        "error": None,
        "memory_context": [],
        "cycle_log": [],
    }


# ── Single Run ───────────────────────────────────────────────────────────────

def run_agent(
    graph=None,
    initial_state: Optional[AgentState] = None,
    wallet: Optional[SolanaWallet] = None,
) -> AgentState:
    """
    Run the agent through one complete cycle of the decision loop.
    The graph will keep looping (Think→Act→Earn→Survive→Think...)
    until the Survive node decides to stop.
    
    Args:
        graph: A compiled LangGraph. If None, creates a new one.
        initial_state: Starting state. If None, creates a default one.
        wallet: SolanaWallet instance. If None, creates a new one.
        
    Returns:
        The final AgentState after the loop completes.
    """
    if graph is None:
        graph = create_agent()

    if wallet is None:
        wallet = SolanaWallet()

    if initial_state is None:
        initial_state = create_initial_state(wallet)

    # Run the graph
    final_state = graph.invoke(initial_state)
    return final_state


# ── Display Helpers ──────────────────────────────────────────────────────────

def print_startup(wallet: SolanaWallet) -> None:
    """Print a fancy startup banner."""
    console.print()
    console.print(
        Panel.fit(
            "[bold cyan]🤖 NOMAD AI — AGENT CORE[/bold cyan]\n"
            "[dim]Autonomous • Self-Sustaining • Unstoppable[/dim]",
            border_style="cyan",
        )
    )

    info = Table(show_header=False, box=None, padding=(0, 2))
    info.add_column(style="bold yellow")
    info.add_column(style="white")
    info.add_row("Wallet", wallet.address)
    info.add_row("Network", config.SOLANA_NETWORK)
    info.add_row("Model", config.OPENAI_MODEL)
    info.add_row("Max Iterations", str(config.MAX_ITERATIONS))
    info.add_row("Hourly Cost", f"{config.HOURLY_COMPUTE_COST_SOL} SOL")

    try:
        balance = wallet.get_balance()
        info.add_row("Balance", f"{balance:.4f} SOL")
        runway = balance / config.HOURLY_COMPUTE_COST_SOL if config.HOURLY_COMPUTE_COST_SOL > 0 else float("inf")
        info.add_row("Runway", f"{runway:.1f} hours")
    except Exception:
        info.add_row("Balance", "[red]Unable to fetch[/red]")

    console.print(info)
    console.print()


def print_cycle_log(state: AgentState) -> None:
    """Print the cycle log entries."""
    logs = state.get("cycle_log", [])
    if logs:
        for entry in logs:
            console.print(f"  {entry}")


# ── Autonomous Loop ──────────────────────────────────────────────────────────

def run_autonomous_loop(max_cycles: int = 0) -> None:
    """
    Run the Nomad AI in a continuous autonomous loop.
    
    Each "cycle" is a full Think→Act→Earn→Survive pass.
    The agent will keep running until:
      - The Survive node decides to stop
      - max_cycles is reached (0 = unlimited)
      - KeyboardInterrupt (Ctrl+C)
    
    Args:
        max_cycles: Maximum number of cycles. 0 for unlimited.
    """
    wallet = SolanaWallet()
    graph = create_agent()

    print_startup(wallet)

    console.print("[bold green]▶ Starting autonomous loop...[/bold green]\n")

    cycle = 0
    state = create_initial_state(wallet)

    try:
        while True:
            cycle += 1
            if max_cycles > 0 and cycle > max_cycles:
                console.print(f"\n[yellow]Max cycles ({max_cycles}) reached. Stopping.[/yellow]")
                break

            console.print(f"\n[bold]{'═' * 60}[/bold]")
            console.print(f"[bold cyan]  CYCLE {cycle}[/bold cyan]")
            console.print(f"[bold]{'═' * 60}[/bold]\n")

            # Run one full graph execution
            # The graph will loop internally (Think→Act→Earn→Survive→Think...)
            # until Survive decides to stop
            state = graph.invoke(state)

            # Print logs from this cycle
            print_cycle_log(state)

            # Check if the agent decided to stop
            if state.get("decision") == "stop":
                console.print("\n[bold red]🛑 Agent decided to stop.[/bold red]")
                break

            # Brief pause between cycles
            console.print(f"\n[dim]Waiting {config.LOOP_DELAY_SECONDS}s before next cycle...[/dim]")
            time.sleep(config.LOOP_DELAY_SECONDS)

            # Reset cycle-specific state for next run, but keep persistent state
            state = {
                **state,
                "current_task": None,
                "task_params": None,
                "task_result": None,
                "earnings_this_cycle": 0.0,
                "error": None,
                "cycle_log": [],
                "messages": [],  # Reset messages each cycle to save tokens
            }

    except KeyboardInterrupt:
        console.print("\n\n[yellow]⚡ Interrupted by user. Shutting down gracefully...[/yellow]")

    # Final summary
    console.print()
    console.print(
        Panel.fit(
            f"[bold]Final State[/bold]\n"
            f"Cycles completed: {cycle}\n"
            f"Balance: {state.get('wallet_balance', 0):.4f} SOL\n"
            f"Runway: {state.get('runway_hours', 0):.1f} hours\n"
            f"Iterations: {state.get('iteration', 0)}",
            border_style="cyan",
            title="🤖 Nomad AI — Shutdown",
        )
    )
