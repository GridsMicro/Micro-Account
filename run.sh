#!/bin/bash

# ตรวจสอบ Python
if ! command -v python3 &> /dev/null
then
    echo "[ERROR] Python3 is not installed."
    exit 1
fi

# จัดการ Virtual Environment
if [ ! -d "venv" ]; then
    echo "[System] First time setup: Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "[System] Installing requirements..."
    pip install nicegui sqlalchemy
else
    source venv/bin/activate
fi

# รันแอป
echo "[System] Launching Micro-Account..."
python3 pure_app.py
