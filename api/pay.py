"""POST /api/pay — Auto-pay: agent sends SOL to treasury."""
from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            from api._wallet import get_keypair, send_sol, get_balance, TREASURY, NETWORK
            kp = get_keypair()
            balance = get_balance(str(kp.pubkey()))
            
            if balance < 0.002:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "error",
                    "error": f"Insufficient balance: {balance:.4f} SOL",
                }).encode())
                return
            
            sig = send_sol(kp, TREASURY, 0.001)
            new_balance = get_balance(str(kp.pubkey()))
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "success",
                "signature": sig,
                "amount": 0.001,
                "balance": new_balance,
                "network": NETWORK,
            }).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "error": str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
