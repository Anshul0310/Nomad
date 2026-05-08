"""
CLI entry point for the Sovereign AI Agent.

Usage:
    python -m agent.run                    # Run autonomous loop (default 5 cycles for demo)
    python -m agent.run --cycles 10        # Run 10 cycles
    python -m agent.run --cycles 0         # Run unlimited
    python -m agent.run --once             # Run a single cycle
    python -m agent.run --airdrop          # Request devnet airdrop first
    python -m agent.run --network mainnet  # Switch to mainnet
"""

import argparse
import sys

from rich.console import Console

console = Console()


def main():
    parser = argparse.ArgumentParser(
        description="🤖 Sovereign AI — Autonomous Agent Core",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m agent.run                 Run 5 cycles (demo mode)
  python -m agent.run --cycles 0      Run unlimited cycles
  python -m agent.run --once          Run a single think→act→earn→survive cycle
  python -m agent.run --airdrop       Get devnet SOL before starting
  python -m agent.run --network mainnet  Switch to mainnet (use with caution!)
        """,
    )
    parser.add_argument(
        "--cycles", type=int, default=5,
        help="Number of cycles to run (0 = unlimited, default: 5)"
    )
    parser.add_argument(
        "--once", action="store_true",
        help="Run a single cycle and exit"
    )
    parser.add_argument(
        "--airdrop", action="store_true",
        help="Request a devnet airdrop before starting"
    )
    parser.add_argument(
        "--airdrop-amount", type=float, default=2.0,
        help="Amount of SOL to airdrop (default: 2.0)"
    )
    parser.add_argument(
        "--network", type=str, default=None, choices=["devnet", "mainnet"],
        help="Solana network to use"
    )

    args = parser.parse_args()

    # Late imports to avoid import errors if deps aren't installed
    from agent import config
    from agent.brain import create_agent, run_agent, run_autonomous_loop, create_initial_state, print_startup
    from agent.wallet.solana_wallet import SolanaWallet

    # Network switch
    if args.network:
        config.switch_network(args.network)
        console.print(f"[cyan]Network switched to: {args.network}[/cyan]")

    # Initialize wallet
    wallet = SolanaWallet()

    # Airdrop
    if args.airdrop:
        if config.SOLANA_NETWORK != "devnet":
            console.print("[red]Airdrop only available on devnet![/red]")
            sys.exit(1)

        console.print(f"[yellow]Requesting {args.airdrop_amount} SOL airdrop...[/yellow]")
        try:
            sig = wallet.request_airdrop(args.airdrop_amount)
            console.print(f"[green]✓ Airdrop requested! Signature: {sig}[/green]")
            console.print("[dim]Waiting 10s for confirmation...[/dim]")
            import time
            time.sleep(10)
            balance = wallet.get_balance(force=True)
            console.print(f"[green]✓ New balance: {balance:.4f} SOL[/green]")
        except Exception as e:
            console.print(f"[red]Airdrop failed: {e}[/red]")
            console.print("[dim]Continuing anyway...[/dim]")

    # Run mode
    if args.once:
        console.print("[bold cyan]Running a single cycle...[/bold cyan]\n")
        print_startup(wallet)
        graph = create_agent()
        state = create_initial_state(wallet)
        final = run_agent(graph, state, wallet)

        # Print results
        console.print(f"\n[bold]Result:[/bold]")
        console.print(f"  Task: {final.get('current_task')}")
        console.print(f"  Balance: {final.get('wallet_balance', 0):.4f} SOL")
        console.print(f"  Runway: {final.get('runway_hours', 0):.1f} hours")

        if final.get("task_result"):
            result = final["task_result"]
            if not result.get("error"):
                console.print(f"  [green]✓ Task completed successfully![/green]")
            else:
                console.print(f"  [red]✗ Task failed: {result.get('error')}[/red]")

        logs = final.get("cycle_log", [])
        if logs:
            console.print(f"\n[bold]Log:[/bold]")
            for entry in logs:
                console.print(f"  {entry}")
    else:
        run_autonomous_loop(max_cycles=args.cycles)


if __name__ == "__main__":
    main()
