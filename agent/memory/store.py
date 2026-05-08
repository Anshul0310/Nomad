"""
Memory Store — SQLite-backed persistent memory for the Sovereign AI.

Stores past tasks, decisions, and outcomes so the agent can learn from 
its own history and avoid repeating failures.
"""

import json
import sqlite3
import time
from typing import Optional

from agent import config


class MemoryStore:
    """Persistent memory backed by a local SQLite database."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or config.MEMORY_DB_PATH
        self._init_db()

    # ── Database Setup ───────────────────────────────────────────────────

    def _init_db(self) -> None:
        """Create tables if they don't exist."""
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS tasks (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_type   TEXT NOT NULL,
                    input_data  TEXT,
                    output_data TEXT,
                    outcome     TEXT NOT NULL DEFAULT 'pending',
                    earnings    REAL DEFAULT 0.0,
                    duration_s  REAL DEFAULT 0.0,
                    error_msg   TEXT,
                    created_at  REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS decisions (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    context_summary TEXT,
                    chosen_action   TEXT NOT NULL,
                    reasoning       TEXT,
                    wallet_balance  REAL DEFAULT 0.0,
                    runway_hours    REAL DEFAULT 0.0,
                    created_at      REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS earnings_log (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    amount_sol  REAL NOT NULL,
                    source      TEXT,
                    tx_hash     TEXT,
                    created_at  REAL NOT NULL
                );
                """
            )

    def _connect(self) -> sqlite3.Connection:
        """Get a database connection with row factory."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    # ── Task Memory ──────────────────────────────────────────────────────

    def save_task(
        self,
        task_type: str,
        input_data: dict,
        output_data: dict,
        outcome: str,
        earnings: float = 0.0,
        duration_s: float = 0.0,
        error_msg: str = "",
    ) -> int:
        """Save a completed task to memory. Returns the task ID."""
        with self._connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO tasks (task_type, input_data, output_data, outcome, 
                                   earnings, duration_s, error_msg, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    task_type,
                    json.dumps(input_data),
                    json.dumps(output_data),
                    outcome,
                    earnings,
                    duration_s,
                    error_msg,
                    time.time(),
                ),
            )
            return cursor.lastrowid

    def get_recent_tasks(self, n: int = 10) -> list[dict]:
        """Get the N most recent tasks from memory."""
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?", (n,)
            ).fetchall()
            return [dict(row) for row in rows]

    def get_failed_tasks(self, n: int = 5) -> list[dict]:
        """Get recent failed tasks so the agent can learn from mistakes."""
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM tasks WHERE outcome = 'failure' ORDER BY created_at DESC LIMIT ?",
                (n,),
            ).fetchall()
            return [dict(row) for row in rows]

    def get_successful_tasks(self, n: int = 5) -> list[dict]:
        """Get recent successful tasks to reinforce good strategies."""
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM tasks WHERE outcome = 'success' ORDER BY created_at DESC LIMIT ?",
                (n,),
            ).fetchall()
            return [dict(row) for row in rows]

    # ── Decision Memory ──────────────────────────────────────────────────

    def save_decision(
        self,
        chosen_action: str,
        reasoning: str,
        context_summary: str = "",
        wallet_balance: float = 0.0,
        runway_hours: float = 0.0,
    ) -> int:
        """Save a decision the agent made."""
        with self._connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO decisions (context_summary, chosen_action, reasoning,
                                       wallet_balance, runway_hours, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    context_summary,
                    chosen_action,
                    reasoning,
                    wallet_balance,
                    runway_hours,
                    time.time(),
                ),
            )
            return cursor.lastrowid

    # ── Earnings ─────────────────────────────────────────────────────────

    def log_earning(
        self, amount_sol: float, source: str = "", tx_hash: str = ""
    ) -> None:
        """Log an incoming payment."""
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO earnings_log (amount_sol, source, tx_hash, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (amount_sol, source, tx_hash, time.time()),
            )

    def get_earnings_summary(self) -> dict:
        """Get a summary of total earnings."""
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT 
                    COALESCE(SUM(amount_sol), 0) as total_earned,
                    COUNT(*) as total_transactions,
                    COALESCE(AVG(amount_sol), 0) as avg_earning
                FROM earnings_log
                """
            ).fetchone()
            return dict(row) if row else {"total_earned": 0, "total_transactions": 0, "avg_earning": 0}

    # ── Context Builder ──────────────────────────────────────────────────

    def build_memory_context(self) -> list[dict]:
        """
        Build the memory context that gets injected into the Think node.
        Returns a list of summarized past experiences.
        """
        recent = self.get_recent_tasks(config.MEMORY_CONTEXT_WINDOW)
        failures = self.get_failed_tasks(3)
        earnings = self.get_earnings_summary()

        context = []

        if recent:
            context.append(
                {
                    "type": "recent_tasks",
                    "summary": f"Last {len(recent)} tasks",
                    "tasks": [
                        {
                            "type": t["task_type"],
                            "outcome": t["outcome"],
                            "earnings": t["earnings"],
                        }
                        for t in recent
                    ],
                }
            )

        if failures:
            context.append(
                {
                    "type": "recent_failures",
                    "summary": f"{len(failures)} recent failures to avoid",
                    "tasks": [
                        {
                            "type": t["task_type"],
                            "error": t["error_msg"],
                        }
                        for t in failures
                    ],
                }
            )

        context.append(
            {
                "type": "earnings_summary",
                "summary": f"Total earned: {earnings['total_earned']:.4f} SOL across {earnings['total_transactions']} txns",
                "data": earnings,
            }
        )

        return context
