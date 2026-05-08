"""
Nomad AI — Blockchain Configuration
Central config for all blockchain interactions.
"""
import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()


@dataclass
class BlockchainConfig:
    """Configuration for Nomad AI's blockchain layer."""

    # ── Network ──────────────────────────────────────────────
    # "devnet" | "testnet" | "mainnet-beta"
    network: str = os.getenv("SOLANA_NETWORK", "devnet")

    rpc_url: str = os.getenv(
        "SOLANA_RPC_URL",
        "https://api.devnet.solana.com"
    )

    ws_url: str = os.getenv(
        "SOLANA_WS_URL",
        "wss://api.devnet.solana.com"
    )

    # ── Program ──────────────────────────────────────────────
    program_id: str = os.getenv(
        "PROGRAM_ID",
        "Cm9ugYjV24DuiizVUNvAtKoQfq2fZRNqMtLWTezFoDSP"
    )

    # ── Wallet ───────────────────────────────────────────────
    keypair_path: str = os.getenv(
        "NOMAD_KEYPAIR_PATH",
        "./nomad_keypair.json"
    )

    # ── Treasury Thresholds ──────────────────────────────────
    # 10 SOL in lamports — minimum balance before bounties can be created
    bounty_threshold_lamports: int = int(os.getenv(
        "BOUNTY_THRESHOLD_LAMPORTS",
        str(10 * 10**9)
    ))

    # Daily Akash rent in lamports (~0.5 SOL/day default)
    daily_rent_lamports: int = int(os.getenv(
        "DAILY_RENT_LAMPORTS",
        str(500_000_000)
    ))

    # ── Income Splitting Ratios ──────────────────────────────
    # How incoming payments are allocated
    reserve_ratio: float = float(os.getenv("RESERVE_RATIO", "0.60"))     # 60% → savings
    rent_ratio: float = float(os.getenv("RENT_RATIO", "0.25"))           # 25% → Akash rent
    bounty_ratio: float = float(os.getenv("BOUNTY_RATIO", "0.15"))       # 15% → bounty fund

    # ── Akash Payment ────────────────────────────────────────
    akash_payment_address: str = os.getenv("AKASH_PAYMENT_ADDRESS", "")

    # ── Runway ───────────────────────────────────────────────
    # Minimum days of runway before the AI enters "survival mode"
    min_runway_days: int = int(os.getenv("MIN_RUNWAY_DAYS", "3"))

    @property
    def lamports_per_sol(self) -> int:
        return 10**9

    def sol_to_lamports(self, sol: float) -> int:
        return int(sol * self.lamports_per_sol)

    def lamports_to_sol(self, lamports: int) -> float:
        return lamports / self.lamports_per_sol


# Global config singleton
config = BlockchainConfig()
