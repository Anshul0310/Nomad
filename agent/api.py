"""
Nomad AI — REST API Server.

Bridges the React frontend dashboard to the LangGraph agent.
Runs the agent loop in a background thread and exposes state via HTTP.

Usage:
    python -m agent.api              # Start on port 8000
    python -m agent.api --port 3001  # Custom port
"""

import argparse
import io
import json
import sys
import threading
import time
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Force UTF-8 on Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from agent import config

# ── Shared State ─────────────────────────────────────────────────────────────

_state = {
    "wallet_balance": 0.0,
    "total_earned": 0.0,
    "total_spent": 0.0,
    "runway_hours": 0.0,
    "uptime": 99.97,
    "tx_count": 0,
    "iteration": 0,
    "status": "initializing",
    "wallet_address": "",
    "network": config.SOLANA_NETWORK,
    "program_id": config.PROGRAM_ID,
    "started_at": datetime.now(timezone.utc).isoformat(),
}

_activities: list[dict] = []
_bounties: list[dict] = [
    {
        "id": 1,
        "title": "Fix WebSocket reconnection logic",
        "description": "The agent's WS connection to Akash drops after 24h. Need auto-reconnect with exponential backoff.",
        "reward": "2.5 SOL",
        "difficulty": "Medium",
        "status": "open",
        "tags": ["Backend", "Infrastructure"],
    },
    {
        "id": 2,
        "title": "Implement sentiment analysis pipeline",
        "description": "Build a pipeline that analyzes crypto Twitter sentiment and generates trading signals.",
        "reward": "5.0 SOL",
        "difficulty": "Hard",
        "status": "open",
        "tags": ["AI/ML", "Python"],
    },
    {
        "id": 3,
        "title": "Dashboard mobile responsiveness",
        "description": "Make the Nomad AI dashboard fully responsive on mobile devices.",
        "reward": "1.5 SOL",
        "difficulty": "Easy",
        "status": "claimed",
        "claimedBy": "7xKp...9mNz",
        "tags": ["Frontend", "React"],
    },
    {
        "id": 4,
        "title": "Anchor smart contract upgrade",
        "description": "Upgrade the Bounty program to support milestone-based payouts.",
        "reward": "8.0 SOL",
        "difficulty": "Hard",
        "status": "open",
        "tags": ["Solana", "Anchor"],
    },
    {
        "id": 5,
        "title": "Add Prometheus metrics endpoint",
        "description": "Expose agent health metrics via Prometheus-compatible endpoint.",
        "reward": "1.0 SOL",
        "difficulty": "Easy",
        "status": "completed",
        "completedBy": "3bRt...xH2q",
        "tags": ["DevOps", "Monitoring"],
    },
]
_service_results: list[dict] = []
_lock = threading.Lock()


# ── Agent Background Thread ──────────────────────────────────────────────────

def _agent_loop():
    """Run the agent in the background, updating shared state."""
    global _state, _activities

    try:
        from agent.brain import create_agent, create_initial_state
        from agent.wallet.solana_wallet import SolanaWallet
    except ImportError as e:
        _state["status"] = f"import_error: {e}"
        return

    try:
        wallet = SolanaWallet()
        _state["wallet_address"] = wallet.address
    except Exception as e:
        _state["status"] = f"wallet_error: {e}"
        return

    graph = create_agent()

    # Initial balance
    try:
        balance = wallet.get_balance(force=True)
        _state["wallet_balance"] = balance
        _state["runway_hours"] = balance / config.HOURLY_COMPUTE_COST_SOL if config.HOURLY_COMPUTE_COST_SOL > 0 else float("inf")
    except Exception:
        pass

    _state["status"] = "running"
    _add_activity("system", "🤖 Nomad AI agent started — entering autonomous loop")

    cycle = 0
    state = create_initial_state(wallet)

    while True:
        cycle += 1
        _state["iteration"] = cycle

        try:
            state = graph.invoke(state)
        except Exception as e:
            _add_activity("system", f"⚠️ Agent cycle error: {str(e)[:100]}")
            time.sleep(config.LOOP_DELAY_SECONDS)
            continue

        # Update shared state from agent state
        with _lock:
            bal = state.get("wallet_balance", _state["wallet_balance"])
            earnings = state.get("earnings_this_cycle", 0)
            _state["wallet_balance"] = bal
            _state["total_earned"] += earnings
            _state["runway_hours"] = state.get("runway_hours", 0)
            _state["tx_count"] += 1

            # Add cycle logs as activities
            for log in state.get("cycle_log", []):
                log_type = "system"
                if "EARN" in log:
                    log_type = "earn"
                elif "ACT" in log:
                    log_type = "decision"
                elif "SURVIVE" in log:
                    log_type = "system"
                elif "THINK" in log:
                    log_type = "decision"
                _add_activity(log_type, log)

        # Check for stop
        if state.get("decision") == "stop":
            _state["status"] = "stopped"
            _add_activity("system", "🛑 Agent decided to stop")
            break

        # Reset cycle state
        state = {
            **state,
            "current_task": None,
            "task_params": None,
            "task_result": None,
            "earnings_this_cycle": 0.0,
            "error": None,
            "cycle_log": [],
            "messages": [],
        }

        time.sleep(config.LOOP_DELAY_SECONDS)


def _add_activity(type_: str, message: str):
    """Thread-safe activity addition."""
    entry = {
        "id": time.time_ns(),
        "type": type_,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    with _lock:
        _activities.insert(0, entry)
        if len(_activities) > 100:
            _activities[:] = _activities[:100]


# ── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(title="Nomad AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/status")
def get_status():
    """Agent status: balance, runway, uptime, etc."""
    with _lock:
        return JSONResponse({**_state})


@app.get("/api/activity")
def get_activity():
    """Recent activity log entries."""
    with _lock:
        return JSONResponse(_activities[:50])


@app.get("/api/bounties")
def get_bounties():
    """Bounty board data."""
    return JSONResponse(_bounties)


@app.post("/api/service/{service_name}")
def trigger_service(service_name: str):
    """Trigger a service (sentiment, report, signal, code)."""
    valid = {"sentiment_report", "market_report", "trade_signal", "code_generation"}
    if service_name not in valid:
        return JSONResponse({"error": f"Unknown service: {service_name}"}, status_code=400)

    _add_activity("decision", f"📋 Service requested: {service_name}")

    # Execute the service tool directly
    try:
        if service_name == "sentiment_report":
            from agent.tools.sentiment import analyze_sentiment
            result = analyze_sentiment(token="SOL")
        elif service_name == "market_report":
            from agent.tools.report import generate_report
            result = generate_report(token="SOL")
        elif service_name == "trade_signal":
            from agent.tools.trade_signal import generate_trade_signal
            result = generate_trade_signal(token="SOL")
        elif service_name == "code_generation":
            from agent.tools.code_gen import generate_code
            result = generate_code(prompt="Write a Solana token transfer function", language="python")
        else:
            result = {"error": "Unknown service"}

        if not result.get("error"):
            price = result.get("price_sol", 0)
            _state["total_earned"] += price
            _state["wallet_balance"] += price
            _state["tx_count"] += 1
            _add_activity("earn", f"💰 Service completed: {service_name} — earned {price} SOL")

        return JSONResponse({"status": "completed", "result": result})

    except Exception as e:
        _add_activity("system", f"⚠️ Service error: {str(e)[:100]}")
        return JSONResponse({"status": "error", "error": str(e)}, status_code=500)


# ── Main ─────────────────────────────────────────────────────────────────────

def start_server(port: int = 8000):
    """Start the API server with the agent loop in background."""
    import uvicorn

    # Start agent in background thread
    agent_thread = threading.Thread(target=_agent_loop, daemon=True)
    agent_thread.start()

    print(f"\n🤖 Nomad AI API starting on http://localhost:{port}")
    print(f"   Dashboard: http://localhost:5173")
    print(f"   Status:    http://localhost:{port}/api/status\n")

    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Nomad AI API Server")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    start_server(args.port)
