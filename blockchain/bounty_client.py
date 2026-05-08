"""
Nomad AI — Bounty Client
Python client to interact with the on-chain Bounty smart contract.
Uses anchorpy to call the Anchor program directly.
"""
import logging
from typing import Optional
from dataclasses import dataclass

from solders.pubkey import Pubkey
from solders.system_program import ID as SYSTEM_PROGRAM_ID
from solana.rpc.api import Client
from solana.rpc.commitment import Confirmed

from .config import config
from .wallet import NomadWallet

logger = logging.getLogger("nomad.bounty")


@dataclass
class BountyInfo:
    """Represents a bounty fetched from on-chain."""
    bounty_id: int
    title: str
    description: str
    reward_lamports: int
    reward_sol: float
    status: str
    hunter: Optional[str]
    created_at: int
    address: str

    def to_dict(self) -> dict:
        return self.__dict__


class BountyClient:
    """
    Client for the Nomad Treasury's bounty system.
    Interacts with the Anchor program to create, claim, and complete bounties.
    """

    def __init__(self, wallet: NomadWallet):
        self.wallet = wallet
        self._client = Client(config.rpc_url)
        self._program_id = Pubkey.from_string(config.program_id)

    # ── PDA Derivation ───────────────────────────────────────

    def get_treasury_pda(self) -> tuple[Pubkey, int]:
        """Derive the treasury PDA address."""
        return Pubkey.find_program_address(
            [b"treasury", bytes(self.wallet.public_key)],
            self._program_id,
        )

    def get_bounty_pda(self, treasury_pubkey: Pubkey, bounty_id: int) -> tuple[Pubkey, int]:
        """Derive a bounty PDA address."""
        return Pubkey.find_program_address(
            [
                b"bounty",
                bytes(treasury_pubkey),
                bounty_id.to_bytes(8, "little"),
            ],
            self._program_id,
        )

    # ── Read Operations ──────────────────────────────────────

    def get_treasury_address(self) -> str:
        """Get the treasury PDA address as a string."""
        pda, _ = self.get_treasury_pda()
        return str(pda)

    def get_bounty_address(self, bounty_id: int) -> str:
        """Get a bounty PDA address as a string."""
        treasury_pda, _ = self.get_treasury_pda()
        pda, _ = self.get_bounty_pda(treasury_pda, bounty_id)
        return str(pda)

    # ── Convenience Methods (for agent brain) ────────────────

    def should_create_bounty(self, balance_lamports: int) -> bool:
        """Check if conditions are met to create a bounty."""
        return balance_lamports >= config.bounty_threshold_lamports

    def suggest_bounty_reward(self, balance_lamports: int) -> int:
        """
        Suggest a reasonable bounty reward based on current balance.
        Uses 5% of balance above threshold, capped at 2 SOL.
        """
        excess = balance_lamports - config.bounty_threshold_lamports
        if excess <= 0:
            return 0
        suggested = int(excess * 0.05)
        max_reward = config.sol_to_lamports(2.0)  # Cap at 2 SOL
        return min(suggested, max_reward)

    def format_bounty_for_display(self, bounty: BountyInfo) -> str:
        """Format a bounty for display in the dashboard or logs."""
        status_emoji = {
            "Open": "🟢", "Claimed": "🟡",
            "Completed": "✅", "Cancelled": "❌"
        }
        emoji = status_emoji.get(bounty.status, "❓")
        return (
            f"{emoji} Bounty #{bounty.bounty_id}: {bounty.title}\n"
            f"   Reward: {bounty.reward_sol} SOL | Status: {bounty.status}\n"
            f"   {bounty.description[:80]}..."
        )

    # ── Status ───────────────────────────────────────────────

    def status(self) -> dict:
        """Get bounty system status."""
        treasury_pda, _ = self.get_treasury_pda()
        return {
            "program_id": str(self._program_id),
            "treasury_pda": str(treasury_pda),
            "network": config.network,
            "bounty_threshold_sol": config.lamports_to_sol(config.bounty_threshold_lamports),
        }
