"""
Nomad AI — Treasury Manager
Handles income splitting, runway calculations, and Akash rent payments.
This is the AI's "financial brain" — it decides how to allocate money.
"""
import logging
import time
from dataclasses import dataclass
from typing import Optional

from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import TransferParams, transfer
from solders.message import MessageV0
from solders.transaction import VersionedTransaction
from solana.rpc.api import Client
from solana.rpc.commitment import Confirmed

from .config import config
from .wallet import NomadWallet

logger = logging.getLogger("nomad.treasury")


@dataclass
class FinancialReport:
    """Snapshot of the AI's financial health."""
    balance_sol: float
    balance_lamports: int
    daily_rent_sol: float
    runway_days: float
    reserve_fund_sol: float
    rent_fund_sol: float
    bounty_fund_sol: float
    can_create_bounty: bool
    status: str  # "thriving" | "stable" | "surviving" | "critical"
    timestamp: float

    def to_dict(self) -> dict:
        return self.__dict__


class TreasuryManager:
    """
    Manages the AI's financial autonomy.

    Responsibilities:
    - Split incoming payments into reserves, rent fund, bounty fund
    - Calculate runway (days of server time remaining)
    - Send SOL for Akash rent
    - Determine when bounties can be created
    """

    def __init__(self, wallet: NomadWallet):
        self.wallet = wallet
        self._client = Client(config.rpc_url)

        # Internal accounting (in-memory, reset on restart)
        self._reserve_fund: int = 0     # lamports
        self._rent_fund: int = 0        # lamports
        self._bounty_fund: int = 0      # lamports
        self._total_earned: int = 0
        self._total_spent: int = 0

    # ── Income Splitting ─────────────────────────────────────

    def split_income(self, amount_lamports: int) -> dict:
        """
        Allocate incoming payment across the three funds.
        Returns the split amounts.
        """
        reserve_amount = int(amount_lamports * config.reserve_ratio)
        rent_amount = int(amount_lamports * config.rent_ratio)
        bounty_amount = amount_lamports - reserve_amount - rent_amount  # remainder

        self._reserve_fund += reserve_amount
        self._rent_fund += rent_amount
        self._bounty_fund += bounty_amount
        self._total_earned += amount_lamports

        split = {
            "total_received_sol": config.lamports_to_sol(amount_lamports),
            "reserve_sol": config.lamports_to_sol(reserve_amount),
            "rent_sol": config.lamports_to_sol(rent_amount),
            "bounty_sol": config.lamports_to_sol(bounty_amount),
        }

        logger.info(
            f"💰 Income split: {split['total_received_sol']} SOL → "
            f"Reserve: {split['reserve_sol']}, "
            f"Rent: {split['rent_sol']}, "
            f"Bounty: {split['bounty_sol']}"
        )
        return split

    # ── Runway Calculations ──────────────────────────────────

    def check_runway(self) -> float:
        """
        Calculate how many days the AI can survive.
        Runway = current balance / daily rent cost.
        """
        balance = self.wallet.get_balance_lamports()
        if config.daily_rent_lamports == 0:
            return float('inf')
        return balance / config.daily_rent_lamports

    def get_status(self) -> str:
        """Determine the AI's survival status based on runway."""
        runway = self.check_runway()
        if runway > 30:
            return "thriving"
        elif runway > 7:
            return "stable"
        elif runway > config.min_runway_days:
            return "surviving"
        else:
            return "critical"

    # ── Payments ─────────────────────────────────────────────

    def send_sol(self, destination: str, amount_lamports: int) -> Optional[str]:
        """
        Send SOL from the AI's wallet to a destination address.
        Returns the transaction signature or None on failure.
        """
        try:
            dest_pubkey = Pubkey.from_string(destination)
            ix = transfer(TransferParams(
                from_pubkey=self.wallet.public_key,
                to_pubkey=dest_pubkey,
                lamports=amount_lamports,
            ))

            blockhash_resp = self._client.get_latest_blockhash(commitment=Confirmed)
            blockhash = blockhash_resp.value.blockhash

            msg = MessageV0.try_compile(
                payer=self.wallet.public_key,
                instructions=[ix],
                address_lookup_table_accounts=[],
                recent_blockhash=blockhash,
            )

            tx = VersionedTransaction(msg, [self.wallet.keypair])
            resp = self._client.send_transaction(tx)

            sig = str(resp.value)
            self._total_spent += amount_lamports
            logger.info(f"📤 Sent {config.lamports_to_sol(amount_lamports)} SOL to {destination}. Sig: {sig}")
            return sig

        except Exception as e:
            logger.error(f"❌ Failed to send SOL: {e}")
            return None

    def pay_akash_rent(self) -> Optional[str]:
        """Send daily rent payment to Akash."""
        if not config.akash_payment_address:
            logger.warning("No Akash payment address configured")
            return None

        amount = config.daily_rent_lamports
        balance = self.wallet.get_balance_lamports()

        if balance < amount:
            logger.error(f"💀 Cannot pay rent! Balance: {config.lamports_to_sol(balance)} SOL, Need: {config.lamports_to_sol(amount)} SOL")
            return None

        logger.info(f"🏠 Paying Akash rent: {config.lamports_to_sol(amount)} SOL")
        return self.send_sol(config.akash_payment_address, amount)

    # ── Bounty Threshold ─────────────────────────────────────

    def can_create_bounty(self) -> bool:
        """Check if the AI has enough funds to create a bounty."""
        balance = self.wallet.get_balance_lamports()
        return balance >= config.bounty_threshold_lamports

    # ── Financial Report ─────────────────────────────────────

    def get_financial_report(self) -> FinancialReport:
        """Generate a complete financial health report for the dashboard."""
        balance = self.wallet.get_balance_lamports()
        runway = self.check_runway()

        return FinancialReport(
            balance_sol=config.lamports_to_sol(balance),
            balance_lamports=balance,
            daily_rent_sol=config.lamports_to_sol(config.daily_rent_lamports),
            runway_days=round(runway, 2),
            reserve_fund_sol=config.lamports_to_sol(self._reserve_fund),
            rent_fund_sol=config.lamports_to_sol(self._rent_fund),
            bounty_fund_sol=config.lamports_to_sol(self._bounty_fund),
            can_create_bounty=self.can_create_bounty(),
            status=self.get_status(),
            timestamp=time.time(),
        )
