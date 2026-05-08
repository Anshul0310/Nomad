"""
Nomad AI — Payment Listener
WebSocket service that watches the AI's wallet for incoming SOL.
"""
import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Callable, Optional, Awaitable

from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from solana.rpc.websocket_api import connect
from solders.pubkey import Pubkey

from .config import config
from .wallet import NomadWallet

logger = logging.getLogger("nomad.listener")

PaymentCallback = Callable[["PaymentEvent"], Awaitable[None]]


@dataclass
class PaymentEvent:
    sender: str
    amount_lamports: int
    amount_sol: float
    signature: str
    timestamp: float
    slot: int

    def to_dict(self) -> dict:
        return self.__dict__


class PaymentListener:
    """Watches AI's wallet via WebSocket. Fires callback on incoming SOL."""

    def __init__(self, wallet: NomadWallet, on_payment: Optional[PaymentCallback] = None):
        self.wallet = wallet
        self._on_payment = on_payment
        self._running = False
        self._last_balance: Optional[int] = None
        self._reconnect_delay = 1
        self._client = AsyncClient(config.rpc_url)

    def on_payment(self, callback: PaymentCallback):
        self._on_payment = callback
        return callback

    async def _resolve_sender(self) -> tuple[str, str]:
        """Get latest tx signature and sender."""
        try:
            resp = await self._client.get_signatures_for_address(
                self.wallet.public_key, limit=1, commitment=Confirmed,
            )
            if not resp.value:
                return "unknown", "unknown"
            sig_info = resp.value[0]
            return str(sig_info.signature), "unknown"
        except Exception:
            return "unknown", "unknown"

    async def _listen_loop(self):
        while self._running:
            try:
                logger.info(f"🔌 Connecting to {config.ws_url}")
                self._last_balance = self.wallet.get_balance_lamports()
                logger.info(f"💰 Balance: {config.lamports_to_sol(self._last_balance)} SOL")

                async with connect(config.ws_url) as ws:
                    await ws.account_subscribe(self.wallet.public_key, commitment=Confirmed, encoding="base64")
                    await ws.recv()  # subscription confirmation
                    logger.info("✅ WebSocket subscription active")
                    self._reconnect_delay = 1

                    async for msg in ws:
                        if not self._running:
                            break
                        try:
                            result = msg[0] if isinstance(msg, list) else msg
                            new_lamports = None
                            if hasattr(result, 'result') and hasattr(result.result, 'value'):
                                new_lamports = result.result.value.lamports

                            if new_lamports and self._last_balance and new_lamports > self._last_balance:
                                amount = new_lamports - self._last_balance
                                logger.info(f"💸 +{config.lamports_to_sol(amount)} SOL received!")
                                sig, sender = await self._resolve_sender()
                                event = PaymentEvent(
                                    sender=sender, amount_lamports=amount,
                                    amount_sol=config.lamports_to_sol(amount),
                                    signature=sig, timestamp=time.time(), slot=0,
                                )
                                if self._on_payment:
                                    await self._on_payment(event)

                            if new_lamports is not None:
                                self._last_balance = new_lamports
                        except Exception as e:
                            logger.error(f"Error processing: {e}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                if not self._running:
                    break
                logger.error(f"Connection lost: {e}. Retry in {self._reconnect_delay}s")
                await asyncio.sleep(self._reconnect_delay)
                self._reconnect_delay = min(self._reconnect_delay * 2, 60)

    async def start(self):
        self._running = True
        logger.info("🚀 Payment listener starting...")
        await self._listen_loop()

    async def stop(self):
        self._running = False
        logger.info("🛑 Payment listener stopping...")
