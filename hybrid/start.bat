@echo off
title Micro-Account Smarter Launcher
setlocal ENABLEDELAYEDEXPANSION

:: 0. สร้าง Shortcut บน Desktop (ถ้ายังไม่มี)
if not exist "%USERPROFILE%\Desktop\Micro Account.lnk" (
    echo [System] Creating Desktop shortcut...
    powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut(\"$HOME\Desktop\Micro Account.lnk\"); $Shortcut.TargetPath = '%~dp0start.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = 'shell32.dll,147'; $Shortcut.Save()"
)

:: 1. ตรวจสอบเวอร์ชัน Python
echo [System] Checking Python version...
python --version > python_ver.txt 2>&1
set /p PY_VER=<python_ver.txt
del python_ver.txt

echo [System] Found: %PY_VER%

:: ตรวจสอบว่าเป็น Python 3.10 ขึ้นไปหรือไม่ (ตัวอย่างการตรวจสอบอย่างง่าย)
python -c "import sys; exit(0 if sys.version_info >= (3, 10) else 1)"
if %errorlevel% neq 0 (
    echo [WARNING] เวอร์ชัน Python เก่าเกินไป (ต้องการ 3.10+) 
    echo [System] พยายามอัปเดต pip และตรวจสอบชุดเครื่องมือ...
    python -m pip install --upgrade pip
)

:: 2. จัดการ venv
if not exist "venv" (
    echo [System] Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate
    echo [System] Installing/Updating required libraries...
    pip install nicegui sqlalchemy passlib python-multipart
) else (
    call venv\Scripts\activate
    :: ตรวจสอบและติดตั้ง library ที่อาจจะขาดหายไป
    echo [System] Checking for missing libraries...
    pip install nicegui sqlalchemy passlib python-multipart
)

:: 3. รันแอป
echo [System] Launching Micro-Account Application...
python pure_app.py
pause
