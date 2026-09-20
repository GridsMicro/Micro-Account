# หลักฐานใบแจ้งยอดบัตร KTC (KTC Platinum Mastercard 4954)

> เก็บเป็นหลักฐานอ้างอิงสำหรับตรวจอัตราแลกเปลี่ยน/ค่าใช้จ่ายจริงในการจัดทำภาษี
> บริษัทไมโครทรอนิก (ไทยแลนด์) จำกัด — คัดลอกจาก `/home/neon13/Documents/` 2026-09-21

| ไฟล์ | วันสรุปยอด | หมายเหตุสำคัญ |
|------|-----------|--------------|
| `202607_statement_4954_1789933091687.pdf` | 18/07/26 | ไม่มี Google/USD — จ่ายรวมก้อน (สรุป -11,059.98) |
| `202608_statement_4954_1788412197997.pdf` | 18/08/26 | **Google Workspace 58,035.03 / USD 1,687.84 (posting 20/7/26)** → ใช้ยืนยัน TC rate 34.385 สำหรับ ก.ค. |
| `202609_statement_4954_1789933567351.pdf` | 18/09/26 | ไม่มี Google/USD — มี INTEREST 834.13 (ดอกเบี้ยจ่ายช้า, หักภาษีไม่ได้) |

## วิธีดึงข้อความจากไฟล์ (ใช้ pdf-tools อันเดิม)

```bash
"~/workspace/services/python/pdf-tools/.venv/bin/python" - <<'PY'
import sys; sys.path.insert(0, "$HOME/workspace/services/python/pdf-tools")
from pdf_toolkit import extract_text_pdfplumber
print(extract_text_pdfplumber("docs/statements/202608_statement_4954_1788412197997.pdf"))
PY
```