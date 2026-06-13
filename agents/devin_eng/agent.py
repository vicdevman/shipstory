# CWD: /shipstory/agents/devin_eng/agent.py
from http.server import HTTPServer, BaseHTTPRequestHandler
from shared.state_manager import StateManager

class AgentServer(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        # Responds back with JSON (like res.json() in Express)
        self.wfile.write(b'{"status": "Devin agent is active and running"}')

def run():
    # Load shared environment keys
    manager = StateManager()
    print(f"Loaded BAND_API_KEY: {manager.get_api_key()}")
    
    # Start server on Port 8000 (like app.listen(8000) in Express)
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, AgentServer)
    print("Devin Agent listening on http://localhost:8000 ... (Press Ctrl+C to stop)")
    httpd.serve_forever()

if __name__ == "__main__":
    run()
