#!/bin/bash
echo "🚀 Starting Micro-Account in ONLINE mode..."
echo "1. Starting Python Server..."
source venv/bin/activate
python3 pure_app.py &
PYTHON_PID=$!

echo "2. Creating Public Tunnel using localtunnel..."
echo "=================================================="
echo "    ⚠️ FOR REMOTE TESTERS: Use the URL below ⚠️    "
echo "=================================================="
npx localtunnel --port 8080 --subdomain microtronic-finance

# When localtunnel is closed with Ctrl+C, kill the python server
kill $PYTHON_PID
echo "Server stopped."
