"""GET /api/status — Agent status endpoint."""
from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            from api._wallet import get_keypair, get_balance, NETWORK, TREASURY
            kp = get_keypair()
            balance = get_balance(str(kp.pubkey()))
            data = {
                "status": "running",
                "wallet_balance": balance,
                "wallet_address": str(kp.pubkey()),
                "network": NETWORK,
                "treasury": TREASURY,
                "cycle": 1,
                "tx_count": 0,
                "health_score": min(100, max(0, int(balance * 33))),
                "current_task": "Monitoring wallet activity",
                "total_earned": balance,
                "total_spent": 0,
            }
        except Exception as e:
            data = {"status": "error", "error": str(e)}
        
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
