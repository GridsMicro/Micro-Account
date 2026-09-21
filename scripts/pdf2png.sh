#!/usr/bin/env bash
# pdf2png.sh — แปลง PDF → PNG (ค่าเริ่มต้น 300 dpi, หน้าแรก)
# ใช้งาน:  bash scripts/pdf2png.sh "path/เอกสาร.pdf" [dpi] [หน้า]
# ตัวอย่าง: bash scripts/pdf2png.sh ~/Downloads/receipt.pdf 300
set -euo pipefail

SRC="${1:?ERROR: ใส่ไฟล์ PDF ก่อน เช่น  bash scripts/pdf2png.sh receipt.pdf}"
DPI="${2:-300}"
PAGE="${3:-1}"
BASE="${SRC%.pdf}"

pdftoppm -png -r "$DPI" -f "$PAGE" -l "$PAGE" "$SRC" "$BASE"
echo "OK: แปลงเรียบร้อย -> ${BASE}-${PAGE}.png (dpi=${DPI})"