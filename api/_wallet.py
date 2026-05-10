"""Shared wallet helper for Vercel serverless functions."""
import os
import json
import base58
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import transfer, TransferParams
from solders.transaction import Transaction
from solders.hash import Hash
from solana.rpc.api import Client

SOLANA_RPC = os.environ.get("SOLANA_RPC_URL", "https://api.devnet.solana.com")
NETWORK = os.environ.get("SOLANA_NETWORK", "devnet")
TREASURY = os.environ.get("PROGRAM_ID", "Cm9ugYjV24DuiizVUNvAtKoQfq2fZRNqMtLWTezFoDSP")

def get_keypair():
    pk = os.environ.get("WALLET_PRIVATE_KEY", "")
    if not pk:
        raise ValueError("WALLET_PRIVATE_KEY not set")
    return Keypair.from_bytes(base58.b58decode(pk))

def get_client():
    return Client(SOLANA_RPC)

def get_balance(address_str):
    client = get_client()
    resp = client.get_balance(Pubkey.from_string(address_str))
    return resp.value / 1e9

def send_sol(keypair, to_address, amount_sol):
    client = get_client()
    lamports = int(amount_sol * 1e9)
    to_pubkey = Pubkey.from_string(to_address)
    blockhash_resp = client.get_latest_blockhash()
    blockhash = blockhash_resp.value.blockhash
    
    ix = transfer(TransferParams(
        from_pubkey=keypair.pubkey(),
        to_pubkey=to_pubkey,
        lamports=lamports,
    ))
    tx = Transaction.new_signed_with_payer(
        [ix],
        keypair.pubkey(),
        [keypair],
        blockhash,
    )
    result = client.send_transaction(tx)
    return str(result.value)

def json_response(data, status=200):
    """Create a JSON response compatible with Vercel Python runtime."""
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "body": json.dumps(data),
    }
