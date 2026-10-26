"""
==============================================================================
BLOCKIT · STOP PHONE ADDICTION · NATIVE DESKTOP WINDOW LAUNCHER
Launches the blockit reverse-engineered application in a native Windows WebView2 window.
==============================================================================
"""

import os
import sys
import threading
import socket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import webview

DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def find_available_port(start_port=5173):
    """Finds an open localhost port starting from start_port."""
    for port in range(start_port, start_port + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    return start_port

class QuietStaticServer(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Silence HTTP access logs to keep console clean
        pass

def run_http_server(server):
    try:
        server.serve_forever()
    except Exception:
        pass

def main():
    port = find_available_port(5173)
    server = ThreadingHTTPServer(('127.0.0.1', port), QuietStaticServer)
    
    server_thread = threading.Thread(target=run_http_server, args=(server,), daemon=True)
    server_thread.start()

    url = f"http://127.0.0.1:{port}/index.html"
    print(f"[*] blockit web service running on {url}")
    print(f"[*] Opening native desktop window...")

    window = webview.create_window(
        title="blockWho · Zenith Monolith Lockdown (Native Window)",
        url=url,
        width=450,
        height=920,
        resizable=True,
        min_size=(380, 680),
        background_color="#131315"
    )

    webview.start(debug=False)
    server.shutdown()
    print("[*] blockit native window closed.")

if __name__ == '__main__':
    main()
