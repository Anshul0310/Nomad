"""
Nomad AI — Wallet Manager
Generate, load, and manage Nomad AI's Solana keypair.
This is Nomad's identity on-chain — the keys to its financial autonomy.
"""
import json
import os
import logging
from pathlib import Path
from typing import Optional

from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solana.rpc.api import Client
from solana.rpc.commitment import Confirmed

from .config import config

logger = logging.getLogger("nomad.wallet")


class NomadWallet:
    """
    Manages Nomad AI's Solana keypair.

    The AI is the sole owner of this wallet. No human holds the private key.
    All earnings flow in, all expenses flow out — autonomously.
    """

    def __init__(self, keypair_path: Optional[str] = None):
        self._keypair_path = keypair_path or config.keypair_path
        self._keypair: Optional[Keypair] = None
        self._client = Client(config.rpc_url)

    @property
    def keypair(self) -> Keypair:
        """Get the loaded keypair, raising if not yet loaded."""
        if self._keypair is None:
            raise RuntimeError(
                "Wallet not initialized. Call load() or generate() first."
            )
        return self._keypair

    @property
    def public_key(self) -> Pubkey:
        """The AI's public key (wallet address)."""
        return self.keypair.pubkey()

    @property
    def public_key_str(self) -> str:
        """The AI's wallet address as a base58 string."""
        return str(self.public_key)

    # ── Lifecycle ────────────────────────────────────────────

    def generate(self, overwrite: bool = False) -> "NomadWallet":
        """
        Generate a brand new Solana keypair for the AI.
        This is the AI's birth — it gets its own identity.

        Args:
            overwrite: If True, replace an existing keypair file.

        Returns:
            self (for chaining)
        """
        path = Path(self._keypair_path)

        if path.exists() and not overwrite:
            raise FileExistsError(
                f"Keypair already exists at {path}. "
                "Use overwrite=True to replace it (WARNING: funds will be lost!)."
            )

        self._keypair = Keypair()

        # Save as JSON array of bytes (Solana CLI compatible format)
        secret_bytes = list(bytes(self._keypair))
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(secret_bytes, f)

        logger.info(f"🔑 New keypair generated. Address: {self.public_key_str}")
        logger.info(f"📁 Saved to: {path.absolute()}")
        return self

    def load(self) -> "NomadWallet":
        """
        Load an existing keypair from disk.

        Returns:
            self (for chaining)
        """
        path = Path(self._keypair_path)

        if not path.exists():
            raise FileNotFoundError(
                f"No keypair found at {path}. Call generate() first."
            )

        with open(path, "r") as f:
            secret_bytes = json.load(f)

        self._keypair = Keypair.from_bytes(bytes(secret_bytes))
        logger.info(f"🔑 Keypair loaded. Address: {self.public_key_str}")
        return self

    def load_or_generate(self) -> "NomadWallet":
        """Load existing keypair, or generate a new one if none exists."""
        try:
            return self.load()
        except FileNotFoundError:
            logger.info("No existing keypair found. Generating new identity...")
            return self.generate()

    # ── Balance Queries ──────────────────────────────────────

    def get_balance_lamports(self) -> int:
        """Get the wallet's current balance in lamports."""
        resp = self._client.get_balance(self.public_key, commitment=Confirmed)
        return resp.value

    def get_balance_sol(self) -> float:
        """Get the wallet's current balance in SOL."""
        return config.lamports_to_sol(self.get_balance_lamports())

    # ── Display ──────────────────────────────────────────────

    def status(self) -> dict:
        """Get a full status report of the wallet."""
        balance_lamports = self.get_balance_lamports()
        return {
            "address": self.public_key_str,
            "balance_lamports": balance_lamports,
            "balance_sol": config.lamports_to_sol(balance_lamports),
            "network": config.network,
            "keypair_path": str(Path(self._keypair_path).absolute()),
        }

    def __repr__(self) -> str:
        if self._keypair is None:
            return "NomadWallet(not loaded)"
        return f"NomadWallet({self.public_key_str})"


# ── Convenience ──────────────────────────────────────────────

def get_wallet() -> NomadWallet:
    """Get a ready-to-use wallet instance (loads or generates automatically)."""
    return NomadWallet().load_or_generate()
