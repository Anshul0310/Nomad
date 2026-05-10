"""POST /api/distribute — Distribute profits to user wallet."""
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            from api._wallet import get_keypair, send_sol, get_balance, NETWORK
            
            query = parse_qs(urlparse(self.path).query)
            user_wallet = query.get("user_wallet", [None])[0]
            
            if not user_wallet:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "error": "user_wallet required"}).encode())
                return
            
            kp = get_keypair()
            balance = get_balance(str(kp.pubkey()))
            
            if balance < 0.01:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "error",
                    "error": f"Insufficient balance: {balance:.4f} SOL. Fund the agent wallet first.",
                }).encode())
                return
            
            user_share = balance * 0.6
            upgrade_share = balance * 0.25
            services_share = balance * 0.15
            send_amount = max(0.001, user_share - 0.002)
            
            sig = send_sol(kp, user_wallet, send_amount)
            new_balance = get_balance(str(kp.pubkey()))
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "success",
                "signature": sig,
                "user_share": send_amount,
                "upgrade_share": upgrade_share,
                "services_share": services_share,
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
