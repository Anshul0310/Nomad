"""POST /api/agent-wallet-send — Send SOL from agent wallet to user."""
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            from api._wallet import get_keypair, send_sol, get_balance, NETWORK
            
            query = parse_qs(urlparse(self.path).query)
            to_address = query.get("to_address", [None])[0]
            amount = float(query.get("amount", [0])[0])
            
            if not to_address:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "error": "to_address required"}).encode())
                return
            
            if amount <= 0:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "error": "amount must be positive"}).encode())
                return
            
            kp = get_keypair()
            balance = get_balance(str(kp.pubkey()))
            
            if balance < amount + 0.001:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "error",
                    "error": f"Insufficient balance: {balance:.4f} SOL (need {amount + 0.001:.4f})",
                    "balance": balance,
                }).encode())
                return
            
            sig = send_sol(kp, to_address, amount)
            new_balance = get_balance(str(kp.pubkey()))
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "success",
                "signature": sig,
                "amount": amount,
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
