"""
Solana Wallet — The Sovereign AI's autonomous bank account.

Handles balance checks, sending SOL for compute costs, and monitoring
incoming payments.  Defaults to devnet; call switch_network("mainnet")
in config.py to go live.
"""

from __future__ import annotations

import time
from typing import Optional

from solana.rpc.api import Client
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import TransferParams, transfer
from solders.transaction import Transaction
from solders.message import Message
from solders.hash import Hash

from agent import config

# Lamports in 1 SOL
LAMPORTS_PER_SOL = 1_000_000_000


class SolanaWallet:
    """
    Wrapper around solana-py for the Sovereign AI's wallet.
    
    Usage:
        wallet = SolanaWallet()             # uses config defaults
        balance = wallet.get_balance()       # returns SOL as float
        wallet.send_sol("Addr...", 0.01)     # send 0.01 SOL
    """

    def __init__(self, private_key: Optional[str] = None, rpc_url: Optional[str] = None):
        self.rpc_url = rpc_url or config.SOLANA_RPC_URL
        self.client = Client(self.rpc_url)

        # Load keypair from base58-encoded private key, or generate a new one
        pk = private_key or config.WALLET_PRIVATE_KEY
        if pk:
            try:
                self.keypair = Keypair.from_base58_string(pk)
            except Exception:
                # Fallback: try raw bytes
                import base58
                raw = base58.b58decode(pk)
                self.keypair = Keypair.from_bytes(raw)
        else:
            # Generate a fresh keypair for demo purposes
            self.keypair = Keypair()

        self.public_key = self.keypair.pubkey()
        self._last_balance_check: float = 0.0
        self._cached_balance: float = 0.0

    # ── Properties ───────────────────────────────────────────────────────

    @property
    def address(self) -> str:
        """The public address of this wallet as a string."""
        return str(self.public_key)

    # ── Balance ──────────────────────────────────────────────────────────

    def get_balance(self, force: bool = False) -> float:
        """
        Get the wallet balance in SOL.
        Caches the result for 10 seconds to avoid hammering the RPC.
        """
        now = time.time()
        if not force and (now - self._last_balance_check) < 10:
            return self._cached_balance

        try:
            response = self.client.get_balance(self.public_key)
            lamports = response.value
            self._cached_balance = lamports / LAMPORTS_PER_SOL
            self._last_balance_check = now
            return self._cached_balance
        except Exception as e:
            # Return cached balance if RPC fails
            if self._cached_balance > 0:
                return self._cached_balance
            raise ConnectionError(f"Failed to get balance: {e}") from e

    def get_balance_lamports(self) -> int:
        """Get the wallet balance in lamports."""
        response = self.client.get_balance(self.public_key)
        return response.value

    # ── Send SOL ─────────────────────────────────────────────────────────

    def send_sol(self, to_address: str, amount_sol: float) -> str:
        """
        Send SOL to another address.
        Returns the transaction signature.
        """
        if amount_sol <= 0:
            raise ValueError("Amount must be positive")

        balance = self.get_balance(force=True)
        if balance < amount_sol:
            raise ValueError(
                f"Insufficient balance: {balance:.4f} SOL, need {amount_sol:.4f} SOL"
            )

        to_pubkey = Pubkey.from_string(to_address)
        lamports = int(amount_sol * LAMPORTS_PER_SOL)

        # Build the transfer instruction
        ix = transfer(
            TransferParams(
                from_pubkey=self.public_key,
                to_pubkey=to_pubkey,
                lamports=lamports,
            )
        )

        # Get a recent blockhash
        blockhash_resp = self.client.get_latest_blockhash()
        recent_blockhash = blockhash_resp.value.blockhash

        # Build and sign the transaction using solders
        msg = Message.new_with_blockhash([ix], self.public_key, recent_blockhash)
        txn = Transaction.new_signed_with_payer(
            [ix],
            self.public_key,
            [self.keypair],
            recent_blockhash,
        )

        # Send the signed transaction
        response = self.client.send_raw_transaction(bytes(txn))
        sig = str(response.value)

        # Invalidate balance cache
        self._last_balance_check = 0

        return sig

    # ── Incoming Payments ────────────────────────────────────────────────

    def check_incoming_payments(self, since_minutes: int = 30) -> list[dict]:
        """
        Check for recent incoming transactions.
        Returns a list of incoming transfer dicts.
        """
        try:
            response = self.client.get_signatures_for_address(
                self.public_key, limit=20
            )
            signatures = response.value

            incoming = []
            for sig_info in signatures:
                # Get transaction details
                try:
                    tx_resp = self.client.get_transaction(
                        sig_info.signature,
                        max_supported_transaction_version=0,
                    )
                    if tx_resp.value is None:
                        continue

                    tx = tx_resp.value.transaction
                    meta = tx.meta
                    if meta is None:
                        continue

                    # Check if our wallet received SOL
                    account_keys = tx.transaction.message.account_keys
                    for i, key in enumerate(account_keys):
                        if str(key) == self.address:
                            pre = meta.pre_balances[i]
                            post = meta.post_balances[i]
                            diff = (post - pre) / LAMPORTS_PER_SOL
                            if diff > 0:
                                incoming.append(
                                    {
                                        "amount_sol": diff,
                                        "tx_signature": str(sig_info.signature),
                                        "block_time": sig_info.block_time,
                                    }
                                )
                            break
                except Exception:
                    continue

            return incoming
        except Exception:
            return []

    # ── Network Switching ────────────────────────────────────────────────

    def switch_network(self, network: str) -> None:
        """Switch to a different Solana network (devnet/mainnet)."""
        new_url = config.switch_network(network)
        self.rpc_url = new_url
        self.client = Client(new_url)
        self._last_balance_check = 0  # clear cache

    # ── Devnet Airdrop (for testing) ─────────────────────────────────────

    def request_airdrop(self, amount_sol: float = 1.0) -> str:
        """
        Request a devnet airdrop for testing.
        Only works on devnet!
        """
        if config.SOLANA_NETWORK != "devnet":
            raise RuntimeError("Airdrops only available on devnet")

        lamports = int(amount_sol * LAMPORTS_PER_SOL)
        response = self.client.request_airdrop(self.public_key, lamports)
        self._last_balance_check = 0
        return str(response.value)

    def __repr__(self) -> str:
        return f"SolanaWallet(address={self.address}, network={config.SOLANA_NETWORK})"
