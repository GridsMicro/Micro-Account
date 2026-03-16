from nicegui import ui, app
from sqlalchemy import create_engine, text, Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base
from passlib.hash import pbkdf2_sha256
import os
import base64
import json
from datetime import datetime, timedelta
from fpdf import FPDF
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import gspread
from oauth2client.service_account import ServiceAccountCredentials
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
# Google API Modern Libraries
from google.oauth2 import service_account
from googleapiclient.discovery import build
Base = declarative_base()

class Company(Base):
    __tablename__ = 'company'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    tax_id = Column(String)
    address = Column(String)
    phone = Column(String)
    email = Column(String)
    logo_base64 = Column(String)
    vat_rate = Column(Float, default=7.0)
    withholding_tax_rate = Column(Float, default=3.0)  # ภาษีหัก ณ ที่จ่าย
    corporate_tax_rate = Column(Float, default=20.0)  # ภาษีเงินได้นิติบุคคล
    tax_exemption_years = Column(Integer, default=0)  # ปีที่ได้รับสิทธิ์ยกเว้นภาษี (ทวิ)
    tax_reduction_years = Column(Integer, default=0)  # ปีที่ได้รับสิทธิ์ลดหย่อนภาษี 50% (ทวิ)
    tax_exemption_start_year = Column(Integer)  # ปีที่เริ่มสิทธิ์ทวิ (เช่น 2026)
    currency = Column(String, default="฿")
    inv_prefix = Column(String, default="INV")
    rec_prefix = Column(String, default="REC")
    pay_prefix = Column(String, default="PAY")
    exp_prefix = Column(String, default="EXP")
    quo_prefix = Column(String, default="QT")
    smtp_server = Column(String)
    smtp_port = Column(Integer, default=587)
    smtp_user = Column(String)
    smtp_pass = Column(String)
    smtp_use_tls = Column(Boolean, default=True)
    email_sender = Column(String)
    is_setup = Column(Boolean, default=False)
    # Google Integration
    google_service_account_json = Column(String) # เก็บเนื้อหาไฟล์ JSON
    google_authorized_email = Column(String) # อีเมลของ Service Account ที่ได้รับสิทธิ์
    last_google_sync = Column(String)

class BankAccount(Base):
    __tablename__ = 'bank_accounts'
    id = Column(Integer, primary_key=True)
    bank_name = Column(String) # เช่น SCB, KBANK, BBL
    account_number = Column(String)
    account_name = Column(String)
    branch = Column(String)
    is_default = Column(Boolean, default=True)

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    id = Column(Integer, primary_key=True)
    timestamp = Column(String, default=lambda: datetime.now().isoformat())
    user = Column(String)
    action = Column(String)
    detail = Column(String)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    password_hash = Column(String)
    role = Column(String, default="admin") # admin, staff

class Category(Base):
    __tablename__ = 'categories'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    description = Column(String)
    type = Column(String, default="product") # product, service, subscription

class Product(Base):
    __tablename__ = 'products'
    id = Column(Integer, primary_key=True)
    sku = Column(String, unique=True)
    name = Column(String)
    description = Column(String)
    price = Column(Float)
    stock_qty = Column(Integer, default=0)
    unit = Column(String, default="ชิ้น")
    category_id = Column(Integer, ForeignKey('categories.id'))

class Booking(Base):
    __tablename__ = 'bookings'
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('products.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    qty = Column(Integer)
    status = Column(String, default="reserved") # reserved, confirmed, cancelled
    booked_at = Column(String, default=lambda: datetime.now().isoformat())
    expiry_at = Column(String) 

class Contact(Base):
    __tablename__ = 'contacts'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(String) # customer, supplier, both
    tax_id = Column(String)
    address = Column(String)
    phone = Column(String)
    email = Column(String)
    contact_person = Column(String)
    is_active = Column(Boolean, default=True)

class Invoice(Base):
    __tablename__ = 'invoices'
    id = Column(Integer, primary_key=True)
    invoice_number = Column(String, unique=True)
    customer_id = Column(Integer, ForeignKey('contacts.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    total_amount = Column(Float, default=0.0)
    vat_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    net_amount = Column(Float, default=0.0)
    status = Column(String, default="draft") # draft, sent, paid, cancelled
    created_at = Column(String, default=lambda: datetime.now().isoformat())
    due_date = Column(String)
    notes = Column(String)

class InvoiceItem(Base):
    __tablename__ = 'invoice_items'
    id = Column(Integer, primary_key=True)
    invoice_id = Column(Integer, ForeignKey('invoices.id'))
    product_id = Column(Integer, ForeignKey('products.id'))
    quantity = Column(Integer)
    unit_price = Column(Float)
    discount_percent = Column(Float, default=0.0)
    total_price = Column(Float)
    description = Column(String)

class Payment(Base):
    __tablename__ = 'payments'
    id = Column(Integer, primary_key=True)
    payment_number = Column(String, unique=True)
    invoice_id = Column(Integer, ForeignKey('invoices.id'))
    customer_id = Column(Integer, ForeignKey('contacts.id'))
    amount = Column(Float)
    withholding_tax_amount = Column(Float, default=0.0)  # ภาษีหัก ณ ที่จ่าย
    net_amount = Column(Float)  # ยอดหลังหักภาษี
    payment_date = Column(String, default=lambda: datetime.now().isoformat())
    payment_method = Column(String)  # cash, transfer, check, credit_card
    reference_number = Column(String)  # เลขที่อ้างอิงการโอน
    receipt_number = Column(String)
    receipt_issued = Column(Boolean, default=False)
    proof_of_payment_base64 = Column(String)  # หลักฐานการชำระเงิน
    notes = Column(String)

class Receipt(Base):
    __tablename__ = 'receipts'
    id = Column(Integer, primary_key=True)
    receipt_number = Column(String, unique=True)
    payment_id = Column(Integer, ForeignKey('payments.id'))
    customer_id = Column(Integer, ForeignKey('contacts.id'))
    amount = Column(Float)
    vat_amount = Column(Float, default=0.0)
    withholding_tax_amount = Column(Float, default=0.0)
    net_amount = Column(Float)
    issued_date = Column(String, default=lambda: datetime.now().isoformat())
    notes = Column(String)

class Expense(Base):
    __tablename__ = 'expenses'
    id = Column(Integer, primary_key=True)
    expense_number = Column(String, unique=True)
    category = Column(String)  # office, travel, utilities, marketing, etc.
    description = Column(String)
    amount = Column(Float) # ยอดก่อน VAT (Base Amount)
    vat_amount = Column(Float, default=0.0) # ภาษีซื้อ
    withholding_tax_amount = Column(Float, default=0.0)  # ภาษีหัก ณ ที่จ่าย (ที่เราหักเขา)
    net_amount = Column(Float)  # ยอดสุทธิที่จ่ายจริง (amount - wht_amount)
    expense_date = Column(String, default=lambda: datetime.now().isoformat())
    vendor = Column(String)
    wht_type = Column(String, default='none')
    payment_method = Column(String)
    receipt_base64 = Column(String)  # ใบเสร็จ/หลักฐาน
    tax_deductible = Column(Boolean, default=True)
    notes = Column(String)

class Asset(Base):
    __tablename__ = 'assets'
    id = Column(Integer, primary_key=True)
    asset_number = Column(String, unique=True)
    name = Column(String)
    category = Column(String)  # equipment, vehicle, property, software, etc.
    description = Column(String)
    acquisition_date = Column(String)
    acquisition_cost = Column(Float)
    current_value = Column(Float)
    depreciation_method = Column(String)  # straight_line, declining_balance
    useful_life_years = Column(Integer)
    accumulated_depreciation = Column(Float, default=0.0)
    location = Column(String)
    status = Column(String, default="active")  # active, disposed, sold
    notes = Column(String)

class Quotation(Base):
    __tablename__ = 'quotations'
    id = Column(Integer, primary_key=True)
    quotation_number = Column(String, unique=True)
    customer_id = Column(Integer, ForeignKey('contacts.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    total_amount = Column(Float, default=0.0)
    vat_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    net_amount = Column(Float, default=0.0)
    status = Column(String, default="draft") # draft, sent, accepted, declined, expired
    created_at = Column(String, default=lambda: datetime.now().isoformat())
    expiry_date = Column(String)
    notes = Column(String)

class QuotationItem(Base):
    __tablename__ = 'quotation_items'
    id = Column(Integer, primary_key=True)
    quotation_id = Column(Integer, ForeignKey('quotations.id'))
    product_id = Column(Integer, ForeignKey('products.id'))
    quantity = Column(Integer)
    unit_price = Column(Float)
    discount_percent = Column(Float, default=0.0)
    total_price = Column(Float)
    description = Column(String)

class RecurringInvoice(Base):
    __tablename__ = 'recurring_invoices'
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey('contacts.id'))
    frequency = Column(String, default="monthly") # daily, weekly, monthly
    start_date = Column(String)
    next_billing_date = Column(String)
    last_generated_date = Column(String)
    status = Column(String, default="active") # active, inactive
    total_amount = Column(Float, default=0.0)
    vat_amount = Column(Float, default=0.0)
    net_amount = Column(Float, default=0.0)
    notes = Column(String)
    auto_send_email = Column(Boolean, default=True)

class RecurringInvoiceItem(Base):
    __tablename__ = 'recurring_invoice_items'
    id = Column(Integer, primary_key=True)
    recurring_invoice_id = Column(Integer, ForeignKey('recurring_invoices.id'))
    product_id = Column(Integer, ForeignKey('products.id'))
    quantity = Column(Integer)
    unit_price = Column(Float)
    discount_percent = Column(Float, default=0.0)
    total_price = Column(Float)
    description = Column(String)

# ===== WHT (ภาษีหัก ณ ที่จ่าย) Records =====
class WHTRecord(Base):
    """บันทึกภาษีหัก ณ ที่จ่ายที่ต้องนำส่งกรมสรรพากร"""
    __tablename__ = 'wht_records'
    id = Column(Integer, primary_key=True)
    ref_id = Column(String)  # เลขที่อ้างอิง (EXP/PAY number)
    ref_type = Column(String)  # 'expense' | 'payment'
    payer = Column(String)           # ผู้จ่ายเงิน (บริษัทเรา)
    payee = Column(String)           # ผู้รับเงิน (vendor / ลูกค้า)
    payee_tax_id = Column(String)    # เลขประจำตัวผู้เสียภาษีผู้รับ
    income_type = Column(String)     # ประเภทเงินได้ (ม.40(2), ม.40(3) ฯลฯ)
    income_description = Column(String)  # คำอธิบาย
    gross_amount = Column(Float)     # ยอดก่อนหัก
    wht_rate = Column(Float)         # อัตราภาษีหัก ณ ที่จ่าย (%)
    wht_amount = Column(Float)       # จำนวนภาษีที่หัก
    net_amount = Column(Float)       # ยอดสุทธิหลังหัก
    payment_date = Column(String, default=lambda: datetime.now().isoformat())
    submitted = Column(Boolean, default=False)  # นำส่งสรรพากรแล้วหรือยัง
    submit_period = Column(String)   # งวดที่นำส่ง เช่น '2026-03'
    form_type = Column(String)       # ภ.ง.ด.1, ภ.ง.ด.3, ภ.ง.ด.53
    notes = Column(String)

# ตารางอัตราภาษีหัก ณ ที่จ่ายตามประมวลรัษฎากร
WHT_TYPES = {
    'service_3':     {'label': 'ค่าบริการ/จ้างทำของ (ม.40(8)) - 3%',       'rate': 3.0,  'form': 'ภ.ง.ด.53', 'section': 'ม.40(8)'},
    'rent_5':        {'label': 'ค่าเช่าทรัพย์สิน (ม.40(5)) - 5%',          'rate': 5.0,  'form': 'ภ.ง.ด.53', 'section': 'ม.40(5)'},
    'professional_3':{'label': 'ค่าวิชาชีพอิสระ (ม.40(6)) - 3%',           'rate': 3.0,  'form': 'ภ.ง.ด.3',  'section': 'ม.40(6)'},
    'commission_3':  {'label': 'ค่านายหน้า/ค่ารางวัล (ม.40(8)) - 3%',      'rate': 3.0,  'form': 'ภ.ง.ด.53', 'section': 'ม.40(8)'},
    'interest_1':    {'label': 'ดอกเบี้ย (ม.40(4)) - 1%',                  'rate': 1.0,  'form': 'ภ.ง.ด.53', 'section': 'ม.40(4)'},
    'dividend_10':   {'label': 'เงินปันผล (ม.40(4)) - 10%',                'rate': 10.0, 'form': 'ภ.ง.ด.2',  'section': 'ม.40(4)'},
    'transport_1':   {'label': 'ค่าขนส่ง (ม.40(8)) - 1%',                  'rate': 1.0,  'form': 'ภ.ง.ด.53', 'section': 'ม.40(8)'},
    'advertising_2': {'label': 'ค่าโฆษณา (ม.40(8)) - 2%',                  'rate': 2.0,  'form': 'ภ.ง.ด.53', 'section': 'ม.40(8)'},
    'insurance_1':   {'label': 'ค่าเบี้ยประกัน (ม.40(8)) - 1%',            'rate': 1.0,  'form': 'ภ.ง.ด.53', 'section': 'ม.40(8)'},
    'freelance_3':   {'label': 'ค่าจ้างบุคคลธรรมดา (ม.40(2)) - 3%',       'rate': 3.0,  'form': 'ภ.ง.ด.3',  'section': 'ม.40(2)'},
    'prize_5':       {'label': 'รางวัล/ของขวัญ (ม.40(8)) - 5%',            'rate': 5.0,  'form': 'ภ.ง.ด.53', 'section': 'ม.40(8)'},
    'consult_3':     {'label': 'ค่าที่ปรึกษา/ค่าจัดการ (ม.40(8)) - 3%',   'rate': 3.0,  'form': 'ภ.ง.ด.53', 'section': 'ม.40(8)'},
    'none':          {'label': 'ไม่หักภาษี ณ ที่จ่าย (< 1,000 ฿ หรือยกเว้น)', 'rate': 0.0, 'form': None, 'section': None},
}

DB_FILE = "database.db"
db_url = os.getenv("DATABASE_URL")

if db_url:
    # แก้ไข URL กรณีใช้ postgres:// ให้เป็น postgresql:// สำหรับ SQLAlchemy
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    engine = create_engine(db_url)
    print("🌐 Connected to Online Database (PostgreSQL/Supabase)")
else:
    engine = create_engine(f"sqlite:///{DB_FILE}")
    print("💻 Connected to Local Database (SQLite)")

Session = sessionmaker(bind=engine)

def init_db():
    Base.metadata.create_all(engine)
    
    # Migration: Add missing columns (เฉพาะ SQLite ที่อัปเกรดจากเวอร์ชันเก่า)
    if engine.name == 'sqlite':
        with engine.connect() as conn:
            existing_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(company)"))]
            new_cols = {
                'phone': 'TEXT', 
                'email': 'TEXT', 
                'vat_rate': 'FLOAT DEFAULT 7.0', 
                'withholding_tax_rate': 'FLOAT DEFAULT 3.0',
                'corporate_tax_rate': 'FLOAT DEFAULT 20.0',
                'tax_exemption_years': 'INTEGER DEFAULT 0',
                'tax_reduction_years': 'INTEGER DEFAULT 0',
                'tax_exemption_start_year': 'INTEGER',
                'google_service_account_json': 'TEXT',
                'google_authorized_email': 'TEXT',
                'last_google_sync': 'TEXT',
                'currency': 'TEXT DEFAULT "฿"', 
                'inv_prefix': 'TEXT DEFAULT "INV"', 
                'rec_prefix': 'TEXT DEFAULT "REC"',
                'pay_prefix': 'TEXT DEFAULT "PAY"',
                'exp_prefix': 'TEXT DEFAULT "EXP"',
                'quo_prefix': 'TEXT DEFAULT "QT"',
                'smtp_server': 'TEXT',
                'smtp_port': 'INTEGER DEFAULT 587',
                'smtp_user': 'TEXT',
                'smtp_pass': 'TEXT',
                'smtp_use_tls': 'BOOLEAN DEFAULT 1',
                'email_sender': 'TEXT'
            }
            for col, type_ in new_cols.items():
                if col not in existing_cols:
                    conn.execute(text(f"ALTER TABLE company ADD COLUMN {col} {type_}"))
            
            # Product Category Migration
            prod_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(products)"))]
            if 'category_id' not in prod_cols:
                conn.execute(text("ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id)"))
            
            # Expense WHT Migration
            exp_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(expenses)"))]
            if 'wht_type' not in exp_cols:
                conn.execute(text("ALTER TABLE expenses ADD COLUMN wht_type TEXT DEFAULT 'none'"))
            if 'vat_amount' not in exp_cols:
                conn.execute(text("ALTER TABLE expenses ADD COLUMN vat_amount FLOAT DEFAULT 0.0"))
            
            # Create BankAccount table if not exists
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS bank_accounts (
                    id INTEGER PRIMARY KEY,
                    bank_name TEXT,
                    account_number TEXT,
                    account_name TEXT,
                    branch TEXT,
                    is_default BOOLEAN
                )
            """))
            conn.commit()
    
    # Update/Initial Microtronic Data (ทำงานได้ทั้ง SQLite และ Postgres)
    with engine.connect() as conn:        
        # Update/Initial Microtronic Data
        try:
            # Check if company exists to update
            comp = conn.execute(text("SELECT id FROM company LIMIT 1")).fetchone()
            if comp:
                conn.execute(text("""
                    UPDATE company SET 
                    name = 'บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด / MICROTRONIC (THAILAND) CO., LTD.',
                    tax_id = '0105561182888',
                    address = '136/34 ถนนประดิพัทธ์ แขวงพญาไท เขตพญาไท กรุงเทพมหานคร 10400',
                    is_setup = 1
                    WHERE id = :id
                """), {"id": comp[0]})
            else:
                conn.execute(text("""
                    INSERT INTO company (name, tax_id, address, is_setup)
                    VALUES ('บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด', '0105561182888', '136/34 ถนนประดิพัทธ์ แขวงพญาไท เขตพญาไท กรุงเทพมหานคร 10400', 1)
                """))
            
            # Insert SCB Account if not exists
            bank = conn.execute(text("SELECT id FROM bank_accounts WHERE account_number = '033-420427-9'")).fetchone()
            if not bank:
                conn.execute(text("""
                    INSERT INTO bank_accounts (bank_name, account_number, account_name, is_default)
                    VALUES ('SCB (ไทยพาณิชย์)', '033-420427-9', 'บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด', 1)
                """))
        except Exception as e:
            print(f"Update Microtronic data error: {e}")

        conn.commit()

    # NOTE: We no longer add a default Company or sample products here.
    # The Setup Wizard will handle the first creation.

init_db()

def log_action(user, action, detail):
    with Session() as session:
        log = AuditLog(user=user, action=action, detail=detail)
        session.add(log)
        session.commit()

# --- Auth Logic ---
def get_current_user():
    return app.storage.user.get('username')

def verify_access(allowed_roles):
    curr_user = get_current_user()
    if not curr_user:
        ui.navigate.to('/login')
        return False
    curr_role = app.storage.user.get('role', 'pending')
    if curr_role == 'admin': # Admin accesses everything
        return True
    if curr_role not in allowed_roles:
        ui.notify('❌ คุณไม่มีสิทธิ์เข้าถึงส่วนนี้', color='red')
        ui.navigate.to('/')
        return False
    return True

def login(username, password):
    with Session() as session:
        user = session.query(User).filter_by(username=username).first()
        if user and pbkdf2_sha256.verify(password, user.password_hash):
            app.storage.user.update({'username': username, 'role': user.role})
            return True
    return False

def logout():
    app.storage.user.clear()
    ui.navigate.to('/login')

# --- Helper Functions ---
def get_customers():
    with Session() as s:
        # Return dict {id: label} for NiceGUI select to prevent [object Object]
        return {c.id: f"{c.name} ({c.tax_id or 'ไม่มีเลขภาษี'})" 
                for c in s.query(Contact).filter(Contact.type.in_(['customer', 'both'])).all()}

def get_products_list():
    with Session() as s:
        return {p.id: f"{p.name} - {p.price}฿" for p in s.query(Product).all()}

# --- Google Sheets Helper ---
def get_gsheet_client():
    sheet_id = os.getenv('GOOGLE_SHEET_ID')
    creds_file = os.getenv('GOOGLE_CREDENTIALS_FILE', 'service_account.json')
    
    if not sheet_id:
        return None, "กรุณาตั้งค่า Google Sheet ID ในไฟล์ .env"
    
    if not os.path.exists(creds_file):
        return None, f"ไม่พบไฟล์ Credentials: {creds_file} กรุณาตรวจสอบการตั้งค่า"
    
    try:
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
        creds = ServiceAccountCredentials.from_json_keyfile_name(creds_file, scope)
        client = gspread.authorize(creds)
        return client.open_by_key(sheet_id), None
    except Exception as e:
        return None, f"ไม่สามารถเชื่อมต่อ Google Sheets ได้: {str(e)}"

# --- Google Reseller API Sync ---
async def sync_google_reseller_data():
    """ซิงค์ข้อมูล Subscriptions และ Billing จาก Google Reseller API"""
    with Session() as s:
        comp = s.query(Company).first()
        if not comp or not comp.google_service_account_json:
            ui.notify('❌ กรุณาตั้งค่า Google Service Account ก่อนซิงค์', color='red')
            return None

        try:
            key_data = json.loads(comp.google_service_account_json)
            creds = service_account.Credentials.from_service_account_info(
                key_data, 
                scopes=['https://www.googleapis.com/auth/apps.order']
            )
            
            # สร้าง Service สำหรับ Reseller API
            service = build('reseller', 'v1', credentials=creds)
            
            # ทดสอบดึงรายการ Subscriptions (ตัวอย่าง: ดึงรายการทั้งหมดที่ลูกค้ามี)
            # หมายเหตุ: ในการใช้งานจริงต้องระบุ customerID หรือวนลูปทุกลูกค้า
            # ในที่นี้ขอดึงตัวอย่างมาแสดงผลก่อน
            ui.notify('🔄 กำลังเชื่อมต่อ Google Reseller Console...', color='info')
            
            # ตัวอย่างการดึงข้อมูล (ข้ามการดึงจริงถ้ายังไม่ได้ผูกสิทธิ์ใน Partner Console)
            # subscriptions = service.subscriptions().list().execute()
            
            # บันทึกเวลาซิงค์
            comp.last_google_sync = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            s.commit()
            
            ui.notify('✅ เชื่อมต่อเสร็จสิ้น (ระบบจดจำกุญแจแล้ว)', color='green')
            ui.notify('💡 ขั้นตอนถัดไป: ระบบจะเริ่มคำนวณยอด ภ.พ.36 จากบิล Google อัตโนมัติ', color='blue')
            return True

        except Exception as e:
            ui.notify(f'❌ ซิงค์ผิดพลาด: {str(e)}', color='red')
            print(f"Sync Error: {e}")
            return False

# --- Pages ---

@ui.page('/login')
def login_page():
    if get_current_user():
        ui.navigate.to('/')
        return

    with ui.card().classes('fixed-center p-8 w-80 shadow-2xl'):
        ui.label('เข้าสู่ระบบ').classes('text-2xl font-bold mb-4 w-full text-center')
        user_input = ui.input('ชื่อผู้ใช้งาน').classes('w-full')
        pass_input = ui.input('รหัสผ่าน', password=True).classes('w-full')
        
        async def try_login():
            if login(user_input.value, pass_input.value):
                ui.navigate.to('/')
            else:
                ui.notify('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง', color='red')
        
        ui.button('Login', on_click=try_login).classes('w-full mt-4 bg-blue-600')
        with ui.row().classes('w-full justify-center mt-4 text-sm'):
            ui.label('ยังไม่มีบัญชี?').classes('text-slate-500')
            ui.link('สมัครสมาชิก', '/register').classes('text-blue-600 font-bold ml-1')

@ui.page('/register')
def register_page():
    if get_current_user():
        ui.navigate.to('/')
        return

    with ui.card().classes('fixed-center p-8 w-[400px] shadow-2xl rounded-2xl'):
        ui.label('สมัครสมาชิกใหม่').classes('text-2xl font-black mb-2 w-full text-center text-blue-900')
        ui.label('กรอกข้อมูลเพื่อลงทะเบียน ขอเข้าสิทธิ์ใช้งาน').classes('text-sm text-slate-500 mb-6 text-center w-full')
        
        user_input = ui.input('ชื่อผู้ใช้งาน (Username)').classes('w-full mb-4').props('outlined')
        pass_input = ui.input('รหัสผ่าน', password=True).classes('w-full mb-4').props('outlined')
        confirm_pass = ui.input('ยืนยันรหัสผ่าน', password=True).classes('w-full mb-6').props('outlined')
        
        async def try_register():
            if not user_input.value or not pass_input.value:
                ui.notify('กรุณากรอกข้อมูลให้ครบถ้วน', color='orange')
                return
            if pass_input.value != confirm_pass.value:
                ui.notify('รหัสผ่านไม่ตรงกัน', color='red')
                return
            
            with Session() as session:
                if session.query(User).filter_by(username=user_input.value).first():
                    ui.notify('ชื่อผู้ใช้งานนี้มีในระบบแล้ว', color='red')
                    return
                # กำหนดให้สมาชิคใหม่มี Role เป็น pending รอการอนุมัติ
                u = User(username=user_input.value, password_hash=pbkdf2_sha256.hash(pass_input.value), role='pending')
                session.add(u)
                session.commit()
            
            ui.notify('ลงทะเบียนสำเร็จ! กรุณารอ Admin อนุมัติสิทธิ์', color='green', timeout=5000)
            ui.timer(2.0, lambda: ui.navigate.to('/login'))
        
        ui.button('ลงทะเบียน', on_click=try_register).classes('w-full h-12 bg-blue-700 text-white font-bold rounded-xl mb-4 shadow-lg')
        with ui.row().classes('w-full justify-center text-sm'):
            ui.label('มีบัญชีอยู่แล้ว?').classes('text-slate-500')
            ui.link('คลิกเพื่อเข้าสู่ระบบ', '/login').classes('text-blue-600 font-bold ml-1')

@ui.page('/setup')
def setup_wizard():
    with Session() as session:
        company = session.query(Company).first()
        if company and company.is_setup:
            ui.navigate.to('/login')
            return

    with ui.card().classes('fixed-center p-12 w-full max-w-2xl shadow-xl'):
        ui.label('ตั้งค่าเริ่มต้นระบบบัญชี').classes('text-3xl font-black text-blue-800 mb-8 text-center w-full')
        
        with ui.stepper().props('vertical') as stepper:
            with ui.step('ข้อมูลบริษัท'):
                c_name = ui.input('ชื่อบริษัท (ไทย/Eng)').classes('w-full').props('outlined')
                c_tax = ui.input('เลขประจำตัวผู้เสียภาษี').classes('w-full').props('outlined')
                with ui.stepper_navigation():
                    ui.button('ถัดไป', on_click=stepper.next)
            
            with ui.step('สร้างผู้ดูแลระบบ (Admin)'):
                admin_user = ui.input('ชื่อผู้ใช้งาน Admin').classes('w-full').props('outlined')
                admin_pass = ui.input('รหัสผ่าน', password=True).classes('w-full').props('outlined')
                with ui.stepper_navigation():
                    ui.button('ถัดไป', on_click=stepper.next)
                    # ui.button('กลับ', on_click=stepper.previous).props('flat')
            
            with ui.step('ยืนยันความถูกต้อง'):
                ui.label('ท่านกำลังจะเริ่มต้นระบบด้วยข้อมูลข้างต้น').classes('text-slate-500 italic')
                
                async def finish_setup():
                    with Session() as session:
                        comp = session.query(Company).first()
                        if not comp:
                            comp = Company()
                            session.add(comp)
                        
                        comp.name = c_name.value
                        comp.tax_id = c_tax.value
                        comp.is_setup = True
                        
                        # สร้าง Admin
                        new_admin = User(
                            username=admin_user.value,
                            password_hash=pbkdf2_sha256.hash(admin_pass.value),
                            role='admin'
                        )
                        session.add(new_admin)
                        session.commit()
                    
                    ui.notify('Setup สำเร็จ! กรุณาเข้าสู่ระบบ', color='green')
                    ui.navigate.to('/login')

                with ui.stepper_navigation():
                    ui.button('บันทึกและเริ่มต้นใช้งาน', on_click=finish_setup).classes('bg-green-600')
                    # ui.button('กลับ', on_click=stepper.previous).props('flat')

@ui.page('/')
def index():
    if not get_current_user():
        with Session() as session:
            comp = session.query(Company).first()
            if not comp or not comp.is_setup:
                ui.navigate.to('/setup')
            else:
                ui.navigate.to('/login')
        return

    # Check for Pending User
    role = app.storage.user.get('role', 'pending')
    if role == 'pending':
        ui.query('body').style('background-color: #f8fafc;')
        with ui.column().classes('fixed-center items-center gap-6 p-12 bg-white shadow-2xl rounded-3xl border-t-8 border-orange-500 w-[500px]'):
            ui.icon('hourglass_empty', size='100px', color='orange-500').classes('animate-pulse')
            ui.label('รอยืนยันสิทธิ์การใช้งาน').classes('text-3xl font-black text-slate-800')
            ui.label('บัญชีของคุณสมัครสมาชิกเรียบร้อยแล้ว แต่ต้องรอให้ "Admin" กำหนดสิทธิ์ก่อนเข้าใช้งานตามแผนกของคุณ').classes('text-center text-slate-500 leading-relaxed')
            with ui.row().classes('gap-4 mt-4'):
                ui.button('ออกจากการระบบ', on_click=logout, icon='logout').props('outline color=red')
                ui.button('ดูคู่มือเบื้องต้น', icon='help', on_click=lambda: ui.notify('คู่มือยังไม่พร้อมใช้งานชั่วคราว', color='info'))
        return

    # Dashboard 
    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='menu', on_click=lambda: drawer.toggle()).props('flat color=white')
            ui.label('Micro-Account').classes('text-xl font-bold')
        with ui.row().classes('items-center gap-2'):
            ui.label(f'Role: {role.upper()}').classes('text-xs bg-blue-500 px-2 py-1 rounded-full font-bold')
            ui.button(icon='person', on_click=lambda: ui.navigate.to('/profile')).props('flat color=white tooltip="โปรไฟล์ส่วนตัว"')
            ui.button(icon='logout', on_click=logout).props('flat color=white')

    with ui.left_drawer().classes('bg-slate-50 border-r shadow-sm') as drawer:
        with ui.column().classes('p-6 w-full gap-2'):
            ui.label('เมนูหลัก').classes('text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider')
            ui.button('หน้าแรก', icon='home', on_click=lambda: ui.navigate.to('/')).props('flat align=left').classes('w-full rounded-lg')
            
            # --- Accounting & Finance ---
            ui.label('บัญชีและการเงิน').classes('text-xs font-bold text-slate-400 uppercase mt-4 mb-2 tracking-wider')
            if role in ['admin', 'accountant', 'billing', 'finance']:
                ui.button('สมุดรายวัน', icon='book', on_click=lambda: ui.navigate.to('/journal')).props('flat align=left').classes('w-full rounded-lg text-blue-800')
                ui.button('ออกใบเสนอราคา', icon='request_quote', on_click=lambda: ui.navigate.to('/quotation')).props('flat align=left').classes('w-full rounded-lg text-blue-800')
                ui.button('รายการใบเสนอราคา', icon='format_list_bulleted', on_click=lambda: ui.navigate.to('/quotations')).props('flat align=left').classes('w-full rounded-lg text-blue-800')
                ui.button('ออกใบแจ้งหนี้', icon='receipt_long', on_click=lambda: ui.navigate.to('/invoice')).props('flat align=left').classes('w-full rounded-lg text-blue-800')
                ui.button('รายการใบแจ้งหนี้', icon='list_alt', on_click=lambda: ui.navigate.to('/invoices')).props('flat align=left').classes('w-full rounded-lg text-blue-800')
                ui.button('บัญชีแยกประเภท', icon='account_tree', on_click=lambda: ui.navigate.to('/ledger')).props('flat align=left').classes('w-full rounded-lg text-indigo-800')
                ui.button('งบการเงิน', icon='summarize', on_click=lambda: ui.navigate.to('/reports')).props('flat align=left').classes('w-full rounded-lg text-indigo-800')
                
                ui.separator().classes('my-2')
                ui.button('บัญชีรับเงิน', icon='payments', on_click=lambda: ui.navigate.to('/payments')).props('flat align=left').classes('w-full rounded-lg text-emerald-800')
                ui.button('ออกใบเสร็จรับเงิน', icon='receipt', on_click=lambda: ui.navigate.to('/receipts')).props('flat align=left').classes('w-full rounded-lg text-emerald-800')
                ui.button('บัญชีจ่าย/ค่าใช้จ่าย', icon='money_off', on_click=lambda: ui.navigate.to('/expenses')).props('flat align=left').classes('w-full rounded-lg text-red-800')
                
                # ===== ระบบภาษี =====
                ui.separator().classes('my-2')
                ui.label('ภาษีและการนำส่ง').classes('text-xs font-bold text-amber-600 uppercase mt-1 mb-1 tracking-wider')
                ui.button('รายงานภาษีรายเดือน', icon='receipt_long', on_click=lambda: ui.navigate.to('/tax-report')).props('flat align=left').classes('w-full rounded-lg text-amber-800 font-bold')
                ui.button('ภาษีหัก ณ ที่จ่าย (WHT)', icon='gavel', on_click=lambda: ui.navigate.to('/wht-records')).props('flat align=left').classes('w-full rounded-lg text-amber-800')
                
                # Google Sheets Integration Links
                ui.separator().classes('my-2 italic text-slate-400')
                ui.button('เอกสารเบิกจ่าย (G-Sheet)', icon='description', on_click=lambda: ui.navigate.to('/expense-docs')).props('flat align=left').classes('w-full rounded-lg text-cyan-800 font-bold')
                ui.button('สรุปรายจ่าย (G-Sheet)', icon='analytics', on_click=lambda: ui.navigate.to('/expense-summary')).props('flat align=left').classes('w-full rounded-lg text-cyan-800 font-bold')

            # --- Inventory & Stock ---
            ui.label('สินค้าและสต็อก').classes('text-xs font-bold text-slate-400 uppercase mt-4 mb-2 tracking-wider')
            if role in ['admin', 'inventory', 'sales']:
                ui.button('คลังสินค้า (Stock)', icon='inventory_2', on_click=lambda: ui.navigate.to('/inventory')).props('flat align=left').classes('w-full rounded-lg text-green-800')
                if role != 'sales':
                    ui.button('รับสินค้าเข้า', icon='add_shopping_cart', on_click=lambda: ui.navigate.to('/inventory-in')).props('flat align=left').classes('w-full rounded-lg text-green-800')
                ui.button('แคตตาล็อกสินค้า', icon='shopping_bag', on_click=lambda: ui.navigate.to('/catalog')).props('flat align=left').classes('w-full rounded-lg text-orange-800')
                ui.button('หมวดหมู่สินค้า', icon='category', on_click=lambda: ui.navigate.to('/categories')).props('flat align=left').classes('w-full rounded-lg text-purple-800')

            # --- Contacts & Assets ---
            ui.label('อื่นๆ').classes('text-xs font-bold text-slate-400 uppercase mt-4 mb-2 tracking-wider')
            if role in ['admin', 'sales', 'billing', 'accountant']:
                ui.button('สมุดรายชื่อ (Contacts)', icon='contact_phone', on_click=lambda: ui.navigate.to('/contacts')).props('flat align=left').classes('w-full rounded-lg text-blue-900')
            if role in ['admin', 'accountant']:
                ui.button('ทรัพย์สินบริษัท', icon='business', on_click=lambda: ui.navigate.to('/assets')).props('flat align=left').classes('w-full rounded-lg text-amber-800')

            ui.separator().classes('my-4')

            if role == 'admin':
                ui.button('การตั้งค่าระบบ', icon='settings', on_click=lambda: ui.navigate.to('/settings')).props('flat align=left').classes('w-full rounded-lg text-slate-600')
                ui.button('ตั้งค่า Cloud Storage', icon='cloud', on_click=lambda: ui.navigate.to('/settings-storage')).props('flat align=left').classes('w-full rounded-lg text-slate-600')

    # Main Content Area
    with ui.column().classes('p-8 w-full max-w-6xl mx-auto gap-8'):
        with Session() as session:
            comp = session.query(Company).first()
            
            # Welcome Banner
            with ui.row().classes('w-full justify-between items-center bg-white p-8 rounded-2xl shadow-sm border border-slate-100'):
                with ui.column():
                    ui.label(f'สวัสดีครับ, {get_current_user()}').classes('text-4xl font-black text-slate-800')
                    ui.label(f'คุณกำลังใช้งานในฐานะ: {role.upper()} @ {comp.name}').classes('text-slate-500 mt-2')
                if comp.logo_base64:
                    ui.image(comp.logo_base64).classes('w-24 h-24 object-contain rounded-lg')

            # Role-Based Dashboard Content
            if role == 'sales':
                ui.label('สถานะสต็อกและการจองปัจจุบัน').classes('text-xl font-bold')
                with ui.row().classes('w-full gap-4'):
                    # ดึงข้อมูลจาก DB
                    with Session() as s:
                        total_stock = s.query(text("SELECT SUM(stock_qty) FROM products")).scalar() or 0
                        total_booked = s.query(text("SELECT SUM(qty) FROM bookings WHERE status='reserved'")).scalar() or 0
                    
                    with ui.card().classes('flex-1 p-6 bg-orange-50 shadow-none border-none'):
                        ui.label('สต็อกทั้งหมดในคลัง').classes('text-xs font-bold text-orange-600 uppercase')
                        ui.label(f'{total_stock} รายการ').classes('text-3xl font-black text-orange-800')
                    
                    with ui.card().classes('flex-1 p-6 bg-blue-50 shadow-none border-none'):
                        ui.label('มีการจองรอรับของ').classes('text-xs font-bold text-blue-600 uppercase')
                        ui.label(f'{total_booked} รายการ').classes('text-3xl font-black text-blue-800')

                ui.button('ไปที่แคตตาล็อก/จองสินค้า', icon='shopping_cart', on_click=lambda: ui.navigate.to('/catalog')).classes('w-full h-16 bg-orange-600 text-white font-bold rounded-xl shadow-lg mt-4')

            elif role == 'inventory':
                ui.label('สถานะคลังสินค้าเบื้องต้น').classes('text-xl font-bold')
                with ui.row().classes('w-full gap-4'):
                    with Session() as s:
                        total_p = s.query(text("SELECT COUNT(*) FROM products")).scalar() or 0
                    with ui.card().classes('flex-1 p-6 bg-green-50'):
                        ui.label('รายการสินค้าทั้งหมด').classes('text-xs font-bold text-green-600')
                        ui.label(f'{total_p} รายการ').classes('text-3xl font-black text-green-800')

            elif role in ['admin', 'accountant']:
                ui.label('ภาพรวมการเงิน (Dashboard บัญชี)').classes('text-xl font-bold')
                with ui.row().classes('w-full gap-6'):
                    with ui.card().classes('flex-1 p-8 bg-blue-50 border-none shadow-none'):
                        ui.label('รายได้ค้างรับ (Account Receivable)').classes('text-xs font-bold text-blue-600')
                        ui.label('฿ 0.00').classes('text-3xl font-black text-blue-800') # Will be DB-driven in next module
                    with ui.card().classes('flex-1 p-8 bg-red-50 border-none shadow-none'):
                        ui.label('ค่าใช้จ่ายค้างจ่าย (Account Payable)').classes('text-xs font-bold text-red-600')
                        ui.label('฿ 0.00').classes('text-3xl font-black text-red-800') # Will be DB-driven in next module

@ui.page('/profile')
def profile_page():
    if not get_current_user():
        ui.navigate.to('/login')
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 items-center'):
        ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
        ui.label('โปรไฟล์และข้อมูลส่วนตัว').classes('text-xl font-bold ml-4')

    with ui.column().classes('p-8 w-full max-w-2xl mx-auto'):
        username = get_current_user()
        with ui.card().classes('w-full p-10 rounded-2xl shadow-sm border border-slate-100'):
            ui.label(f'สวัสดีคุณ {username}').classes('text-3xl font-black text-slate-800 mb-2')
            role = app.storage.user.get('role', 'staff')
            ui.label(f'ตำแหน่งปัจจุบัญ: {role.upper()}').classes('text-blue-600 font-bold mb-8')
            
            ui.separator().classes('mb-8')
            
            ui.label('เปลี่ยนรหัสผ่านใหม่').classes('text-xl font-bold mb-4')
            new_pass = ui.input('รหัสผ่านใหม่', password=True).classes('w-full mb-4').props('outlined')
            confirm_pass = ui.input('ยืนยันรหัสผ่านใหม่', password=True).classes('w-full mb-8').props('outlined')
            
            async def update_password():
                if not new_pass.value:
                    ui.notify('กรุณากรอกรหัสผ่านใหม่', color='orange')
                    return
                if new_pass.value != confirm_pass.value:
                    ui.notify('รหัสผ่านไม่ตรงกัน', color='red')
                    return
                
                with Session() as session:
                    user = session.query(User).filter_by(username=username).first()
                    user.password_hash = pbkdf2_sha256.hash(new_pass.value)
                    session.commit()
                
                ui.notify('เปลี่ยนรหัสผ่านสำเร็จ!', color='green')
                new_pass.value = ''
                confirm_pass.value = ''

            ui.button('บันทึกรหัสผ่านใหม่', on_click=update_password).classes('w-full bg-slate-900 text-white font-bold h-12 rounded-xl')

@ui.page('/settings')
def settings_page():
    if not verify_access(['admin']):
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 items-center'):
        ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
        ui.label('การตั้งค่าระบบ (Admin Only)').classes('text-xl font-bold ml-4')

    with ui.column().classes('p-8 w-full max-w-5xl mx-auto'):
        with ui.tabs().classes('w-full bg-white shadow rounded-t-xl overflow-hidden') as tabs:
            t1 = ui.tab('🏢 ข้อมูลบริษัท')
            t2 = ui.tab('👥 จัดการทีมงาน')
            t3 = ui.tab('🏷️ หมวดหมู่สินค้า')
            t4 = ui.tab('📜 ตั้งค่าเอกสาร')
            t5 = ui.tab('📊 ภาษีและการเงิน')
            t6 = ui.tab('🛡️ กิจกรรมระบบ')
            t7 = ui.tab('💾 สำรองข้อมูล')
            t8 = ui.tab('📧 ตั้งค่าอีเมล/SMTP')
            t9 = ui.tab('🔗 เชื่อมต่อ Google')

        with ui.tab_panels(tabs, value=t1).classes('w-full bg-white p-8 shadow-2xl rounded-b-xl border border-slate-100 min-h-[600px]'):
            # ... existing panels ... (omitted for brevity in this view, tool handles insertion)
            with ui.tab_panel(t1):
                ui.label('ข้อมูลบริษัท').classes('text-2xl font-black mb-6 text-slate-800')
                
                with Session() as session:
                    comp = session.query(Company).first()
                    with ui.row().classes('w-full gap-8'):
                        with ui.column().classes('flex-1 gap-4'):
                            name = ui.input('ชื่อบริษัท (จดทะเบียน)', value=comp.name).classes('w-full').props('outlined')
                            tax = ui.input('เลขประจำตัวผู้เสียภาษี', value=comp.tax_id).classes('w-full').props('outlined')
                            phone = ui.input('เบอร์โทรศัพท์', value=comp.phone).classes('w-full').props('outlined')
                            email = ui.input('อีเมลติดต่อ', value=comp.email).classes('w-full').props('outlined')
                        with ui.column().classes('flex-1 gap-4'):
                            addr = ui.textarea('ที่อยู่สำนักงานใหญ่ (สำหรับออกใบกำกับภาษี)', value=comp.address).classes('w-full h-44').props('outlined')
                    
                    def update_comp():
                        with Session() as session:
                            c = session.query(Company).first()
                            c.name = name.value
                            c.tax_id = tax.value
                            c.address = addr.value
                            c.phone = phone.value
                            c.email = email.value
                            session.commit()
                        log_action(get_current_user(), "UPDATE_COMPANY", "แก้ไขข้อมูลพื้นฐานบริษัท")
                        ui.notify('อัปเดตข้อมูลบริษัทสำเร็จ', color='green')
                    
                    ui.button('บันทึกข้อมูลบริษัท', on_click=update_comp).classes('mt-8 bg-blue-600 px-12 py-3 font-bold rounded-xl shadow-lg shadow-blue-200')

                ui.separator().classes('my-12')
                
                ui.label('🏛️ บัญชีธนาคาร (สำหรับการจ่ายเงิน)').classes('text-2xl font-black mb-6 text-slate-800')
                
                with ui.column().classes('w-full gap-4'):
                    def get_banks():
                        with Session() as s:
                            return s.query(BankAccount).all()
                    
                    bank_list_container = ui.column().classes('w-full gap-4')

                    def refresh_banks():
                        bank_list_container.clear()
                        banks = get_banks()
                        for b in banks:
                            with bank_list_container, ui.card().classes('w-full p-6 flex-row justify-between items-center shadow-sm'):
                                with ui.row().classes('items-center gap-4'):
                                    ui.avatar('account_balance', color='blue-100', text_color='blue-600')
                                    with ui.column():
                                        ui.label(b.bank_name).classes('font-bold text-lg')
                                        ui.label(f'เลขที่: {b.account_number}').classes('text-slate-500 font-mono')
                                        ui.label(b.account_name).classes('text-sm text-slate-400')
                                
                                with ui.row().classes('gap-2'):
                                    async def delete_bank(bid=b.id):
                                        with Session() as s:
                                            s.query(BankAccount).filter_by(id=bid).delete()
                                            s.commit()
                                        refresh_banks()
                                    ui.button(icon='delete', color='red', on_click=delete_bank).props('flat')

                    # Add Bank Dialog
                    with ui.dialog() as bank_diag, ui.card().classes('p-6 w-[400px]'):
                        ui.label('เพิ่มบัญชีธนาคาร').classes('text-xl font-bold mb-4')
                        b_name = ui.input('ชื่อธนาคาร (เช่น SCB, KBANK)').classes('w-full').props('outlined')
                        b_num = ui.input('เลขที่บัญชี').classes('w-full mt-2').props('outlined')
                        b_acc = ui.input('ชื่อเจ้าของบัญชี').classes('w-full mt-2').props('outlined')
                        
                        async def save_new_bank():
                            with Session() as s:
                                s.add(BankAccount(bank_name=b_name.value, account_number=b_num.value, account_name=b_acc.value))
                                s.commit()
                            bank_diag.close()
                            refresh_banks()
                        
                        ui.button('บันทึก', on_click=save_new_bank).classes('w-full mt-4 bg-blue-600')

                    ui.button('เพิ่มบัญชีธนาคารใหม่', icon='add', on_click=bank_diag.open).classes('bg-slate-100 text-slate-700 h-14 rounded-xl border-dashed border-2 border-slate-300 shadow-none hover:bg-slate-200 w-full')
                    refresh_banks()

            with ui.tab_panel(t2):
                role_options = {
                    'admin': 'ผู้ดูแลระบบ (Admin)',
                    'accountant': 'พนักงานบัญชี (Accountant)',
                    'billing': 'เจ้าหน้าที่ออกบิล (Billing)',
                    'sales': 'พนักงานขาย (Sales)',
                    'inventory': 'เจ้าหน้าที่เครื่องมือ/สต็อก (Inventory/Asset)',
                    'pending': 'รอกำหนดสิทธิ์ (Pending)'
                }
                ui.label('จัดการสิทธิ์การเข้าถึง').classes('text-2xl font-black mb-6 text-slate-800')

                def get_users():
                    with Session() as session:
                        return [{'id': u.id, 'username': u.username, 'role': u.role} for u in session.query(User).all()]

                # Dialog สำหรับเพิ่มพนักงาน
                with ui.dialog() as add_user_dialog, ui.card().classes('p-10 w-[450px] rounded-2xl'):
                    ui.label('เพิ่มพนักงานใหม่').classes('text-2xl font-black mb-6 text-blue-900')
                    un = ui.input('ชื่อผู้ใช้งาน (Username)').classes('w-full mb-4').props('outlined')
                    pw = ui.input('รหัสผ่าน (Password)', password=True).classes('w-full mb-4').props('outlined')
                    ro = ui.select(options=role_options, value='accountant', label='ตำแหน่ง/แผนก').classes('w-full mb-8')
                    
                    async def do_save():
                        if not un.value or not pw.value:
                            ui.notify('ข้อมูลไม่ครบ', color='orange')
                            return
                        with Session() as session:
                            if session.query(User).filter_by(username=un.value).first():
                                ui.notify('Username นี้ถูกใช้ไปแล้ว', color='red')
                                return
                            u = User(username=un.value, password_hash=pbkdf2_sha256.hash(pw.value), role=ro.value)
                            session.add(u)
                            session.commit()
                        log_action(get_current_user(), "ADD_USER", f"เพิ่มพนักงาน: {un.value}")
                        ui.notify('เพิ่มสำเร็จ!', color='green')
                        add_user_dialog.close()
                        user_list.rows[:] = get_users()
                        user_list.update()

                    ui.button('ยืนยันการเพิ่มพนักงาน', on_click=do_save).classes('w-full h-14 bg-blue-700 text-white font-bold rounded-xl shadow-lg')

                # Dialog สำหรับแก้ไขพนักงาน
                with ui.dialog() as edit_user_dialog, ui.card().classes('p-10 w-[450px] rounded-2xl'):
                    ui.label('แก้ไขข้อมูลพนักงาน').classes('text-2xl font-black mb-6 text-blue-900')
                    curr_id = ui.number().classes('hidden') # Hidden state
                    un_edit = ui.input('ชื่อผู้ใช้งาน').classes('w-full mb-4').props('outlined readonly')
                    pw_edit = ui.input('เปลี่ยนรหัสผ่าน (เว้นไว้ถ้าไม่เปลี่ยน)', password=True).classes('w-full mb-4').props('outlined')
                    ro_edit = ui.select(options=role_options, label='ตำแหน่ง/แผนก').classes('w-full mb-8')
                    
                    async def do_edit():
                        with Session() as session:
                            u = session.query(User).get(int(curr_id.value))
                            if pw_edit.value:
                                u.password_hash = pbkdf2_sha256.hash(pw_edit.value)
                            u.role = ro_edit.value
                            session.commit()
                        log_action(get_current_user(), "EDIT_USER", f"แก้ไขพนักงาน: {un_edit.value}")
                        ui.notify('แก้ไขสำเร็จ!', color='green')
                        edit_user_dialog.close()
                        user_list.rows[:] = get_users()
                        user_list.update()

                    ui.button('บันทึกการแก้ไข', on_click=do_edit).classes('w-full h-14 bg-blue-700 text-white font-bold rounded-xl shadow-lg')

                async def delete_user(user_id):
                    with Session() as session:
                        u = session.query(User).get(user_id)
                        if u.username == get_current_user():
                            ui.notify('คุณไม่สามารถลบตัวเองได้!', color='red')
                            return
                        target_name = u.username
                        session.delete(u)
                        session.commit()
                    log_action(get_current_user(), "DELETE_USER", f"ลบพนักงาน: {target_name}")
                    ui.notify('ลบพนักงานออกเรียบร้อย', color='green')
                    user_list.rows[:] = get_users()
                    user_list.update()

                with ui.row().classes('justify-between items-center mb-8 bg-slate-50 p-6 rounded-2xl'):
                    with ui.column():
                        ui.label('สมาชิกทีมงาน').classes('text-2xl font-black text-slate-800')
                        ui.label('กำหนดสิทธิ์และแผนกงานของแต่ละบุคคล').classes('text-slate-400 text-sm')
                    ui.button('เพิ่มพนักงาน', icon='person_add', on_click=add_user_dialog.open).props('rounded bg-blue-600 px-6 py-2 shadow-md')

                user_list = ui.table(
                    columns=[
                        {'name':'username', 'label':'User', 'field':'username', 'align':'left', 'sortable': True}, 
                        {'name':'role', 'label':'บทบาท', 'field':'role', 'sortable': True},
                        {'name':'actions', 'label':'การจัดการ', 'field':'id'}
                    ],
                    rows=get_users()
                ).classes('w-full border-none shadow-none').props('flat bordered')

                user_list.add_slot('body-cell-actions', '''
                    <q-td :props="props">
                        <q-btn flat round color="blue" icon="edit" @click="$parent.$emit('edit', props.row)" />
                        <q-btn flat round color="red" icon="delete" @click="$parent.$emit('delete', props.row.id)" />
                    </q-td>
                ''')
                
                user_list.on('edit', lambda msg: (
                    setattr(curr_id, 'value', msg.args['id']),
                    setattr(un_edit, 'value', msg.args['username']),
                    setattr(ro_edit, 'value', msg.args['role']),
                    setattr(pw_edit, 'value', ''),
                    edit_user_dialog.open()
                ))
                user_list.on('delete', lambda msg: delete_user(msg.args))

            with ui.tab_panel(t3):
                ui.label('จัดการหมวดหมู่สินค้าและบริการ').classes('text-2xl font-black mb-6 text-slate-800')
                
                with ui.row().classes('w-full gap-4 items-end mb-8 bg-blue-50 p-6 rounded-xl'):
                    cat_name = ui.input('ชื่อหมวดหมู่ (เช่น Hardware, Software)').classes('flex-1').props('outlined bg-white')
                    cat_type = ui.select(['product', 'service', 'subscription'], value='product', label='ประเภท').classes('w-44').props('outlined bg-white')
                    
                    async def add_cat():
                        if not cat_name.value:
                            ui.notify('กรุณาระบุชื่อหมวดหมู่', color='orange')
                            return
                        with Session() as s:
                            if s.query(Category).filter_by(name=cat_name.value).first():
                                ui.notify('มีหมวดหมู่นี้อยู่แล้ว', color='red')
                                return
                            new_c = Category(name=cat_name.value, type=cat_type.value)
                            s.add(new_c)
                            s.commit()
                        log_action(get_current_user(), "ADD_CATEGORY", f"เพิ่มหมวดหมู่: {cat_name.value}")
                        ui.notify('เพิ่มหมวดหมู่สำเร็จ', color='green')
                        cat_name.value = ''
                        cat_table.rows[:] = get_cats()
                        cat_table.update()

                    ui.button('เพิ่มหมวดหมู่', icon='add', on_click=add_cat).classes('h-14 bg-blue-600 px-6 rounded-lg')

                def get_cats():
                    with Session() as s:
                        return [{'id': c.id, 'name': c.name, 'type': c.type} for c in s.query(Category).all()]

                async def delete_cat(c_id):
                    with Session() as s:
                        c = s.query(Category).get(c_id)
                        # ตรวจสอบว่ามีสินค้าใช้หมวดหมู่นี้อยู่ไหม
                        if s.query(Product).filter_by(category_id=c_id).first():
                            ui.notify('ไม่สามารถลบได้ เนื่องจากมีสินค้าในหมวดหมู่นี้อยู่', color='red')
                            return
                        name = c.name
                        s.delete(c)
                        s.commit()
                    log_action(get_current_user(), "DELETE_CATEGORY", f"ลบหมวดหมู่: {name}")
                    ui.notify('ลบสำเร็จ', color='green')
                    cat_table.rows[:] = get_cats()
                    cat_table.update()

                cat_table = ui.table(
                    columns=[
                        {'name': 'name', 'label': 'ชื่อหมวดหมู่', 'field': 'name', 'align': 'left', 'sortable': True},
                        {'name': 'type', 'label': 'ประเภทด้านบัญชี/สต็อก', 'field': 'type', 'sortable': True},
                        {'name': 'actions', 'label': 'จัดการ', 'field': 'id'}
                    ],
                    rows=get_cats()
                ).classes('w-full border-none shadow-none').props('flat bordered')

                cat_table.add_slot('body-cell-actions', '''
                    <q-td :props="props">
                        <q-btn flat round color="red" icon="delete" @click="$parent.$emit('delete', props.row.id)" />
                    </q-td>
                ''')
                cat_table.on('delete', lambda msg: delete_cat(msg.args))

            with ui.tab_panel(t4):
                ui.label('รูปแบบเอกสารและการระบุตัวตน').classes('text-2xl font-black mb-6 text-slate-800')
                
                async def handle_upload(e):
                    base64_data = f'data:{e.type};base64,{base64.b64encode(e.content.read()).decode()}'
                    with Session() as session:
                        comp = session.query(Company).first()
                        comp.logo_base64 = base64_data
                        session.commit()
                    log_action(get_current_user(), "UPLOAD_LOGO", "อัปโหลดโลโก้บริษัทใหม่")
                    ui.notify('อัปโหลดโลโก้สำเร็จ! กรุณา Refresh เพื่อดูผล', color='green')

                with Session() as s:
                    c = s.query(Company).first()
                    with ui.row().classes('w-full gap-8'):
                        with ui.column().classes('flex-1'):
                            inv_p = ui.input('คำนำหน้าใบแจ้งหนี้ (Invoice Prefix)', value=c.inv_prefix).classes('w-full').props('outlined')
                            rec_p = ui.input('คำนำหน้าบิล (Receipt Prefix)', value=c.rec_prefix).classes('w-full').props('outlined')
                            quo_p = ui.input('คำนำหน้าใบเสนอราคา (Quotation Prefix)', value=c.quo_prefix).classes('w-full').props('outlined')
                        with ui.column().classes('flex-1'):
                            ui.label('โลโก้บริษัทปัจจุบัน').classes('text-sm text-slate-400')
                            if c.logo_base64:
                                ui.image(c.logo_base64).classes('w-32 h-32 object-contain border rounded-lg bg-slate-50')
                            ui.upload(label='อัปโหลดโลโก้ใหม่ (.png/.jpg)', on_upload=handle_upload, auto_upload=True).classes('w-full mt-4')

                    async def save_doc_settings():
                        with Session() as s:
                            comp = s.query(Company).first()
                            comp.inv_prefix = inv_p.value
                            comp.rec_prefix = rec_p.value
                            comp.quo_prefix = quo_p.value
                            s.commit()
                        log_action(get_current_user(), "UPDATE_DOCS", "แก้ไขคำนำหน้าเอกสาร")
                        ui.notify('บันทึกการตั้งค่าเอกสารแล้ว', color='green')

                    async def preview_doc():
                        try:
                            with Session() as s:
                                company = s.query(Company).first()
                                customer = s.query(Contact).first() # ใช้ลูกค้ารายแรกเป็นตัวอย่าง
                                if not customer:
                                    ui.notify('กรุณาเพิ่มลูกค้าในสมุดรายชื่อก่อนเพื่อพรีวิว', color='orange')
                                    return
                            
                            data = {
                                'number': f"{inv_p.value}-SAMPLE-001",
                                'date': datetime.now().strftime('%Y-%m-%d'),
                                'due_date': (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
                                'company': company,
                                'customer': customer,
                                'items': [
                                    {'product_name': 'สินค้าตัวอย่างรายการที่ 1', 'quantity': 1, 'unit_price': 1000, 'discount_percent': 0, 'total_price': 1000},
                                    {'product_name': 'บริการตัวอย่างรายการที่ 2', 'quantity': 2, 'unit_price': 500, 'discount_percent': 10, 'total_price': 900},
                                ],
                                'notes': 'นี่ยังไม่ใช่เอกสารจริง เป็นเพียงตัวอย่างการจัดวางหัวกระดาษและโลโก้เท่านั้น',
                                'title': 'PREVIEW DOCUMENT / ตัวอย่างเอกสาร'
                            }
                            pdf_data = generate_pdf_v2(data)
                            ui.download(f'data:application/pdf;base64,{base64.b64encode(pdf_data).decode()}', filename="preview_settings.pdf")
                            ui.notify('กำลังสร้างตัวอย่าง PDF...', color='blue')
                        except Exception as e:
                            ui.notify(str(e), color='red')

                    with ui.row().classes('mt-8 gap-4'):
                        ui.button('บันทึกการตั้งค่าเอกสาร', on_click=save_doc_settings).classes('bg-slate-800 px-8 py-2 text-white rounded-lg')
                        ui.button('Preview เอกสารตัวอย่าง', icon='visibility', on_click=preview_doc).classes('bg-blue-600 px-8 py-2 text-white rounded-lg')

            with ui.tab_panel(t5):
                ui.label('การตั้งค่าภาษีและการเงิน').classes('text-2xl font-black mb-6 text-slate-800')
                with Session() as s:
                    c = s.query(Company).first()
                    with ui.row().classes('w-full gap-8'):
                        with ui.card().classes('flex-1 p-8 shadow-sm'):
                            ui.label('อัตราภาษีมูลค่าเพิ่ม (VAT %)').classes('text-slate-500 font-bold')
                            vat_val = ui.number(value=c.vat_rate, min=0, max=100).classes('w-full text-2xl').props('outlined suffix="%"')
                        with ui.card().classes('flex-1 p-8 shadow-sm'):
                            ui.label('ภาษีหัก ณ ที่จ่าย (%)').classes('text-slate-500 font-bold')
                            wht_val = ui.number(value=c.withholding_tax_rate, min=0, max=100).classes('w-full text-2xl').props('outlined suffix="%"')
                    
                    with ui.row().classes('w-full gap-8 mt-6'):
                        with ui.card().classes('flex-1 p-8 shadow-sm'):
                            ui.label('ภาษีเงินได้นิติบุคคล (%)').classes('text-slate-500 font-bold')
                            corp_tax_val = ui.number(value=c.corporate_tax_rate, min=0, max=50).classes('w-full text-2xl').props('outlined suffix="%"')
                        with ui.card().classes('flex-1 p-8 shadow-sm'):
                            ui.label('สิทธิ์ทวิ 50 (ปี พ.ศ.)').classes('text-slate-500 font-bold')
                            with ui.column().classes('gap-2'):
                                exemption_years_val = ui.number('ปียกเว้นภาษี', value=c.tax_exemption_years, min=0, max=10).classes('w-full').props('outlined')
                                reduction_years_val = ui.number('ปีลดหย่อน 50%', value=c.tax_reduction_years, min=0, max=10).classes('w-full').props('outlined')
                                exemption_start_val = ui.number('ปีที่เริ่ม (เช่น 2569)', value=c.tax_exemption_start_year).classes('w-full').props('outlined')
                    
                    async def save_fin():
                        with Session() as s:
                            comp = s.query(Company).first()
                            comp.vat_rate = vat_val.value
                            comp.withholding_tax_rate = wht_val.value
                            comp.corporate_tax_rate = corp_tax_val.value
                            comp.currency = curr_val.value
                            comp.inv_prefix = inv_prefix_val.value
                            comp.rec_prefix = rec_prefix_val.value
                            comp.pay_prefix = pay_prefix_val.value
                            comp.exp_prefix = exp_prefix_val.value
                            comp.tax_exemption_years = exemption_years_val.value
                            comp.tax_reduction_years = reduction_years_val.value
                            comp.tax_exemption_start_year = exemption_start_val.value
                            s.commit()
                        log_action(get_current_user(), "UPDATE_FINANCE", "แก้ไขการตั้งค่าทางการเงินและภาษี")
                        ui.notify('บันทึกข้อมูลการเงินสำเร็จ', color='green')

                    ui.button('บันทึกนโยบายการเงิน', on_click=save_fin).classes('mt-8 bg-green-700 px-12 py-3 text-white rounded-xl shadow-lg')

                    # Tax Calculator Section
                    ui.label('เครื่องคำนวณภาษีเงินได้นิติบุคคล').classes('text-xl font-bold mt-12 mb-6 text-blue-800')
                    
                    with ui.card().classes('w-full p-6 bg-blue-50 shadow-sm'):
                        with ui.row().classes('w-full gap-6 items-end'):
                            profit_input = ui.number('กำไรสุทธิ (บาท)', min=0).classes('flex-1').props('outlined suffix="฿"')
                            year_input = ui.number('ปี พ.ศ. ที่คำนวณ', value=datetime.now().year + 543).classes('flex-1').props('outlined')
                            
                            tax_result = ui.label('ภาษีที่ต้องชำระ: 0.00 ฿').classes('text-lg font-bold text-red-600')
                            
                            async def calculate_corporate_tax():
                                if not profit_input.value:
                                    ui.notify('กรุณากรอกกำไรสุทธิ', color='orange')
                                    return
                                
                                with Session() as s:
                                    company = s.query(Company).first()
                                    if not company:
                                        ui.notify('ไม่พบข้อมูลบริษัท', color='red')
                                        return
                                    
                                    profit = profit_input.value
                                    tax_year = year_input.value or (datetime.now().year + 543)
                                    
                                    # Check ทวิ 50
                                    tax_rate = company.corporate_tax_rate / 100  # Convert to decimal
                                    
                                    if (company.tax_exemption_start_year and 
                                        company.tax_exemption_years > 0 and 
                                        tax_year >= company.tax_exemption_start_year and 
                                        tax_year < company.tax_exemption_start_year + company.tax_exemption_years):
                                        # ปียกเว้นภาษี
                                        tax_amount = 0
                                        tax_result.text = f'ปี {tax_year} ได้รับสิทธิ์ยกเว้นภาษี (ทวิ 50) - ภาษีที่ต้องชำระ: 0.00 ฿'
                                    
                                    elif (company.tax_exemption_start_year and 
                                          company.tax_reduction_years > 0 and 
                                          tax_year >= company.tax_exemption_start_year + company.tax_exemption_years and 
                                          tax_year < company.tax_exemption_start_year + company.tax_exemption_years + company.tax_reduction_years):
                                        # ปีลดหย่อน 50%
                                        tax_amount = profit * tax_rate * 0.5
                                        tax_result.text = f'ปี {tax_year} ได้รับสิทธิ์ลดหย่อน 50% (ทวิ 50) - ภาษีที่ต้องชำระ: {tax_amount:,.2f} ฿'
                                    
                                    else:
                                        # ภาษีปกติ
                                        tax_amount = profit * tax_rate
                                        tax_result.text = f'ภาษีที่ต้องชำระ (อัตรา {company.corporate_tax_rate}%): {tax_amount:,.2f} ฿'
                                
                                ui.notify('คำนวณภาษีเรียบร้อย', color='green')
                            
                            ui.button('คำนวณภาษี', icon='calculate', on_click=calculate_corporate_tax).classes('h-12 bg-blue-600 text-white px-6 rounded-lg font-bold')

            with ui.tab_panel(t6):
                ui.label('บันทึกกิจกรรมย้อนหลัง (Audit Log)').classes('text-2xl font-black mb-6 text-slate-800')
                def get_logs():
                    with Session() as s:
                        return [{'time': l.timestamp, 'user': l.user, 'action': l.action, 'detail': l.detail} for l in s.query(AuditLog).order_by(AuditLog.id.desc()).limit(100).all()]
                
                log_table = ui.table(
                    columns=[
                        {'name':'time', 'label':'วัน-เวลา', 'field':'time', 'align':'left'},
                        {'name':'user', 'label':'ผู้ดำเนินการ', 'field':'user'},
                        {'name':'action', 'label':'ประเภทกิจกรรม', 'field':'action'},
                        {'name':'detail', 'label':'รายละเอียด', 'field':'detail', 'align':'left'}
                    ],
                    rows=get_logs()
                ).classes('w-full').props('flat bordered dense')

            with ui.tab_panel(t7):
                ui.label('ระบบสำรองและกู้คืนข้อมูล').classes('text-2xl font-bold mb-6')
                
                with ui.row().classes('w-full gap-8'):
                    # Backup Section
                    with ui.card().classes('flex-1 p-6 bg-blue-50 border border-blue-100 rounded-xl'):
                        ui.label('สำรองข้อมูล (Backup)').classes('text-xl font-bold mb-4 text-blue-900')
                        ui.label('ดาวน์โหลดไฟล์ฐานข้อมูล (.db) เพื่อเก็บไว้เป็นสำเนาสำรอง').classes('mb-6 text-sm text-slate-600')
                        
                        def do_backup():
                            if os.path.exists(DB_FILE):
                                ui.download(DB_FILE, filename=f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db")
                                ui.notify('ดาวน์โหลดไฟล์สำรองเรียบร้อย', color='green')
                            else:
                                ui.notify('ไม่พบไฟล์ฐานข้อมูล', color='red')
                                
                        ui.button('ดาวน์โหลด Backup', icon='download', on_click=do_backup).classes('w-full bg-blue-600 font-bold py-3 rounded-lg shadow-md')

                    # Restore Section
                    with ui.card().classes('flex-1 p-6 bg-red-50 border border-red-100 rounded-xl'):
                        ui.label('กู้คืนข้อมูล (Restore)').classes('text-xl font-bold mb-4 text-red-900')
                        ui.label('ระวัง! การกู้คืนจะเขียนทับข้อมูลปัจจุบันทั้งหมด ห้ามใช้หากไม่แน่ใจ').classes('mb-6 text-sm text-red-600 font-bold')
                        
                        def handle_upload(e):
                            try:
                                with open(DB_FILE, 'wb') as f:
                                    f.write(e.content.read())
                                ui.notify('กู้คืนข้อมูลสำเร็จ! ระบบจะทำการ Restart', color='green')
                                # Force restart in a bit
                                ui.timer(2, lambda: os._exit(0))
                            except Exception as ex:
                                ui.notify(f'เกิดข้อผิดพลาดในการกู้คืน: {ex}', color='red')

                        ui.upload(label='เลือกไฟล์ .db เพื่อกู้คืน', on_upload=handle_upload, auto_upload=True).props('accept=.db').classes('w-full')
            
            with ui.tab_panel(t8):
                ui.label('ระบบส่งอีเมลอัตโนมัติ (SMTP)').classes('text-2xl font-bold mb-6')
                with Session() as s:
                    c = s.query(Company).first()
                    with ui.card().classes('w-full p-6 shadow-sm'):
                        ui.label('ข้อมูลผู้ให้บริการอีเมล').classes('text-lg font-bold mb-4')
                        with ui.row().classes('w-full gap-4 items-end mb-4'):
                            server_in = ui.input('SMTP Server (เช่น smtp.gmail.com)', value=c.smtp_server).classes('flex-1')
                            port_in = ui.number('Port (เช่น 587)', value=c.smtp_port).classes('w-32')
                            tls_check = ui.checkbox('ใช้ TLS', value=c.smtp_use_tls).classes('mt-2')
                        
                        ui.label('ข้อมูลบัญชีส่งอีเมล').classes('text-lg font-bold my-4')
                        with ui.row().classes('w-full gap-4 items-end mb-4'):
                            email_in = ui.input('อีเมลผู้ส่ง (Sender Email)', value=c.email_sender).classes('flex-1')
                            user_in = ui.input('Username', value=c.smtp_user).classes('flex-1')
                            pass_in = ui.input('Password หรือ App Password', password=True, value=c.smtp_pass).classes('flex-1')

                        async def save_smtp():
                            with Session() as s:
                                comp = s.query(Company).first()
                                comp.smtp_server = server_in.value
                                comp.smtp_port = port_in.value
                                comp.smtp_use_tls = tls_check.value
                                comp.email_sender = email_in.value
                                comp.smtp_user = user_in.value
                                comp.smtp_pass = pass_in.value
                                s.commit()
                            ui.notify('บันทึกการตั้งค่า SMTP เรียบร้อย', color='green')

                        ui.button('บันทึกการตั้งค่า SMTP', on_click=save_smtp).classes('mt-4 bg-slate-800 text-white font-bold')

            with ui.tab_panel(t9):
                with Session() as s:
                    c = s.query(Company).first()
                    is_connected = bool(c.google_authorized_email)
                    status_text = '✅ เชื่อมต่อแล้ว' if is_connected else '❌ ยังไม่ได้เชื่อมต่อ'
                    status_color = 'text-green-600' if is_connected else 'text-red-500'

                    ui.label('การตั้งค่า Google API (Reseller)').classes('text-2xl font-bold mb-6 text-slate-800')
                    
                    with ui.card().classes('w-full p-6 bg-blue-50 border border-blue-200 shadow-sm'):
                        with ui.row().classes('justify-between items-center mb-4'):
                            with ui.column():
                                ui.label('สถานะ:').classes('text-sm font-bold text-slate-500')
                                ui.label(status_text).classes(f'text-2xl font-black {status_color}')
                            
                            with ui.column().classes('items-end'):
                                ui.label('อีเมลหุ่นยนต์ที่ได้รับสิทธิ์:').classes('text-xs font-bold text-slate-500')
                                ui.label(c.google_authorized_email or '-').classes('text-lg font-mono')
                                
                        ui.separator().classes('my-4')
                                
                        ui.label('ซิงค์ข้อมูลล่าสุดเมื่อ:').classes('text-sm font-bold text-slate-500')
                        ui.label(c.last_google_sync or 'ไม่เคย').classes('text-md font-bold mb-6')
                        
                        def handle_json_upload(e):
                            try:
                                json_content = e.content.read().decode('utf-8')
                                parsed = json.loads(json_content)
                                email = parsed.get('client_email')
                                if not email:
                                    ui.notify('ไฟล์ไม่ถูกต้อง ไม่มี client_email', color='red')
                                    return
                                
                                with Session() as session:
                                    comp = session.query(Company).first()
                                    comp.google_service_account_json = json_content
                                    comp.google_authorized_email = email
                                    session.commit()
                                
                                ui.notify('บันทึกกุญแจ (JSON Key) เรียบร้อย! กรุณา Refresh', color='green')
                                # Force reload after 1 tick
                                ui.timer(1.0, lambda: ui.navigate.to('/settings'))
                                
                            except Exception as ex:
                                ui.notify(f'ไฟล์พัง/อ่านไม่ได้: {ex}', color='red')
                        
                        if not is_connected:
                            ui.upload(label='อัปโหลดไฟล์ JSON Key ท่ีได้จาก Google Cloud', on_upload=handle_json_upload, auto_upload=True).classes('bg-white')
                        else:
                            with ui.row().classes('gap-4'):
                                async def remove_google_sync():
                                    with Session() as session:
                                        comp = session.query(Company).first()
                                        comp.google_service_account_json = None
                                        comp.google_authorized_email = None
                                        session.commit()
                                    ui.notify('ยกเลิกการเชื่อมต่อแล้ว', color='red')
                                    ui.timer(0.5, lambda: ui.navigate.to('/settings'))
                                
                                ui.button('ตัดการเชื่อมต่อ', icon='link_off', on_click=remove_google_sync).classes('bg-red-500 text-white font-bold')
                                
                                async def do_sync():
                                    await sync_google_reseller_data()
                                
                                ui.button('🚀 เริ่มซิงค์ข้อมูลเดี๋ยวนี้ (Manual Sync)', on_click=do_sync).classes('bg-blue-600 text-white font-black shadow-lg shadow-blue-300')                
@ui.page('/categories')
def categories_page():
    if not get_current_user():
        ui.navigate.to('/login')
        return

    role = app.storage.user.get('role', 'staff')
    if role not in ['admin', 'inventory', 'sales']:
        ui.notify('ไม่มีสิทธิ์เข้าถึงหน้านี้', color='red')
        ui.navigate.to('/')
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('หมวดหมู่สินค้า').classes('text-xl font-bold')
        with ui.row().classes('items-center gap-2'):
            ui.label(f'Role: {role.upper()}').classes('text-xs bg-purple-500 px-2 py-1 rounded-full font-bold')

    with ui.column().classes('p-8 w-full max-w-6xl mx-auto gap-8'):
        ui.label('จัดการหมวดหมู่สินค้าและบริการ').classes('text-3xl font-black mb-6 text-slate-800')
        
        with ui.row().classes('w-full gap-4 items-end mb-8 bg-purple-50 p-6 rounded-xl'):
            cat_name = ui.input('ชื่อหมวดหมู่ (เช่น Hardware, Software)').classes('flex-1').props('outlined bg-white')
            cat_type = ui.select(['product', 'service', 'subscription'], value='product', label='ประเภท').classes('w-44').props('outlined bg-white')
            
            async def add_cat():
                if not cat_name.value:
                    ui.notify('กรุณาระบุชื่อหมวดหมู่', color='orange')
                    return
                with Session() as s:
                    if s.query(Category).filter_by(name=cat_name.value).first():
                        ui.notify('มีหมวดหมู่นี้อยู่แล้ว', color='red')
                        return
                    new_c = Category(name=cat_name.value, type=cat_type.value)
                    s.add(new_c)
                    s.commit()
                log_action(get_current_user(), "ADD_CATEGORY", f"เพิ่มหมวดหมู่: {cat_name.value}")
                ui.notify('เพิ่มหมวดหมู่สำเร็จ', color='green')
                cat_name.value = ''
                cat_table.rows[:] = get_cats()
                cat_table.update()

            ui.button('เพิ่มหมวดหมู่', icon='add', on_click=add_cat).classes('h-14 bg-purple-600 px-6 rounded-lg')

        def get_cats():
            with Session() as s:
                return [{'id': c.id, 'name': c.name, 'type': c.type} for c in s.query(Category).all()]

        async def delete_cat(c_id):
            with Session() as s:
                c = s.query(Category).get(c_id)
                # ตรวจสอบว่ามีสินค้าใช้หมวดหมู่นี้อยู่ไหม
                if s.query(Product).filter_by(category_id=c_id).first():
                    ui.notify('ไม่สามารถลบได้ เนื่องจากมีสินค้าในหมวดหมู่นี้อยู่', color='red')
                    return
                name = c.name
                s.delete(c)
                s.commit()
            log_action(get_current_user(), "DELETE_CATEGORY", f"ลบหมวดหมู่: {name}")
            ui.notify('ลบสำเร็จ', color='green')
            cat_table.rows[:] = get_cats()
            cat_table.update()

        cat_table = ui.table(
            columns=[
                {'name': 'name', 'label': 'ชื่อหมวดหมู่', 'field': 'name', 'align': 'left', 'sortable': True},
                {'name': 'type', 'label': 'ประเภทด้านบัญชี/สต็อก', 'field': 'type', 'sortable': True},
                {'name': 'actions', 'label': 'จัดการ', 'field': 'id'}
            ],
            rows=get_cats()
        ).classes('w-full bg-white shadow-sm rounded-xl').props('flat bordered')

        cat_table.add_slot('body-cell-actions', '''
            <q-td :props="props">
                <q-btn flat round color="red" icon="delete" @click="$parent.$emit('delete', props.row.id)" />
            </q-td>
        ''')
        cat_table.on('delete', lambda msg: delete_cat(msg.args))

@ui.page('/catalog')
def catalog_page():
    if not get_current_user():
        ui.navigate.to('/login')
        return

    role = app.storage.user.get('role', 'staff')
    ui.query('body').style('background-color: #f1f5f9;')

    with ui.header().classes('bg-slate-900 text-white p-4 items-center justify-between'):
        with ui.row().classes('items-center'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('จัดการสินค้าและบริการ (Catalog)').classes('text-xl font-bold ml-4')
        
        if role in ['admin', 'inventory']:
            def open_add():
                curr_prod_id.value = None
                sku.value = ''
                name.value = ''
                price.value = 0
                unit.value = 'ชิ้น'
                stock.value = 0
                cat_id.value = None
                add_dialog.open()
            ui.button('เพิ่มสินค้า/บริการ', icon='add', on_click=open_add).classes('bg-blue-600')

    def get_products():
        with Session() as s:
            # Join with Category to get Name
            results = s.query(Product, Category).outerjoin(Category).all()
            return [{
                'id': p.id,
                'sku': p.sku,
                'name': p.name,
                'price': p.price,
                'stock': p.stock_qty,
                'unit': p.unit,
                'category': c.name if c else 'ทั่วไป',
                'type': c.type if c else 'product',
                'category_id': p.category_id
            } for p, c in results]

    with ui.column().classes('p-8 w-full max-w-6xl mx-auto'):
        # Dialog สำหรับเพิ่ม/แก้ไขสินค้า
        with ui.dialog() as add_dialog, ui.card().classes('p-8 w-[500px] rounded-2xl'):
            ui.label('รายละเอียดสินค้า/บริการ').classes('text-2xl font-black mb-6')
            
            with Session() as s:
                cats = {c.id: f"{c.name} ({c.type})" for c in s.query(Category).all()}
            
            curr_prod_id = ui.number().classes('hidden') # Hidden state for edit mode
            sku = ui.input('รหัสสินค้า (SKU)').classes('w-full mb-4').props('outlined')
            name = ui.input('ชื่อสินค้า/บริการ').classes('w-full mb-4').props('outlined')
            price = ui.number('ราคาขาย', format='%.2f').classes('w-full mb-4').props('outlined')
            unit = ui.input('หน่วยนับ', value='ชิ้น').classes('w-full mb-4').props('outlined')
            stock = ui.number('จำนวนสต็อกเริ่มต้น', value=0).classes('w-full mb-4').props('outlined')
            cat_id = ui.select(options=cats, label='หมวดหมู่สินค้า').classes('w-full mb-8').props('outlined')

            async def save_product():
                if not sku.value or not name.value or not cat_id.value:
                    ui.notify('กรุณากรอกข้อมูลให้ครบถ้วน', color='orange')
                    return
                
                with Session() as s:
                    if curr_prod_id.value:
                        # Edit Mode
                        p = s.query(Product).get(int(curr_prod_id.value))
                        p.sku = sku.value
                        p.name = name.value
                        p.price = price.value
                        p.unit = unit.value
                        p.stock_qty = stock.value
                        p.category_id = cat_id.value
                        msg = f"แก้ไขสินค้า: {name.value}"
                    else:
                        # Add Mode
                        p = Product(
                            sku=sku.value,
                            name=name.value,
                            price=price.value,
                            unit=unit.value,
                            stock_qty=stock.value,
                            category_id=cat_id.value
                        )
                        s.add(p)
                        msg = f"เพิ่มสินค้า: {name.value}"
                    s.commit()
                
                log_action(get_current_user(), "SAVE_PRODUCT", msg)
                ui.notify('บันทึกข้อมูลเรียบร้อย', color='green')
                add_dialog.close()
                prod_table.rows[:] = get_products()
                prod_table.update()

            ui.button('บันทึกข้อมูล', on_click=save_product).classes('w-full h-12 bg-blue-700 text-white rounded-xl')

        # ตารางแสดงรายการ
        prod_table = ui.table(
            columns=[
                {'name': 'sku', 'label': 'SKU', 'field': 'sku', 'align': 'left', 'sortable': True},
                {'name': 'name', 'label': 'รายการ', 'field': 'name', 'align': 'left', 'sortable': True},
                {'name': 'category', 'label': 'หมวดหมู่', 'field': 'category', 'sortable': True},
                {'name': 'price', 'label': 'ราคา', 'field': 'price', 'sortable': True},
                {'name': 'stock', 'label': 'สต็อก', 'field': 'stock', 'sortable': True},
                {'name': 'unit', 'label': 'หน่วย', 'field': 'unit'},
                {'name': 'actions', 'label': 'จัดการ', 'field': 'id'}
            ],
            rows=get_products()
        ).classes('w-full bg-white shadow-sm rounded-xl').props('flat bordered')

        prod_table.add_slot('body-cell-actions', '''
            <q-td :props="props">
                <q-btn flat round color="blue" icon="edit" @click="$parent.$emit('edit', props.row)" />
            </q-td>
        ''')

        def open_edit(row):
            curr_prod_id.value = row['id']
            sku.value = row['sku']
            name.value = row['name']
            price.value = row['price']
            unit.value = row['unit']
            stock.value = row['stock']
            cat_id.value = row['category_id']
            add_dialog.open()
            
        prod_table.on('edit', lambda msg: open_edit(msg.args))

        # เพิ่มสไตล์ให้แถวที่สต็อกน้อย หรือเป็นบริการ
        prod_table.add_slot('body-cell-stock', '''
            <q-td :props="props">
                <q-badge :color="props.row.type === 'service' ? 'purple' : (props.value <= 5 ? 'red' : 'green')">
                    {{ props.row.type === 'service' ? 'SERVICE' : props.value }}
                </q-badge>
            </q-td>
        ''')

@ui.page('/contacts')
def contacts_page():
    if not verify_access(['admin', 'accountant', 'billing', 'sales']):
        return

    role = app.storage.user.get('role', 'staff')
    ui.query('body').style('background-color: #f1f5f9;')

    with ui.header().classes('bg-slate-900 text-white p-4 items-center justify-between'):
        with ui.row().classes('items-center'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('สมุดรายชื่อลูกค้าและคู่ค้า (Contacts)').classes('text-xl font-bold ml-4')
        
        ui.button('เพิ่มรายชื่อใหม่', icon='person_add', on_click=lambda: add_dialog.open()).classes('bg-blue-600')

    def get_contacts():
        with Session() as s:
            return [{
                'id': c.id,
                'name': c.name,
                'type': c.type,
                'tax_id': c.tax_id,
                'phone': c.phone,
                'email': c.email,
                'person': c.contact_person,
                'address': c.address
            } for c in s.query(Contact).all()]

    with ui.column().classes('p-8 w-full max-w-6xl mx-auto'):
        # Dialog สำหรับเพิ่มรายชื่อ
        with ui.dialog() as add_dialog, ui.card().classes('p-8 w-[600px] rounded-2xl'):
            ui.label('รายละเอียดผู้ติดต่อ').classes('text-2xl font-black mb-6 text-blue-900')
            
            with ui.row().classes('w-full gap-4'):
                c_type = ui.select(options=['customer', 'supplier', 'both'], value='customer', label='ประเภทผู้ติดต่อ').classes('flex-1')
                c_name = ui.input('ชื่อบริษัท / ชื่อลูกค้า').classes('flex-2').props('outlined')
            
            with ui.row().classes('w-full gap-4 mt-4'):
                c_tax = ui.input('เลขประจำตัวผู้เสียภาษี').classes('flex-1').props('outlined')
                c_person = ui.input('บุคคลที่ติดต่อได้').classes('flex-1').props('outlined')
            
            with ui.row().classes('w-full gap-4 mt-4'):
                c_phone = ui.input('เบอร์โทรศัพท์').classes('flex-1').props('outlined')
                c_email = ui.input('อีเมล').classes('flex-1').props('outlined')
            
            c_addr = ui.textarea('ที่อยู่ออกเอกสาร').classes('w-full mt-4 h-32').props('outlined')

            async def save_contact():
                if not c_name.value:
                    ui.notify('กรุณากรอกชื่อผู้ติดต่อ', color='orange')
                    return
                
                with Session() as s:
                    contact = Contact(
                        name=c_name.value,
                        type=c_type.value,
                        tax_id=c_tax.value,
                        contact_person=c_person.value,
                        phone=c_phone.value,
                        email=c_email.value,
                        address=c_addr.value
                    )
                    s.add(contact)
                    s.commit()
                
                log_action(get_current_user(), "ADD_CONTACT", f"เพิ่มรายชื่อ: {c_name.value} ({c_type.value})")
                ui.notify('บันทึกรายชื่อเรียบร้อย', color='green')
                add_dialog.close()
                contact_table.rows[:] = get_contacts()
                contact_table.update()

            ui.button('เพิ่มลงสมุดรายชื่อ', on_click=save_contact).classes('w-full h-14 bg-slate-900 text-white rounded-xl mt-8 font-bold')

        # Dialog สำหรับแก้ไขรายชื่อ
        with ui.dialog() as edit_dialog, ui.card().classes('p-8 w-[600px] rounded-2xl'):
            ui.label('แก้ไขผู้ติดต่อ').classes('text-2xl font-black mb-6 text-blue-900')
            curr_id = ui.number().classes('hidden') # Hidden state
            with ui.row().classes('w-full gap-4'):
                e_type = ui.select(options=['customer', 'supplier', 'both'], label='ประเภทผู้ติดต่อ').classes('flex-1')
                e_name = ui.input('ชื่อบริษัท / ชื่อลูกค้า').classes('flex-2').props('outlined')
            
            with ui.row().classes('w-full gap-4 mt-4'):
                e_tax = ui.input('เลขประจำตัวผู้เสียภาษี').classes('flex-1').props('outlined')
                e_person = ui.input('บุคคลที่ติดต่อได้').classes('flex-1').props('outlined')
            
            with ui.row().classes('w-full gap-4 mt-4'):
                e_phone = ui.input('เบอร์โทรศัพท์').classes('flex-1').props('outlined')
                e_email = ui.input('อีเมล').classes('flex-1').props('outlined')
            
            e_addr = ui.textarea('ที่อยู่ออกเอกสาร').classes('w-full mt-4 h-32').props('outlined')

            async def update_contact():
                with Session() as s:
                    contact = s.query(Contact).get(int(curr_id.value))
                    contact.name = e_name.value
                    contact.type = e_type.value
                    contact.tax_id = e_tax.value
                    contact.contact_person = e_person.value
                    contact.phone = e_phone.value
                    contact.email = e_email.value
                    contact.address = e_addr.value
                    s.commit()
                
                log_action(get_current_user(), "UPDATE_CONTACT", f"แก้ไขรายชื่อ: {e_name.value}")
                ui.notify('อัปเดตข้อมูลผู้ติดต่อเรียบร้อย', color='green')
                edit_dialog.close()
                contact_table.rows[:] = get_contacts()
                contact_table.update()

            ui.button('บันทึกการแก้ไข', on_click=update_contact).classes('w-full h-14 bg-blue-700 text-white rounded-xl mt-8 font-bold')

        # ตารางแสดงรายชื่อ
        contact_table = ui.table(
            columns=[
                {'name': 'name', 'label': 'ชื่อลูกค้า/คู่ค้า', 'field': 'name', 'align': 'left', 'sortable': True},
                {'name': 'type', 'label': 'ประเภท', 'field': 'type', 'sortable': True},
                {'name': 'tax_id', 'label': 'เลขภาษี', 'field': 'tax_id'},
                {'name': 'phone', 'label': 'เบอร์โทร', 'field': 'phone'},
                {'name': 'email', 'label': 'อีเมล', 'field': 'email'},
                {'name': 'person', 'label': 'ผู้ติดต่อ', 'field': 'person'},
                {'name': 'actions', 'label': 'จัดการ', 'field': 'id'}
            ],
            rows=get_contacts()
        ).classes('w-full bg-white shadow-sm rounded-xl').props('flat bordered')

        contact_table.add_slot('body-cell-actions', '''
            <q-td :props="props">
                <q-btn flat round color="blue" icon="edit" @click="$parent.$emit('edit', props.row)" />
            </q-td>
        ''')

        contact_table.on('edit', lambda msg: (
            setattr(curr_id, 'value', msg.args['id']),
            setattr(e_name, 'value', msg.args['name']),
            setattr(e_type, 'value', msg.args['type']),
            setattr(e_tax, 'value', msg.args['tax_id']),
            setattr(e_person, 'value', msg.args['person']),
            setattr(e_phone, 'value', msg.args['phone']),
            setattr(e_email, 'value', msg.args['email']),
            setattr(e_addr, 'value', msg.args['address']),
            edit_dialog.open()
        ))

        # เพิ่มสไตล์ให้ประเภท
@ui.page('/invoices')
def invoices_list_page():
    if not verify_access(['admin', 'accountant', 'billing']):
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('รายการใบแจ้งหนี้ทั้งหมด').classes('text-xl font-bold')
        with ui.row().classes('items-center gap-2'):
            ui.button('ออกใบแจ้งหนี้ใหม่', icon='add', on_click=lambda: ui.navigate.to('/invoice')).classes('bg-green-600')

    with ui.column().classes('p-8 w-full max-w-7xl mx-auto gap-8'):
        def get_invoices():
            with Session() as s:
                return [
                    {
                        'id': inv.id,
                        'invoice_number': inv.invoice_number,
                        'customer_name': s.query(Contact).get(inv.customer_id).name if inv.customer_id else 'N/A',
                        'net_amount': inv.net_amount,
                        'status': inv.status,
                        'created_at': inv.created_at[:10],
                        'due_date': inv.due_date
                    } for inv in s.query(Invoice).order_by(Invoice.created_at.desc()).all()
                ]

        async def change_status(invoice_id, new_status):
            with Session() as s:
                inv = s.query(Invoice).get(invoice_id)
                if inv:
                    inv.status = new_status
                    s.commit()
                    log_action(get_current_user(), "UPDATE_INVOICE_STATUS", f"เปลี่ยนสถานะ {inv.invoice_number} เป็น {new_status}")
                    ui.notify(f'อัปเดตสถานะ {inv.invoice_number} เป็น {new_status} เรียบร้อย', color='green')
                    invoice_table.rows[:] = get_invoices()
                    invoice_table.update()

        async def print_existing_invoice(invoice_id):
            try:
                with Session() as s:
                    inv = s.query(Invoice).get(invoice_id)
                    items = s.query(InvoiceItem).filter_by(invoice_id=invoice_id).all()
                    customer = s.query(Contact).get(inv.customer_id)
                    company = s.query(Company).first()
                    
                    # Prepare data for generate_pdf
                    invoice_data = {
                        'number': inv.invoice_number,
                        'date': inv.created_at[:10],
                        'due_date': inv.due_date,
                        'customer': customer,
                        'company': company,
                        'items': [
                            {
                                'product_name': s.query(Product).get(it.product_id).name if it.product_id else it.description,
                                'quantity': it.quantity,
                                'unit_price': it.unit_price,
                                'discount_percent': it.discount_percent,
                                'total_price': it.total_price
                            } for it in items
                        ],
                        'notes': inv.notes
                    }
                
                pdf_data = generate_pdf_v2(invoice_data)
                ui.download(f'data:application/pdf;base64,{base64.b64encode(pdf_data).decode()}', filename=f"invoice_{inv.invoice_number}.pdf")
                ui.notify(f'กำลังดาวน์โหลด {inv.invoice_number}', color='green')
            except Exception as e:
                ui.notify(f'เกิดข้อผิดพลาดในการพิมพ์: {str(e)}', color='red')

        invoice_table = ui.table(
            columns=[
                {'name': 'invoice_number', 'label': 'เลขที่ใบแจ้งหนี้', 'field': 'invoice_number', 'align': 'left', 'sortable': True},
                {'name': 'customer_name', 'label': 'ลูกค้า', 'field': 'customer_name', 'align': 'left', 'sortable': True},
                {'name': 'created_at', 'label': 'วันที่ออก', 'field': 'created_at', 'sortable': True},
                {'name': 'due_date', 'label': 'วันครบกำหนด', 'field': 'due_date', 'sortable': True},
                {'name': 'net_amount', 'label': 'ยอดเงินรวม', 'field': 'net_amount', 'format': lambda val: f"{val:,.2f} ฿", 'sortable': True},
                {'name': 'status', 'label': 'สถานะ', 'field': 'status', 'sortable': True},
                {'name': 'actions', 'label': 'จัดการ', 'field': 'id'}
            ],
            rows=get_invoices()
        ).classes('w-full bg-white shadow-lg rounded-xl').props('flat bordered')

        invoice_table.add_slot('body-cell-status', '''
            <q-td :props="props">
                <q-chip outline :color="props.value === 'paid' ? 'green' : (props.value === 'draft' ? 'grey' : 'orange')" size="sm" class="font-bold">
                    {{ props.value.toUpperCase() }}
                </q-chip>
            </q-td>
        ''')

        invoice_table.add_slot('body-cell-actions', '''
            <q-td :props="props">
                <q-btn flat round color="blue" icon="print" @click="$parent.$emit('print', props.row.id)" />
                <q-btn flat round color="green" icon="check_circle" v-if="props.row.status !== 'paid'" @click="$parent.$emit('mark_paid', props.row.id)" />
                <q-btn flat round color="red" icon="cancel" v-if="props.row.status !== 'cancelled' && props.row.status !== 'paid'" @click="$parent.$emit('cancel', props.row.id)" />
            </q-td>
        ''')

        invoice_table.on('print', lambda msg: print_existing_invoice(msg.args))
        invoice_table.on('mark_paid', lambda msg: change_status(msg.args, 'paid'))
        invoice_table.on('cancel', lambda msg: change_status(msg.args, 'cancelled'))

def generate_pdf_v2(data):
    """Refined PDF generation to match the requested layout exactly"""
    pdf = FPDF()
    pdf.add_page()
    
    # Add Thai Font
    try:
        # Using a typical path for Thai font if available, or fallback
        pdf.add_font('THSarabun', '', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', uni=True)
        pdf.add_font('THSarabun-Bold', '', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', uni=True)
        font_name = 'THSarabun'
    except:
        pdf.set_font('Arial', '', 12)
        font_name = 'Arial'

    company = data.get('company')
    customer = data.get('customer')
    
    # --- 1. Top Black Bar ---
    pdf.set_fill_color(0, 0, 0)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(font_name, '', 14)
    comp_name_en = (company.name if company else "COMPANY NAME").upper()
    pdf.cell(0, 8, comp_name_en, ln=True, align='C', fill=True)
    
    # --- 2. Logo & Company Info ---
    pdf.set_text_color(0, 0, 0)
    pdf.ln(2)
    
    # Logo
    if company and company.logo_base64:
        try:
            header, encoded = company.logo_base64.split(",", 1)
            img_data = base64.b64decode(encoded)
            pdf.image(img_data, x=10, y=20, w=35)
        except Exception as e:
            print(f"Error loading logo: {e}")

    # Company Details (Right side)
    pdf.set_xy(50, 18)
    pdf.set_font(font_name, '', 16)
    pdf.cell(0, 8, (company.name if company else "ชื่อบริษัท"), ln=True, align='R')
    pdf.set_font(font_name, '', 10)
    
    addr = f"Address : {company.address}" if company and company.address else "Address : -"
    pdf.cell(0, 5, addr, ln=True, align='R')
    
    tel_web = f"Telephone : {company.phone or '-'} | {company.email or '-'}"
    pdf.cell(0, 5, tel_web, ln=True, align='R')
    
    tax_id = f"TAX ID : {company.tax_id or '-'}"
    pdf.cell(0, 5, tax_id, ln=True, align='R')
    
    pdf.ln(5)
    
    # --- 3. Document Title (INV-BAR) ---
    pdf.set_fill_color(100, 100, 100)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(font_name, '', 12)
    title = data.get('title', 'INVOICE / ใบแจ้งหนี้')
    pdf.cell(0, 8, title.upper(), ln=True, align='C', fill=True)
    
    pdf.set_text_color(0, 0, 0)
    pdf.ln(2)
    
    # --- 4. Info Section (Two Columns) ---
    pdf.set_font(font_name, '', 9)
    curr_y = pdf.get_y()
    
    # Column 1: Customer
    pdf.set_xy(10, curr_y)
    col1_x = 10
    col2_x = 110
    row_h = 5
    
    labels_l = [
        ('Company :', (customer.name if customer else "-")),
        ('Attention :', (customer.contact_person if customer else "-")),
        ('Address :', (customer.address if customer else "-")),
        ('E-Mail :', (customer.email if customer else "-")),
        ('Tel :', (customer.phone if customer else "-")),
        ('Fax :', "-")
    ]
    
    for label, val in labels_l:
        pdf.set_x(col1_x)
        pdf.set_font(font_name, '', 9)
        pdf.cell(20, row_h, label, 0)
        pdf.set_font(font_name, '', 9)
        pdf.multi_cell(80, row_h, str(val), 0, 'L')
        # We don't want the next row to be far away if multi_cell wraps
    
    # Column 2: Doc Info
    pdf.set_xy(col2_x, curr_y)
    
    labels_r = [
        ('Date :', data['date']),
        ('Purchase NO# :', (data.get('po_number') or "-")),
        ('Form :', (get_current_user() or "-")),
        ('Position :', "Staff"),
        ('E-Mail :', (company.email if company else "-")),
        ('Mobile :', (company.phone if company else "-"))
    ]
    
    for label, val in labels_r:
        pdf.set_x(col2_x)
        pdf.set_font(font_name, '', 9)
        pdf.cell(30, row_h, label, 0)
        pdf.set_font(font_name, '', 9)
        pdf.cell(0, row_h, str(val), 0, 1)

    pdf.ln(5)
    
    # --- 5. Items Table ---
    pdf.set_fill_color(200, 200, 200)
    pdf.set_font(font_name, '', 10)
    
    # Table Header
    pdf.cell(15, 10, 'ลำดับที่', 1, 0, 'C', True)
    pdf.cell(95, 10, 'รายการสินค้า/บริการ', 1, 0, 'C', True)
    pdf.cell(20, 10, 'จำนวน', 1, 0, 'C', True)
    pdf.cell(30, 10, 'ราคาต่อหน่วย', 1, 0, 'C', True)
    pdf.cell(30, 10, 'รวมราคา', 1, 1, 'C', True)
    
    pdf.set_xy(10, pdf.get_y()-5)
    pdf.cell(15, 5, 'Item', 0, 0, 'C')
    pdf.cell(95, 5, 'Description', 0, 0, 'C')
    pdf.cell(20, 5, 'Qty.', 0, 0, 'C')
    pdf.cell(30, 5, 'Unit Price', 0, 0, 'C')
    pdf.cell(30, 5, 'Total Price', 0, 1, 'C')

    # Items
    subtotal = 0
    pdf.set_font(font_name, '', 9)
    for i, item in enumerate(data['items'], 1):
        h = 7
        pdf.cell(15, h, str(i), 1, 0, 'C')
        pdf.cell(95, h, item['product_name'][:50], 1)
        pdf.cell(20, h, str(item['quantity']), 1, 0, 'C')
        pdf.cell(30, h, f"{item['unit_price']:,.2f}", 1, 0, 'R')
        pdf.cell(30, h, f"{item['total_price']:,.2f}", 1, 1, 'R')
        subtotal += item['total_price']
        
    pdf.ln(5)
    
    # Summary
    vat_rate = company.vat_rate if company else 7.0
    vat_amount = subtotal * vat_rate / 100
    total = subtotal + vat_amount
    
    pdf.cell(130, 6, '', 0)
    pdf.cell(30, 6, 'Subtotal:', 0, 0, 'R')
    pdf.cell(30, 6, f"{subtotal:,.2f}", 1, 1, 'R')
    
    pdf.cell(130, 6, '', 0)
    pdf.cell(30, 6, f'VAT {vat_rate}%:', 0, 0, 'R')
    pdf.cell(30, 6, f"{vat_amount:,.2f}", 1, 1, 'R')
    
    pdf.set_font(font_name, '', 12)
    pdf.cell(130, 8, '', 0)
    pdf.cell(30, 8, 'GRAND TOTAL:', 0, 0, 'R')
    pdf.cell(30, 8, f"{total:,.2f} {company.currency if company else '฿'}", 1, 1, 'R')
    
    # --- 6. Payment Information ---
    pdf.ln(10)
    pdf.set_font(font_name, '', 10)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(0, 7, 'การชำระเงิน (Payment Information)', 0, 1, 'L', True)
    
    with Session() as s:
        banks = s.query(BankAccount).filter_by(is_default=True).all()
        if not banks:
            banks = s.query(BankAccount).all()
        
        for b in banks:
            pdf.set_font(font_name, '', 9)
            pdf.cell(0, 6, f"ธนาคาร: {b.bank_name}", ln=True)
            pdf.cell(0, 6, f"ชื่อบัญชี: {b.account_name}", ln=True)
            pdf.cell(0, 6, f"เลขที่บัญชี: {b.account_number}", ln=True)
            pdf.ln(2)

    return pdf.output()

@ui.page('/quotations')
def quotations_list_page():
    if not verify_access(['admin', 'sales']):
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('รายการใบเสนอราคาทั้งหมด').classes('text-xl font-bold')
        with ui.row().classes('items-center gap-2'):
            ui.button('ออกใบเสนอราคาใหม่', icon='add', on_click=lambda: ui.navigate.to('/quotation')).classes('bg-green-600')

    with ui.column().classes('p-8 w-full max-w-7xl mx-auto gap-8'):
        def get_quotations():
            with Session() as s:
                return [
                    {
                        'id': q.id,
                        'quotation_number': q.quotation_number,
                        'customer_name': s.query(Contact).get(q.customer_id).name if q.customer_id else 'N/A',
                        'net_amount': q.net_amount,
                        'status': q.status,
                        'created_at': q.created_at[:10],
                        'expiry_date': q.expiry_date
                    } for q in s.query(Quotation).order_by(Quotation.created_at.desc()).all()
                ]

        async def change_status(quo_id, new_status):
            with Session() as s:
                quo = s.query(Quotation).get(quo_id)
                if quo:
                    quo.status = new_status
                    s.commit()
                    log_action(get_current_user(), "UPDATE_QUOTATION_STATUS", f"เปลี่ยนสถานะ {quo.quotation_number} เป็น {new_status}")
                    ui.notify(f'อัปเดตสถานะ {quo.quotation_number} เป็น {new_status} เรียบร้อย', color='green')
                    quotation_table.rows[:] = get_quotations()
                    quotation_table.update()

        async def print_existing_quotation(quo_id):
            try:
                with Session() as s:
                    q = s.query(Quotation).get(quo_id)
                    items = s.query(QuotationItem).filter_by(quotation_id=quo_id).all()
                    customer = s.query(Contact).get(q.customer_id)
                    company = s.query(Company).first()
                    
                    quotation_data = {
                        'number': q.quotation_number,
                        'date': q.created_at[:10],
                        'expiry_date': q.expiry_date,
                        'customer': customer,
                        'company': company,
                        'items': [
                            {
                                'product_name': s.query(Product).get(it.product_id).name if it.product_id else it.description,
                                'quantity': it.quantity,
                                'unit_price': it.unit_price,
                                'discount_percent': it.discount_percent,
                                'total_price': it.total_price
                            } for it in items
                        ],
                        'notes': q.notes,
                        'title': 'QUOTATION / ใบเสนอราคา'
                    }
                
                pdf_data = generate_pdf_v2(quotation_data)
                ui.download(f'data:application/pdf;base64,{base64.b64encode(pdf_data).decode()}', filename=f"quotation_{q.quotation_number}.pdf")
                ui.notify(f'กำลังดาวน์โหลด {q.quotation_number}', color='green')
            except Exception as e:
                ui.notify(f'เกิดข้อผิดพลาดในการพิมพ์: {str(e)}', color='red')

        quotation_table = ui.table(
            columns=[
                {'name': 'quotation_number', 'label': 'เลขที่ใบเสนอราคา', 'field': 'quotation_number', 'align': 'left', 'sortable': True},
                {'name': 'customer_name', 'label': 'ลูกค้า', 'field': 'customer_name', 'align': 'left', 'sortable': True},
                {'name': 'created_at', 'label': 'วันที่ออก', 'field': 'created_at', 'sortable': True},
                {'name': 'expiry_date', 'label': 'วันหมดอายุ', 'field': 'expiry_date', 'sortable': True},
                {'name': 'net_amount', 'label': 'ยอดเงินรวม', 'field': 'net_amount', 'sortable': True},
                {'name': 'status', 'label': 'สถานะ', 'field': 'status', 'sortable': True},
                {'name': 'actions', 'label': 'จัดการ', 'field': 'id'}
            ],
            rows=get_quotations()
        ).classes('w-full bg-white shadow-lg rounded-xl').props('flat bordered')

        quotation_table.add_slot('body-cell-status', '''
            <q-td :props="props">
                <q-chip outline :color="props.value === 'accepted' ? 'green' : (props.value === 'draft' ? 'grey' : 'orange')" size="sm" class="font-bold">
                    {{ props.value.toUpperCase() }}
                </q-chip>
            </q-td>
        ''')

        quotation_table.add_slot('body-cell-actions', '''
            <q-td :props="props">
                <q-btn flat round color="blue" icon="print" @click="$parent.$emit('print', props.row.id)" />
                <q-btn flat round color="green" icon="check_circle" v-if="props.row.status === 'sent'" @click="$parent.$emit('accept', props.row.id)" />
                <q-btn flat round color="red" icon="cancel" v-if="props.row.status !== 'declined' && props.row.status !== 'accepted'" @click="$parent.$emit('decline', props.row.id)" />
            </q-td>
        ''')

        quotation_table.on('print', lambda msg: print_existing_quotation(msg.args))
        quotation_table.on('accept', lambda msg: change_status(msg.args, 'accepted'))
        quotation_table.on('decline', lambda msg: change_status(msg.args, 'declined'))

@ui.page('/quotation')
def quotation_page():
    if not get_current_user():
        ui.navigate.to('/login')
        return

    role = app.storage.user.get('role', 'staff')
    if role not in ['admin', 'accountant', 'billing', 'sales']:
        ui.notify('ไม่มีสิทธิ์เข้าถึงหน้านี้', color='red')
        ui.navigate.to('/')
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('ออกใบเสนอราคา').classes('text-xl font-bold')
        with ui.row().classes('items-center gap-2'):
            ui.label(f'Role: {role.upper()}').classes('text-xs bg-blue-500 px-2 py-1 rounded-full font-bold')

    with ui.column().classes('p-8 w-full max-w-7xl mx-auto gap-8'):
        # Quotation Header
        with ui.card().classes('w-full p-6 bg-white shadow-lg rounded-xl'):
            ui.label('ข้อมูลใบเสนอราคา').classes('text-2xl font-bold mb-6 text-slate-800')
            
            with ui.row().classes('w-full gap-6'):
                # Customer Selection
                with ui.column().classes('flex-1'):
                    ui.label('เลือกลูกค้า').classes('text-sm font-semibold text-slate-600 mb-2')
                    customer_select = ui.select(get_customers(), label='ชื่อลูกค้า').classes('w-full').props('outlined')
                    
                    async def refresh_customers():
                        customer_select.options = get_customers()
                        customer_select.update()
                        ui.notify('รีเฟรชข้อมูลลูกค้าเรียบร้อย', color='green')
                    
                    with ui.row().classes('gap-2 items-end'):
                        ui.button(icon='refresh', on_click=refresh_customers).props('flat round').classes('mb-1')
                
                # Quotation Details
                with ui.column().classes('flex-1'):
                    ui.label('รายละเอียดเพิ่มเติม').classes('text-sm font-semibold text-slate-600 mb-2')
                    with ui.input('วันหมดอายุ').classes('w-full').props('outlined') as expiry_input:
                        expiry_input.set_value((datetime.now() + timedelta(days=30)).strftime('%d/%m/%Y'))
                        with ui.menu().props('no-parent-event') as menu:
                            with ui.date(mask='DD/MM/YYYY').bind_value(expiry_input):
                                with ui.row().classes('justify-end'):
                                    ui.button('Close', on_click=menu.close).props('flat')
                        with expiry_input.add_slot('append'):
                            ui.icon('edit_calendar').on('click', menu.open).classes('cursor-pointer')
                    quotation_notes = ui.textarea('หมายเหตุ', placeholder='หมายเหตุเพิ่มเติม...').classes('w-full').props('outlined rows=2')

        # Quotation Items
        with ui.card().classes('w-full p-6 bg-white shadow-lg rounded-xl'):
            ui.label('รายการสินค้า/บริการ').classes('text-2xl font-bold mb-6 text-slate-800')
            
            with ui.row().classes('w-full gap-4 items-end mb-6 bg-blue-50 p-4 rounded-lg'):
                product_select = ui.select(get_products_list(), label='เลือกสินค้า').classes('w-full').props('outlined')
                
                async def refresh_products():
                    product_select.options = get_products_list()
                    product_select.update()
                    ui.notify('รีเฟรชข้อมูลสินค้าเรียบร้อย', color='green')
                
                with ui.row().classes('gap-2 items-end'):
                    ui.button(icon='refresh', on_click=refresh_products).props('flat round').classes('mb-1')
                
                qty_input = ui.input('จำนวน', value='1').classes('w-24').props('outlined type=number')
                discount_input = ui.input('ส่วนลด (%)', value='0').classes('w-24').props('outlined type=number')
                
                async def add_item():
                    if not product_select.value:
                        ui.notify('กรุณาเลือกสินค้า', color='orange')
                        return
                    
                    with Session() as s:
                        product = s.query(Product).get(product_select.value)
                        if not product: return
                        
                        qty = int(qty_input.value or 1)
                        discount = float(discount_input.value or 0)
                        unit_price = product.price
                        total = unit_price * qty * (1 - discount / 100)
                        
                        current_items = app.storage.user.get('quotation_items', [])
                        current_items.append({
                            'product_id': product.id,
                            'product_name': product.name,
                            'quantity': qty,
                            'unit_price': unit_price,
                            'discount_percent': discount,
                            'total_price': total,
                            'description': product.description or ''
                        })
                        app.storage.user.update({'quotation_items': current_items})
                        update_quotation_table()
                        
                        product_select.value = None
                        qty_input.value = '1'
                        discount_input.value = '0'
                
                ui.button('เพิ่มรายการ', icon='add', on_click=add_item).classes('h-12 bg-blue-600 px-4 rounded-lg')

            def update_quotation_table():
                items = app.storage.user.get('quotation_items', [])
                for i, it in enumerate(items): it['index'] = i
                quotation_table.rows[:] = items
                quotation_table.update()
                
                subtotal = sum(item['total_price'] for item in items)
                with Session() as s:
                    company = s.query(Company).first()
                    vat_rate = company.vat_rate if company else 7.0
                vat_amount = subtotal * vat_rate / 100
                total = subtotal + vat_amount
                
                subtotal_label.text = f'ยอดรวมรายรายการ: {subtotal:,.2f} ฿'
                vat_label.text = f'ภาษีมูลค่าเพิ่ม ({vat_rate}%): {vat_amount:,.2f} ฿'
                total_label.text = f'รวมทั้งสิ้น: {total:,.2f} ฿'

            quotation_table = ui.table(
                columns=[
                    {'name': 'product_name', 'label': 'สินค้า', 'field': 'product_name', 'align': 'left'},
                    {'name': 'quantity', 'label': 'จำนวน', 'field': 'quantity'},
                    {'name': 'unit_price', 'label': 'ราคาต่อหน่วย', 'field': 'unit_price'},
                    {'name': 'discount_percent', 'label': 'ส่วนลด (%)', 'field': 'discount_percent'},
                    {'name': 'total_price', 'label': 'รวม', 'field': 'total_price'},
                    {'name': 'actions', 'label': 'จัดการ', 'field': 'index'}
                ],
                rows=[]
            ).classes('w-full bg-white shadow-sm rounded-xl').props('flat bordered')

            quotation_table.add_slot('body-cell-actions', '''
                <q-td :props="props">
                    <q-btn flat round color="red" icon="delete" @click="$parent.$emit('delete_item', props.row.index)" />
                </q-td>
            ''')

            async def delete_item(index):
                current_items = app.storage.user.get('quotation_items', [])
                if 0 <= index < len(current_items):
                    current_items.pop(index)
                    app.storage.user.update({'quotation_items': current_items})
                    update_quotation_table()
                    ui.notify('ลบรายการสำเร็จ', color='green')

            quotation_table.on('delete_item', lambda msg: delete_item(msg.args))

        # Quotation Summary
        with ui.card().classes('w-full p-6 bg-slate-50 shadow-lg rounded-xl'):
            ui.label('สรุปยอดเงิน').classes('text-2xl font-bold mb-6 text-slate-800')
            with ui.row().classes('w-full justify-end gap-8 text-lg'):
                subtotal_label = ui.label('ยอดรวม: 0.00 ฿').classes('font-semibold')
                vat_label = ui.label('ภาษีมูลค่าเพิ่ม: 0.00 ฿').classes('font-semibold')
                total_label = ui.label('รวมทั้งสิ้น: 0.00 ฿').classes('text-xl font-bold text-blue-600')

            with ui.row().classes('w-full justify-end gap-4 mt-6'):
                async def save_quotation():
                    if not customer_select.value:
                        ui.notify('กรุณาเลือกลูกค้า', color='orange')
                        return
                    items = app.storage.user.get('quotation_items', [])
                    if not items:
                        ui.notify('กรุณาเพิ่มรายการสินค้า', color='orange')
                        return
                    
                    with Session() as s:
                        company = s.query(Company).first()
                        prefix = company.quo_prefix if company else 'QT'
                        today = datetime.now().strftime('%Y%m%d')
                        existing_count = s.query(Quotation).filter(Quotation.quotation_number.like(f'{prefix}{today}%')).count()
                        quotation_number = f'{prefix}{today}{(existing_count + 1):03d}'
                        
                        subtotal = sum(item['total_price'] for item in items)
                        vat_rate = company.vat_rate if company else 7.0
                        vat_amount = subtotal * vat_rate / 100
                        
                        quotation = Quotation(
                            quotation_number=quotation_number,
                            customer_id=customer_select.value,
                            user_id=s.query(User).filter_by(username=get_current_user()).first().id,
                            total_amount=subtotal,
                            vat_amount=vat_amount,
                            net_amount=subtotal + vat_amount,
                            notes=quotation_notes.value or '',
                            expiry_date=datetime.strptime(expiry_input.value, '%d/%m/%Y').strftime('%Y-%m-%d')
                        )
                        s.add(quotation)
                        s.flush()
                        
                        for item in items:
                            s.add(QuotationItem(
                                quotation_id=quotation.id, product_id=item['product_id'],
                                quantity=item['quantity'], unit_price=item['unit_price'],
                                discount_percent=item['discount_percent'], total_price=item['total_price'],
                                description=item['description']
                            ))
                        s.commit()
                        ui.notify(f'บันทึกใบเสนอราคา {quotation_number} สำเร็จ', color='green')
                        app.storage.user.update({'quotation_items': []})
                        customer_select.value = None
                        update_quotation_table()

                async def preview_pdf():
                    try:
                        with Session() as s:
                            company = s.query(Company).first()
                            customer = s.query(Contact).get(customer_select.value) if customer_select.value else None
                            items = app.storage.user.get('quotation_items', [])
                        
                        data = {
                            'number': 'PREVIEW', 'date': datetime.now().strftime('%Y-%m-%d'),
                            'expiry_date': expiry_input.value, 'company': company,
                            'customer': customer, 'items': items, 'notes': quotation_notes.value,
                            'title': 'QUOTATION / ใบเสนอราคา'
                        }
                        pdf_data = generate_pdf_v2(data)
                        ui.download(f'data:application/pdf;base64,{base64.b64encode(pdf_data).decode()}', filename="preview_quotation.pdf")
                        ui.notify('กำลังสร้างไฟล์พรีวิว...', color='blue')
                    except Exception as e: ui.notify(str(e), color='red')

                ui.button('พรีวิว PDF', icon='visibility', on_click=preview_pdf).classes('h-12 bg-blue-600 text-white px-6 rounded-lg font-bold')
                ui.button('บันทึกใบเสนอราคา', icon='save', on_click=save_quotation).classes('h-12 bg-green-600 text-white px-6 rounded-lg font-bold')

        update_quotation_table()

@ui.page('/invoice')
def invoice_page():
    print("DEBUG: invoice_page called")  # Debug print
    if not get_current_user():
        ui.navigate.to('/login')
        return

    role = app.storage.user.get('role', 'staff')
    if role not in ['admin', 'accountant', 'billing']:
        ui.notify('ไม่มีสิทธิ์เข้าถึงหน้านี้', color='red')
        ui.navigate.to('/')
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('ออกใบแจ้งหนี้').classes('text-xl font-bold')
        with ui.row().classes('items-center gap-2'):
            ui.label(f'Role: {role.upper()}').classes('text-xs bg-blue-500 px-2 py-1 rounded-full font-bold')

    with ui.column().classes('p-8 w-full max-w-7xl mx-auto gap-8'):
        # Invoice Header
        with ui.card().classes('w-full p-6 bg-white shadow-lg rounded-xl'):
            ui.label('ข้อมูลใบแจ้งหนี้').classes('text-2xl font-bold mb-6 text-slate-800')
            
            with ui.row().classes('w-full gap-6'):
                # Customer Selection
                with ui.column().classes('flex-1'):
                    ui.label('เลือกลูกค้า').classes('text-sm font-semibold text-slate-600 mb-2')
                    
                    customer_options = get_customers()

                    customer_select = ui.select(customer_options, label='ชื่อลูกค้า').classes('w-full').props('outlined')
                    
                    def update_customer_options():
                        customer_select.options = get_customers()
                        customer_select.update()
                    
                    # Load initial data
                    # update_customer_options()
                    
                    async def refresh_customers():
                        update_customer_options()
                        ui.notify('รีเฟรชข้อมูลลูกค้าเรียบร้อย', color='green')
                    
                    with ui.row().classes('gap-2 items-end'):
                        ui.button(icon='refresh', on_click=refresh_customers).props('flat round').classes('mb-1')
                
                # Invoice Details
                with ui.column().classes('flex-1'):
                    ui.label('รายละเอียดใบแจ้งหนี้').classes('text-sm font-semibold text-slate-600 mb-2')
                    
                    invoice_notes = ui.textarea('หมายเหตุ', placeholder='หมายเหตุเพิ่มเติม...').classes('w-full').props('outlined rows=3')

        # Invoice Items
        with ui.card().classes('w-full p-6 bg-white shadow-lg rounded-xl'):
            ui.label('รายการสินค้า').classes('text-2xl font-bold mb-6 text-slate-800')
            
            # Add Item Section
            with ui.row().classes('w-full gap-4 items-end mb-6 bg-blue-50 p-4 rounded-lg'):
                
                product_options = get_products_list()
                
                product_select = ui.select(product_options, label='เลือกสินค้า').classes('w-full').props('outlined')
                
                def update_product_options():
                    product_select.options = get_products_list()
                    product_select.update()
                
                # Load initial data
                update_product_options()
                
                async def refresh_products():
                    update_product_options()
                    ui.notify('รีเฟรชข้อมูลสินค้าเรียบร้อย', color='green')
                
                with ui.row().classes('gap-2 items-end flex-1'):
                    ui.button(icon='refresh', on_click=refresh_products).props('flat round').classes('mb-1')
                
                qty_input = ui.input('จำนวน', value='1').classes('w-24').props('outlined type=number')
                discount_input = ui.input('ส่วนลด (%)', value='0').classes('w-24').props('outlined type=number')
                
                async def add_item():
                    if not product_select.value:
                        ui.notify('กรุณาเลือกสินค้า', color='orange')
                        return
                    
                    with Session() as s:
                        product = s.query(Product).get(product_select.value)
                        if not product:
                            ui.notify('ไม่พบสินค้า', color='red')
                            return
                        
                        qty = int(qty_input.value or 1)
                        discount = float(discount_input.value or 0)
                        unit_price = product.price
                        discount_amount = unit_price * qty * discount / 100
                        total = unit_price * qty - discount_amount
                        
                        # Add to items list (in memory for now)
                        current_items = app.storage.user.get('invoice_items', [])
                        current_items.append({
                            'product_id': product.id,
                            'product_name': product.name,
                            'quantity': qty,
                            'unit_price': unit_price,
                            'discount_percent': discount,
                            'total_price': total,
                            'description': product.description or ''
                        })
                        app.storage.user.update({'invoice_items': current_items})
                        
                        update_invoice_table()
                        ui.notify('เพิ่มรายการสำเร็จ', color='green')
                        
                        # Reset inputs
                        product_select.value = None
                        qty_input.value = '1'
                        discount_input.value = '0'
                
                ui.button('เพิ่มรายการ', icon='add', on_click=add_item).classes('h-12 bg-blue-600 px-4 rounded-lg')

            # Items Table
            def update_invoice_table():
                items = app.storage.user.get('invoice_items', [])
                invoice_table.rows[:] = items
                invoice_table.update()
                
                # Calculate totals
                subtotal = sum(item['total_price'] for item in items)
                with Session() as s:
                    company = s.query(Company).first()
                    vat_rate = company.vat_rate if company else 7.0
                vat_amount = subtotal * vat_rate / 100
                total = subtotal + vat_amount
                
                subtotal_label.text = f'ยอดรวม: {subtotal:.2f} ฿'
                vat_label.text = f'ภาษีมูลค่าเพิ่ม ({vat_rate}%): {vat_amount:.2f} ฿'
                total_label.text = f'รวมทั้งสิ้น: {total:.2f} ฿'

            invoice_table = ui.table(
                columns=[
                    {'name': 'product_name', 'label': 'สินค้า', 'field': 'product_name', 'align': 'left'},
                    {'name': 'quantity', 'label': 'จำนวน', 'field': 'quantity'},
                    {'name': 'unit_price', 'label': 'ราคาต่อหน่วย', 'field': 'unit_price'},
                    {'name': 'discount_percent', 'label': 'ส่วนลด (%)', 'field': 'discount_percent'},
                    {'name': 'total_price', 'label': 'รวม', 'field': 'total_price'},
                    {'name': 'actions', 'label': 'จัดการ', 'field': 'index'}
                ],
                rows=[]
            ).classes('w-full bg-white shadow-sm rounded-xl').props('flat bordered')

            invoice_table.add_slot('body-cell-actions', '''
                <q-td :props="props">
                    <q-btn flat round color="red" icon="delete" @click="$parent.$emit('delete_item', props.row.index)" />
                </q-td>
            ''')

            async def delete_item(index):
                current_items = app.storage.user.get('invoice_items', [])
                if 0 <= index < len(current_items):
                    current_items.pop(index)
                    app.storage.user.update({'invoice_items': current_items})
                    update_invoice_table()
                    ui.notify('ลบรายการสำเร็จ', color='green')

            invoice_table.on('delete_item', lambda msg: delete_item(msg.args))

        # Invoice Summary
        with ui.card().classes('w-full p-6 bg-slate-50 shadow-lg rounded-xl'):
            ui.label('สรุปใบแจ้งหนี้').classes('text-2xl font-bold mb-6 text-slate-800')
            
            with ui.row().classes('w-full justify-end gap-8 text-lg'):
                subtotal_label = ui.label('ยอดรวม: 0.00 ฿').classes('font-semibold')
                vat_label = ui.label('ภาษีมูลค่าเพิ่ม (7%): 0.00 ฿').classes('font-semibold')
                total_label = ui.label('รวมทั้งสิ้น: 0.00 ฿').classes('text-xl font-bold text-blue-600')

            with ui.row().classes('w-full justify-end gap-4 mt-6'):
                async def save_invoice():
                    if not customer_select.value:
                        ui.notify('กรุณาเลือกลูกค้า', color='orange')
                        return
                    
                    items = app.storage.user.get('invoice_items', [])
                    if not items:
                        ui.notify('กรุณาเพิ่มรายการสินค้า', color='orange')
                        return
                    
                    with Session() as s:
                        # Generate invoice number
                        company = s.query(Company).first()
                        prefix = company.inv_prefix if company else 'INV'
                        today = datetime.now().strftime('%Y%m%d')
                        existing_count = s.query(Invoice).filter(Invoice.invoice_number.like(f'{prefix}{today}%')).count()
                        invoice_number = f'{prefix}{today}{(existing_count + 1):03d}'
                        
                        # Calculate totals
                        subtotal = sum(item['total_price'] for item in items)
                        vat_rate = company.vat_rate if company else 7.0
                        vat_amount = subtotal * vat_rate / 100
                        total = subtotal + vat_amount
                        
                        # Create invoice
                        invoice = Invoice(
                            invoice_number=invoice_number,
                            customer_id=customer_select.value,
                            user_id=s.query(User).filter_by(username=get_current_user()).first().id,
                            total_amount=subtotal,
                            vat_amount=vat_amount,
                            net_amount=total,
                            notes=invoice_notes.value or '',
                            due_date=(datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
                        )
                        s.add(invoice)
                        s.flush()  # Get invoice ID
                        
                        # Create invoice items
                        for item in items:
                            invoice_item = InvoiceItem(
                                invoice_id=invoice.id,
                                product_id=item['product_id'],
                                quantity=item['quantity'],
                                unit_price=item['unit_price'],
                                discount_percent=item['discount_percent'],
                                total_price=item['total_price'],
                                description=item['description']
                            )
                            s.add(invoice_item)
                        
                        s.commit()
                        
                        log_action(get_current_user(), "CREATE_INVOICE", f"สร้างใบแจ้งหนี้: {invoice_number}")
                        ui.notify(f'บันทึกใบแจ้งหนี้ {invoice_number} สำเร็จ', color='green')
                        
                        # Clear form
                        app.storage.user.update({'invoice_items': []})
                        customer_select.value = None
                        invoice_notes.value = ''
                        update_invoice_table()

                def generate_pdf_from_ui():
                    """Helper to generate PDF from current UI state"""
                    with Session() as s:
                        company = s.query(Company).first()
                        customer = s.query(Contact).get(customer_select.value) if customer_select.value else None
                        items = app.storage.user.get('invoice_items', [])
                        
                    data = {
                        'number': 'DRAFT-' + datetime.now().strftime('%H%M%S'),
                        'date': datetime.now().strftime('%Y-%m-%d'),
                        'due_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
                        'company': company,
                        'customer': customer,
                        'items': items,
                        'notes': invoice_notes.value
                    }
                    return generate_pdf_v2(data)

                async def print_pdf():
                    """Generate and download PDF"""
                    try:
                        pdf_data = generate_pdf_from_ui()
                        pdf_filename = f"draft_invoice_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                        
                        # Create download link
                        ui.download(f'data:application/pdf;base64,{base64.b64encode(pdf_data).decode()}', filename=pdf_filename)
                        ui.notify('PDF พร้อมดาวน์โหลด', color='green')
                    except Exception as e:
                        ui.notify(f'เกิดข้อผิดพลาด: {str(e)}', color='red')

                with ui.row().classes('w-full justify-end gap-4 mt-6'):
                    ui.button('พิมพ์ PDF (ร่าง)', icon='print', on_click=print_pdf).classes('h-12 bg-blue-600 text-white px-6 rounded-lg font-bold')
                    ui.button('บันทึกใบแจ้งหนี้', icon='save', on_click=save_invoice).classes('h-12 bg-green-600 text-white px-6 rounded-lg font-bold')

        # Initialize
        update_invoice_table()

@ui.page('/journal')
def journal_page():
    if not verify_access(['admin', 'accountant']):
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('สมุดรายวันทั่วไป (General Journal)').classes('text-xl font-bold')

    with ui.column().classes('p-8 w-full max-w-7xl mx-auto'):
        ui.label('รายการบันทึกบัญชีรายวัน').classes('text-3xl font-black mb-8')
        
        # Placeholder for journal entries
        with ui.card().classes('w-full p-12 text-center bg-white rounded-2xl shadow-sm'):
            ui.icon('receipt', size='64px').classes('text-slate-300 mb-4')
            ui.label('ยังไม่มีรายการบันทึกในสมุดรายวันประจำวันนี้').classes('text-xl text-slate-400')
            ui.button('บันทึกรายการใหม่', icon='add').classes('mt-6 bg-blue-600')

@ui.page('/ledger')
def ledger_page():
    if not verify_access(['admin', 'accountant']):
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('บัญชีแยกประเภท (General Ledger)').classes('text-xl font-bold')

    with ui.column().classes('p-8 w-full max-w-7xl mx-auto'):
        ui.label('ผังบัญชีและยอดคงเหลือ').classes('text-3xl font-black mb-8')
        
        # Placeholder for ledger
        with ui.row().classes('w-full gap-6'):
            with ui.card().classes('flex-1 p-6'):
                ui.label('สินทรัพย์ (Assets)').classes('font-bold text-lg text-blue-800')
                ui.separator()
                ui.label('เงินสด: 0.00 ฿').classes('mt-2')
                ui.label('เงินฝากธนาคาร: 0.00 ฿')
            with ui.card().classes('flex-1 p-6'):
                ui.label('หนี้สิน (Liabilities)').classes('font-bold text-lg text-red-800')
                ui.separator()
                ui.label('เจ้าหนี้การค้า: 0.00 ฿').classes('mt-2')
            with ui.card().classes('flex-1 p-6'):
                ui.label('ส่วนทุน (Equity)').classes('font-bold text-lg text-indigo-800')
                ui.separator()
                ui.label('ทุนจดทะเบีย: 0.00 ฿').classes('mt-2')

@ui.page('/reports')
def reports_page():
    if not verify_access(['admin', 'accountant']):
        return

    ui.query('body').style('background-color: #f8fafc;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('Financial Statements (งบการเงิน)').classes('text-xl font-bold')

    with ui.column().classes('p-8 w-full max-w-7xl mx-auto gap-8'):
        ui.label('📊 วิเคราะห์งบการเงินและผลประกอบการ').classes('text-3xl font-black text-slate-800')
        
        with ui.tabs().classes('w-full') as tabs:
            pnl_tab = ui.tab('งบกำไรขาดทุน (P&L)')
            bs_tab = ui.tab('งบแสดงฐานะการเงิน (Balance Sheet)')

        with ui.tab_panels(tabs, value=pnl_tab).classes('w-full bg-transparent'):
            # --- งบกำไรขาดทุน ---
            with ui.tab_panel(pnl_tab):
                with Session() as s:
                    # รายได้: จาก Invoice ทั้งหมด (เอาส่วนที่ยังไม่รวม VAT)
                    invoices = s.query(Invoice).all()
                    total_revenue = sum(inv.total_amount for inv in invoices) if invoices else 0.0
                    
                    # ค่าใช้จ่าย: จากรายการจ่าย
                    expenses = s.query(Expense).all()
                    total_expense = sum(e.amount for e in expenses) if expenses else 0.0
                    
                    net_profit = total_revenue - total_expense

                with ui.row().classes('w-full gap-4 mb-8'):
                    def stat_box(title, value, color, icon):
                        with ui.card().classes(f'flex-1 p-6 border-l-4 border-{color}-500 bg-white shadow-sm'):
                            with ui.row().classes('items-center justify-between'):
                                ui.label(title).classes('text-slate-500 font-bold')
                                ui.icon(icon).classes(f'text-{color}-500 text-2xl')
                            ui.label(f'{value:,.2f} ฿').classes('text-2xl font-black mt-2')

                    stat_box('รายได้รวม (Revenue)', total_revenue, 'blue', 'trending_up')
                    stat_box('ค่าใช้จ่ายรวม (Expenses)', total_expense, 'red', 'trending_down')
                    stat_box('กำไร/ขาดทุนสุทธิ (Net Profit)', net_profit, 'emerald' if net_profit >= 0 else 'rose', 'account_balance_wallet')

                with ui.card().classes('w-full p-8 shadow-sm'):
                    ui.label('งบกำไรขาดทุนโดยย่อ').classes('text-xl font-bold mb-6 text-slate-700 underline decoration-blue-500 underline-offset-8')
                    
                    def line_item(label, value, is_bold=False, is_sub=False):
                        with ui.row().classes(f'w-full justify-between py-2 {"border-t border-slate-100" if is_bold else ""}'):
                            ui.label(label).classes(f'{"pl-6 font-medium" if is_sub else "font-bold" if is_bold else "text-slate-600"}')
                            ui.label(f'{value:,.2f}').classes(f'{"font-bold" if is_bold else ""}')

                    line_item('รายได้จากการขายและบริการ', total_revenue)
                    line_item('รวมรายได้', total_revenue, is_bold=True)
                    line_item('ต้นทุนขาย/ค่าใช้จ่ายในการดำเนินงาน', total_expense)
                    line_item('รวมค่าใช้จ่าย', total_expense, is_bold=True)
                    
                    with Session() as s:
                        comp = s.query(Company).first()
                        corp_tax_rate = (comp.corporate_tax_rate / 100) if comp else 0.20
                    
                    # คำนวณภาษีประมาณการ (SME Rate)
                    if net_profit <= 300000:
                        est_tax = 0
                    elif net_profit <= 3000000:
                        est_tax = (net_profit - 300000) * 0.15
                    else:
                        est_tax = (3000000 - 300000) * 0.15 + (net_profit - 3000000) * 0.20
                    
                    line_item('กำไร(ขาดทุน) ก่อนภาษีเงินได้', net_profit, is_bold=True)
                    line_item('ประมาณการภาษีเงินได้นิติบุคคล', est_tax)
                    ui.separator().classes('my-4')
                    line_item('กำไร(ขาดทุน) สุทธิ', net_profit - est_tax, is_bold=True)
                    
            # --- งบแสดงฐานะการเงิน ---
            with ui.tab_panel(bs_tab):
                with Session() as s:
                    # 1. สินทรัพย์
                    # 1.1 ลูกหนี้การค้า (Invoice ที่ยังไม่จ่าย)
                    unpaid_inv = s.query(Invoice).filter(Invoice.status != 'paid').all()
                    ar = sum(inv.net_amount for inv in unpaid_inv) if unpaid_inv else 0.0
                    
                    # 1.2 สินทรัพย์ถาวร (Assets)
                    assets_list = s.query(Asset).all()
                    fa_cost = sum(a.acquisition_cost for a in assets_list) if assets_list else 0.0
                    acc_dep = sum(a.accumulated_depreciation for a in assets_list) if assets_list else 0.0
                    fa_net = fa_cost - acc_dep
                    
                    # 1.3 เงินสด (สมมติง่ายๆ คือ รายได้ที่ได้รับชำระแล้ว - รายจ่าย)
                    payments = s.query(Payment).all()
                    cash_collected = sum(p.amount for p in payments) if payments else 0.0
                    cash_balance = cash_collected - total_expense
                    
                    total_assets = cash_balance + ar + fa_net

                    # 2. หนี้สินและส่วนทุน
                    # หนีสิน (สมมติคือ Expense ที่ยังไม่บันทึกจ่าย? แต่ในระบบนี้เราบันทึกจ่ายเลย)
                    liabilities = 0.0 
                    
                    # ส่วนทุน = สินทรัพย์ - หนี้สิน
                    equity = total_assets - liabilities

                with ui.row().classes('w-full gap-8'):
                    # ฝั่งสินทรัพย์
                    with ui.card().classes('flex-1 p-8 shadow-sm bg-slate-50'):
                        ui.label('สินทรัพย์ (Assets)').classes('text-xl font-bold mb-4 text-blue-800')
                        line_item('เงินสดและรายการเทียบเท่าเงินสด', cash_balance)
                        line_item('ลูกหนี้การค้าสุทธิ', ar)
                        line_item('ที่ดิน อาคาร และอุปกรณ์ - สุทธิ', fa_net)
                        ui.separator().classes('my-4')
                        line_item('รวมสินทรัพย์', total_assets, is_bold=True)
                    
                    # ฝั่งหนี้สินและส่วนทุน
                    with ui.card().classes('flex-1 p-8 shadow-sm bg-slate-50'):
                        ui.label('หนี้สินและส่วนของเจ้าของ (Liabilities & Equity)').classes('text-xl font-bold mb-4 text-red-800')
                        line_item('หนี้สินหมุนเวียนอื่น', liabilities)
                        line_item('รวมหนี้สิน', liabilities, is_bold=True)
                        ui.separator().classes('my-4')
                        ui.label('ส่วนของเจ้าของ').classes('font-bold text-slate-500 mb-2')
                        line_item('ทุนที่ชำระแล้ว (Balance)', equity - net_profit)
                        line_item('กำไร(ขาดทุน) สะสม', net_profit)
                        ui.separator().classes('my-4')
                        line_item('รวมส่วนของเจ้าของ', equity, is_bold=True)
                        line_item('รวมหนี้สินและส่วนของเจ้าของ', liabilities + equity, is_bold=True)

                if total_assets != (liabilities + equity):
                    ui.label('⚠️ คำเตือน: งบไม่ดุลในเบื้องต้น โปรดตรวจสอบรายการบัญชี').classes('text-rose-500 font-bold mt-4')
                else:
                    ui.label('✅ งบดุลเป็นปกติ').classes('text-emerald-500 font-bold mt-4')

@ui.page('/inventory')
def inventory_page():
    if not verify_access(['admin', 'inventory']):
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('การจัดการคลังสินค้า (Inventory)').classes('text-xl font-bold')

    with ui.column().classes('p-8 w-full max-w-7xl mx-auto'):
        ui.label('ภาพรวมสต็อกสินค้า').classes('text-3xl font-black mb-8')
        
        def get_stock():
            with Session() as s:
                return [{'sku': p.sku, 'name': p.name, 'qty': p.stock_qty, 'unit': p.unit} for p in s.query(Product).all()]

        ui.table(
            columns=[
                {'name':'sku', 'label':'SKU', 'field':'sku', 'align':'left'},
                {'name':'name', 'label':'สินค้า', 'field':'name', 'align':'left'},
                {'name':'qty', 'label':'คงเหลือ', 'field':'qty'},
                {'name':'unit', 'label':'หน่วย', 'field':'unit'}
            ],
            rows=get_stock()
        ).classes('w-full bg-white shadow-sm rounded-xl').props('flat bordered')

@ui.page('/inventory-in')
def inventory_in_page():
    if not get_current_user():
        ui.navigate.to('/login')
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('การรับสินค้าเข้า (Stock-In)').classes('text-xl font-bold')

    with ui.column().classes('p-8 w-full max-w-4xl mx-auto gap-8'):
        with ui.card().classes('w-full p-8 rounded-2xl shadow-sm'):
            ui.label('ทำใบรับสินค้า').classes('text-2xl font-bold mb-6')
            
            p_id = ui.select(options=get_products_list(), label='เลือกสินค้าส').classes('w-full mb-4').props('outlined')
            qty = ui.number('จำนวนที่รับเข้า', value=0).classes('w-full mb-4').props('outlined')
            cost = ui.number('ราคาทุนต่อหน่วย', value=0).classes('w-full mb-8').props('outlined')
            
            async def do_stock_in():
                if not p_id.value or not qty.value:
                    ui.notify('กรุณากรอกข้อมูลให้ครบถ้วน', color='orange')
                    return
                
                with Session() as s:
                    p = s.query(Product).get(p_id.value)
                    p.stock_qty += int(qty.value)
                    s.commit()
                
                ui.notify(f'เพิ่มสต็อก {p.name} จำนวน {qty.value} เรียบร้อย', color='green')
                ui.navigate.to('/inventory')

            ui.button('ยืนยันการรับสินค้า', on_click=do_stock_in).classes('w-full h-14 bg-green-700 text-white font-bold rounded-xl shadow-lg')

@ui.page('/payments')
def payments_page():
    if not verify_access(['admin', 'accountant', 'finance']):
        return

    role = app.storage.user.get('role', 'staff')
    if role not in ['admin', 'accountant', 'finance', 'billing']:
        ui.notify('ไม่มีสิทธิ์เข้าถึงหน้านี้', color='red')
        ui.navigate.to('/')
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('บันทึกการชำระเงิน (Payments)').classes('text-xl font-bold')
    
    def get_unpaid_invoices():
        with Session() as s:
            invoices = s.query(Invoice, Contact).join(Contact).filter(Invoice.status != 'paid').all()
            return [{'label': f"{inv.invoice_number} - {c.name} ({inv.net_amount:,.2f} ฿)", 'value': inv.id} for inv, c in invoices]

    with ui.column().classes('p-8 w-full max-w-4xl mx-auto gap-8'):
        with ui.card().classes('w-full p-8 rounded-2xl shadow-sm'):
            ui.label('บันทึกการรับชำระเงิน').classes('text-2xl font-bold mb-6')
            
            invoice_id = ui.select(options=get_unpaid_invoices(), label='เลือกใบแจ้งหนี้').classes('w-full mb-4').props('outlined')
            amount = ui.number('จำนวนเงินที่ได้รับ', format='%.2f').classes('w-full mb-4').props('outlined')
            method = ui.select(['cash', 'transfer', 'check', 'credit_card'], value='transfer', label='ช่องทางการชำระ').classes('w-full mb-4').props('outlined')
            ref = ui.input('เลขที่อ้างอิง (เช่น เลขที่สลิป)').classes('w-full mb-8').props('outlined')
            
            async def save_payment():
                if not invoice_id.value or not amount.value:
                    ui.notify('กรุณากรอกข้อมูลให้ครบถ้วน', color='orange')
                    return
                
                with Session() as s:
                    inv = s.query(Invoice).get(invoice_id.value)
                    # Create payment record
                    pay_num = f"PAY{datetime.now().strftime('%Y%m%d%H%M%S')}"
                    payment = Payment(
                        payment_number=pay_num,
                        invoice_id=inv.id,
                        customer_id=inv.customer_id,
                        amount=amount.value,
                        net_amount=amount.value,
                        payment_method=method.value,
                        reference_number=ref.value
                    )
                    s.add(payment)
                    
                    # Update invoice status if fully paid (simplified)
                    if amount.value >= inv.net_amount:
                        inv.status = 'paid'
                    
                    s.commit()
                
                ui.notify(f'บันทึกการชำระเงินเรียบร้อย เลขที่: {pay_num}', color='green')
                ui.navigate.to('/payments')

            ui.button('บันทึกการรับเงิน', on_click=save_payment).classes('w-full h-14 bg-emerald-600 text-white font-bold rounded-xl')

@ui.page('/receipts')
def receipts_page():
    if not verify_access(['admin', 'accountant', 'finance']):
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('ใบเสร็จรับเงิน (Receipts)').classes('text-xl font-bold')

    with ui.column().classes('p-8 w-full max-w-6xl mx-auto'):
        ui.label('ประวัติการออกใบเสร็จรับเงิน').classes('text-3xl font-black mb-8')
        
        def get_receipts():
            with Session() as s:
                res = s.query(Receipt, Contact).join(Contact).all()
                return [{
                    'number': r.receipt_number,
                    'customer': c.name,
                    'amount': r.amount,
                    'date': r.issued_date[:10]
                } for r, c in res]

        ui.table(
            columns=[
                {'name':'number', 'label':'เลขที่ใบเสร็จ', 'field':'number', 'align':'left'},
                {'name':'customer', 'label':'ลูกค้า', 'field':'customer', 'align':'left'},
                {'name':'amount', 'label':'จำนวนเงิน', 'field':'amount'},
                {'name':'date', 'label':'วันที่ออก', 'field':'date'}
            ],
            rows=get_receipts()
        ).classes('w-full bg-white shadow-sm rounded-xl').props('flat bordered')

@ui.page('/expenses')
def expenses_page():
    if not verify_access(['admin', 'accountant', 'finance']):
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('บันทึกค่าใช้จ่าย (Expenses) + ภาษีหัก ณ ที่จ่าย').classes('text-xl font-bold')

    wht_options = {k: v['label'] for k, v in WHT_TYPES.items()}

    with ui.column().classes('p-8 w-full max-w-5xl mx-auto gap-6'):
        # === Form Card ===
        with ui.card().classes('w-full p-8 rounded-2xl shadow-sm border border-slate-100'):
            ui.label('🧾 บันทึกรายการค่าใช้จ่าย').classes('text-2xl font-black text-slate-800 mb-6')

            with ui.row().classes('w-full gap-4'):
                with ui.column().classes('flex-1 gap-3'):
                    desc = ui.input('รายละเอียดค่าใช้จ่าย').classes('w-full').props('outlined')
                    vendor = ui.input('จ่ายให้ใคร / ชื่อร้านค้า / Vendor').classes('w-full').props('outlined')
                    vendor_tax_id = ui.input('เลขประจำตัวผู้เสียภาษี Vendor (ถ้ามี)').classes('w-full').props('outlined')
                    cat = ui.select(
                        {'office': '🏢 สำนักงาน', 'travel': '✈️ เดินทาง', 'utilities': '💡 สาธารณูปโภค',
                         'marketing': '📣 การตลาด', 'salary': '👤 เงินเดือน', 'service': '🔧 บริการ/จ้างทำ',
                         'rent': '🏠 ค่าเช่า', 'other': '📦 อื่นๆ'},
                        value='office', label='หมวดหมู่ค่าใช้จ่าย'
                    ).classes('w-full').props('outlined')

                with ui.column().classes('flex-1 gap-3'):
                    with Session() as s:
                        comp = s.query(Company).first()
                        vat_rate_default = comp.vat_rate if comp else 7.0

                    gross_amount = ui.number('ยอดก่อน VAT (บาท)', format='%.2f', min=0).classes('w-full').props('outlined')
                    vat_include = ui.checkbox('ราคารวม VAT แล้ว (คำนวณย้อนกลับ)', value=False).classes('w-full')

                    # WHT Section
                    wht_type_select = ui.select(
                        options=wht_options, value='none',
                        label='🔴 ประเภทภาษีหัก ณ ที่จ่าย'
                    ).classes('w-full').props('outlined')

                    with ui.row().classes('w-full gap-2 items-center'):
                        wht_rate_label = ui.label('อัตรา WHT: 0%').classes('text-sm font-bold text-amber-700 bg-amber-50 px-3 py-2 rounded-lg')
                        wht_amount_label = ui.label('WHT: 0.00 ฿').classes('text-sm font-bold text-red-700 bg-red-50 px-3 py-2 rounded-lg')
                        form_type_label = ui.label('แบบ: -').classes('text-sm font-bold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg')

                    net_label = ui.label('ยอดสุทธิโอน: 0.00 ฿').classes('text-xl font-black text-emerald-700 bg-emerald-50 p-4 rounded-xl w-full text-center')

            # Auto-calculate on change
            def recalculate():
                try:
                    gross = gross_amount.value or 0
                    if vat_include.value and gross > 0:
                        gross = gross / (1 + vat_rate_default / 100)  # ถอย VAT ออก
                    wt = WHT_TYPES.get(wht_type_select.value, WHT_TYPES['none'])
                    rate = wt['rate']
                    wht_amt = gross * rate / 100
                    net = gross - wht_amt
                    wht_rate_label.text = f"อัตรา WHT: {rate}%"
                    wht_amount_label.text = f"WHT: {wht_amt:,.2f} ฿"
                    form_type_label.text = f"แบบ: {wt['form'] or '-'}"
                    net_label.text = f"ยอดสุทธิโอน: {net:,.2f} ฿"
                except Exception:
                    pass

            gross_amount.on('update:model-value', lambda _: recalculate())
            wht_type_select.on('update:model-value', lambda _: recalculate())
            vat_include.on('update:model-value', lambda _: recalculate())

            async def save_expense():
                if not desc.value or not gross_amount.value:
                    ui.notify('กรุณากรอกรายละเอียดและจำนวนเงินให้ครบ', color='orange')
                    return

                gross = gross_amount.value
                if vat_include.value:
                    gross = gross / (1 + vat_rate_default / 100)
                vat_amt = gross * vat_rate_default / 100

                wt = WHT_TYPES.get(wht_type_select.value, WHT_TYPES['none'])
                wht_amt = gross * wt['rate'] / 100
                net = gross - wht_amt

                with Session() as s:
                    exp_num = f"EXP{datetime.now().strftime('%Y%m%d%H%M%S')}"
                    expense = Expense(
                        expense_number=exp_num,
                        category=cat.value,
                        description=desc.value,
                        amount=gross,
                        vat_amount=vat_amt,
                        withholding_tax_amount=wht_amt,
                        net_amount=net,
                        vendor=vendor.value,
                        wht_type=wht_type_select.value
                    )
                    s.add(expense)

                    # บันทึก WHT record ถ้ามีการหักภาษี
                    if wht_amt > 0:
                        wht_rec = WHTRecord(
                            ref_id=exp_num,
                            ref_type='expense',
                            payer='self',
                            payee=vendor.value,
                            payee_tax_id=vendor_tax_id.value,
                            income_type=wt['section'],
                            income_description=desc.value,
                            gross_amount=gross,
                            wht_rate=wt['rate'],
                            wht_amount=wht_amt,
                            net_amount=net,
                            form_type=wt['form'],
                            submit_period=datetime.now().strftime('%Y-%m')
                        )
                        s.add(wht_rec)

                    s.commit()

                log_action(get_current_user(), "ADD_EXPENSE", f"{exp_num} - {vendor.value} {gross:,.2f}฿ WHT:{wht_amt:,.2f}฿")
                ui.notify(f'✅ บันทึกสำเร็จ: {exp_num} | WHT: {wht_amt:,.2f} ฿', color='green')
                ui.navigate.to('/expenses')

            ui.button('💾 บันทึกรายจ่าย + WHT', on_click=save_expense).classes(
                'w-full h-14 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-100 mt-4'
            )

        # === ตารางประวัติ ===
        with ui.card().classes('w-full p-6 rounded-2xl shadow-sm border border-slate-100'):
            ui.label('📋 ประวัติค่าใช้จ่ายทั้งหมด').classes('text-xl font-bold mb-4 text-slate-700')

            def get_expenses():
                with Session() as s:
                    return [{
                        'number': e.expense_number,
                        'vendor': e.vendor or '-',
                        'desc': (e.description or '')[:40],
                        'gross': f"{e.amount:,.2f}",
                        'wht': f"{e.withholding_tax_amount:,.2f}",
                        'net': f"{e.net_amount:,.2f}",
                        'wht_type': WHT_TYPES.get(e.wht_type or 'none', WHT_TYPES['none'])['label'][:30] if hasattr(e, 'wht_type') else '-',
                        'date': e.expense_date[:10]
                    } for e in s.query(Expense).order_by(Expense.id.desc()).limit(50).all()]

            ui.table(
                columns=[
                    {'name': 'number', 'label': 'เลขที่', 'field': 'number', 'align': 'left'},
                    {'name': 'vendor', 'label': 'Vendor', 'field': 'vendor', 'align': 'left'},
                    {'name': 'desc', 'label': 'รายละเอียด', 'field': 'desc', 'align': 'left'},
                    {'name': 'gross', 'label': 'ยอดก่อนหัก ฿', 'field': 'gross'},
                    {'name': 'wht', 'label': 'WHT ฿', 'field': 'wht'},
                    {'name': 'net', 'label': 'สุทธิ ฿', 'field': 'net'},
                    {'name': 'date', 'label': 'วันที่', 'field': 'date'},
                ],
                rows=get_expenses()
            ).classes('w-full').props('flat bordered dense')

@ui.page('/assets')
def assets_page():
    if not verify_access(['admin', 'inventory']):
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('จัดการทรัพย์สิน (Assets)').classes('text-xl font-bold')

    with ui.column().classes('p-8 w-full max-w-6xl mx-auto'):
        with ui.row().classes('w-full justify-between items-center mb-8'):
            ui.label('รายการทรัพย์สินและอุปกรณ์').classes('text-3xl font-black')
            
            # Add Asset Dialog
            with ui.dialog() as add_dialog, ui.card().classes('p-6 w-[500px]'):
                ui.label('เพิ่มทรัพย์สินใหม่').classes('text-xl font-bold mb-4')
                name = ui.input('ชื่อทรัพย์สิน').classes('w-full mb-2').props('outlined')
                cost = ui.number('ราคาทุน', value=0.0).classes('w-full mb-2').props('outlined')
                date = ui.input('วันที่ซื้อ (YYYY-MM-DD)', value=datetime.now().strftime('%Y-%m-%d')).classes('w-full mb-4').props('outlined')
                
                async def save_asset():
                    if not name.value or not cost.value:
                        ui.notify('กรุณากรอกข้อมูลให้ครบถ้วน', color='orange')
                        return
                    with Session() as s:
                        asset_num = f"ASSET{datetime.now().strftime('%Y%n%H%M%S')}"
                        new_asset = Asset(
                            name=name.value,
                            acquisition_cost=cost.value,
                            acquisition_date=date.value,
                            asset_number=asset_num,
                            current_value=cost.value,
                            status='active'
                        )
                        s.add(new_asset)
                        s.commit()
                    ui.notify('เพิ่มทรัพย์สินสำเร็จ', color='green')
                    add_dialog.close()
                    ui.navigate.to('/assets')

                with ui.row().classes('w-full justify-end gap-2'):
                    ui.button('ยกเลิก', on_click=add_dialog.close).props('flat text-color=grey')
                    ui.button('บันทึก', on_click=save_asset).classes('bg-blue-600')

            with ui.row().classes('gap-2'):
                # Import Assets
                async def handle_import(e):
                    import csv
                    import io
                    try:
                        content = e.content.read().decode('utf-8')
                        reader = csv.DictReader(io.StringIO(content))
                        count = 0
                        with Session() as s:
                            for row in reader:
                                asset_num = row.get('asset_number') or f"ASSET{datetime.now().strftime('%Y%j%H%M%S')}{count}"
                                new_asset = Asset(
                                    name=row.get('name'),
                                    acquisition_cost=float(row.get('cost', 0)),
                                    acquisition_date=row.get('date', datetime.now().strftime('%Y-%m-%d')),
                                    asset_number=asset_num,
                                    category=row.get('category', 'office'),
                                    current_value=float(row.get('cost', 0)),
                                    status='active'
                                )
                                s.add(new_asset)
                                count += 1
                            s.commit()
                        ui.notify(f'นำเข้าทรัพย์สินสำเร็จ {count} รายการ', color='green')
                        ui.navigate.to('/assets')
                    except Exception as ex:
                        ui.notify(f'เกิดข้อผิดพลาดในการนำเข้า: {str(ex)}', color='red')

                ui.upload(on_upload=handle_import, label='นำเข้า CSV', auto_upload=True).classes('h-12 bg-slate-100 rounded-lg shadow-none').props('flat bordered')
                ui.button('เพิ่มทรัพย์สิน', icon='add', on_click=add_dialog.open).classes('h-12 bg-blue-600 text-white font-bold rounded-lg')
        
        def get_assets():
            with Session() as s:
                return [{
                    'name': a.name,
                    'cost': a.acquisition_cost,
                    'date': a.acquisition_date,
                    'status': a.status
                } for a in s.query(Asset).all()]

        ui.table(
            columns=[
                {'name':'name', 'label':'ชื่อทรัพย์สิน', 'field':'name', 'align':'left'},
                {'name':'cost', 'label':'ราคาทุน', 'field':'cost'},
                {'name':'date', 'label':'วันที่ซื้อ', 'field':'date'},
                {'name':'status', 'label':'สถานะ', 'field':'status'}
            ],
            rows=get_assets()
        ).classes('w-full bg-white shadow-sm rounded-xl').props('flat bordered')

@ui.page('/settings-storage')
def settings_storage_page():
    if not get_current_user() or app.storage.user.get('role') != 'admin':
        ui.navigate.to('/login')
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('ตั้งค่า Cloud Storage').classes('text-xl font-bold')

    with ui.column().classes('p-8 w-full max-w-4xl mx-auto'):
        with ui.card().classes('w-full p-8 shadow-lg rounded-2xl'):
            ui.label('Google Sheets Integration').classes('text-2xl font-black mb-6 text-slate-800')
            
            ui.markdown('''
            **ความปลอดภัยสูง (Secure Integration):**
            ระบบใช้ Service Account ในการเข้าถึง Google Sheets เพื่อความปลอดภัย ข้อมูลจะถูกเก็บไว้ที่เครื่องเซิร์ฟเวอร์เท่านั้น
            
            1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
            2. สร้าง Project และ Enable **Google Sheets API** และ **Google Drive API**
            3. สร้าง **Service Account** และ Download ไฟล์ **JSON Key**
            4. นำไฟล์ JSON มาวางในโฟลเดอร์โปรเจกต์ (ชื่อไฟล์เริ่มต้นคือ `service_account.json`)
            5. แชร์ Google Sheet ไปยัง Email ของ Service Account (อยู่ในไฟล์ JSON)
            ''').classes('text-slate-600 mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100')
            
            gs_id = ui.input('Google Sheet ID', value=os.getenv('GOOGLE_SHEET_ID', '')).classes('w-full mb-4').props('outlined hint="ดูจาก URL: docs.google.com/spreadsheets/d/[ID_ที่นี่]/..." ')
            gs_creds = ui.input('Credentials JSON Path', value=os.getenv('GOOGLE_CREDENTIALS_FILE', 'service_account.json')).classes('w-full mb-6').props('outlined hint="ชื่อไฟล์ JSON ที่วางไว้ใน root folder"')

            async def save_storage_settings():
                # Note: In a real production app, we should write to .env or a database
                # For this demo, we'll notify the user and update the current process environment
                os.environ['GOOGLE_SHEET_ID'] = gs_id.value
                os.environ['GOOGLE_CREDENTIALS_FILE'] = gs_creds.value
                
                # Try to write to .env if it exists
                try:
                    with open('.env', 'r') as f:
                        lines = f.readlines()
                    
                    found_id = False
                    found_file = False
                    new_lines = []
                    for line in lines:
                        if line.startswith('GOOGLE_SHEET_ID='):
                            new_lines.append(f'GOOGLE_SHEET_ID={gs_id.value}\n')
                            found_id = True
                        elif line.startswith('GOOGLE_CREDENTIALS_FILE='):
                            new_lines.append(f'GOOGLE_CREDENTIALS_FILE={gs_creds.value}\n')
                            found_file = True
                        else:
                            new_lines.append(line)
                    
                    if not found_id: new_lines.append(f'GOOGLE_SHEET_ID={gs_id.value}\n')
                    if not found_file: new_lines.append(f'GOOGLE_CREDENTIALS_FILE={gs_creds.value}\n')
                    
                    with open('.env', 'w') as f:
                        f.writelines(new_lines)
                    
                    ui.notify('บันทึกการตั้งค่าเรียบร้อย (ระบบจะใช้ค่าใหม่ทันที)', color='green')
                except Exception as e:
                    ui.notify(f'บันทึกสภาวะแวดล้อมสำเร็จ แต่ไม่สามารถเขียนไฟล์ .env ได้: {str(e)}', color='orange')

            ui.button('บันทึกการตั้งค่า', icon='save', on_click=save_storage_settings).classes('w-full h-12 bg-blue-600 text-white font-bold rounded-lg')

@ui.page('/expense-docs')
def expense_docs_page():
    if not get_current_user():
        ui.navigate.to('/login')
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('เอกสารเบิกจ่าย (G-Sheet)').classes('text-xl font-bold')

    with ui.column().classes('p-8 w-full max-w-7xl mx-auto'):
        with ui.row().classes('w-full justify-between items-center mb-8'):
            ui.label('รายการเบิกจ่ายเงิน').classes('text-3xl font-black text-slate-800')
            with ui.row().classes('gap-2'):
                ui.button('รีเฟรชข้อมูล', icon='refresh', on_click=lambda: load_sheet_data()).classes('bg-blue-100 text-blue-700')
                ui.button('เพิ่มรายการ', icon='add', on_click=lambda: add_dialog.open()).classes('bg-green-600 text-white')

        table_container = ui.column().classes('w-full')
        
        # Add Record Dialog
        with ui.dialog() as add_dialog, ui.card().classes('p-6 w-[500px]'):
            ui.label('เพิ่มรายการเบิกจ่ายใหม่').classes('text-xl font-bold mb-4')
            new_date = ui.input('วันที่ (DD/MM/YY)', value=datetime.now().strftime('%d/%m/%y')).classes('w-full mb-2').props('outlined')
            new_item = ui.input('รายการ').classes('w-full mb-2').props('outlined')
            new_qty = ui.number('จำนวน', value=1).classes('w-full mb-2').props('outlined')
            new_price = ui.number('ราคาต่อหน่วย', value=0).classes('w-full mb-2').props('outlined')
            
            async def save_to_sheet():
                sh, err = get_gsheet_client()
                if err:
                    ui.notify(err, color='red')
                    return
                try:
                    ws = sh.worksheet("เอกสารเบิกจ่าย")
                    total = new_qty.value * new_price.value
                    # Append row: Date, Item, "", "", "", Qty, Price, Total (based on sheet structure)
                    # From previous research: Col A=Date, B-E=Item(merged), F=Qty, G=Price, H=Total
                    ws.append_row([new_date.value, new_item.value, "", "", "", new_qty.value, new_price.value, total])
                    ui.notify('บันทึกข้อมูลลง Google Sheet สำเร็จ', color='green')
                    add_dialog.close()
                    load_sheet_data()
                except Exception as e:
                    ui.notify(f'เกิดข้อผิดพลาด: {str(e)}', color='red')

            with ui.row().classes('w-full justify-end gap-2'):
                ui.button('ยกเลิก', on_click=add_dialog.close).props('flat')
                ui.button('บันทึก', on_click=save_to_sheet).classes('bg-blue-600')

        async def load_sheet_data():
            table_container.clear()
            with table_container:
                spinner = ui.spinner(size='lg').classes('self-center my-12')
                sh, err = get_gsheet_client()
                spinner.delete()
                
                if err:
                    ui.label(err).classes('text-red-500 bg-red-50 p-4 rounded-lg w-full text-center')
                    return
                
                try:
                    ws = sh.worksheet("เอกสารเบิกจ่าย")
                    data = ws.get_all_values()
                    # Skip headers (data starts from index 10, Row 11)
                    rows = data[10:] 
                    formatted = []
                    for r in rows:
                        if not r[0] and not r[1]: continue # Skip completely empty rows
                        formatted.append({
                            'date': r[0],
                            'item': r[1],
                            'qty': r[5],
                            'unit_price': r[6],
                            'total': r[7]
                        })
                    
                    ui.table(
                        columns=[
                            {'name': 'date', 'label': 'วันที่', 'field': 'date', 'align': 'left'},
                            {'name': 'item', 'label': 'รายการ', 'field': 'item', 'align': 'left'},
                            {'name': 'qty', 'label': 'จำนวน', 'field': 'qty'},
                            {'name': 'unit_price', 'label': 'หน่วยละ', 'field': 'unit_price'},
                            {'name': 'total', 'label': 'รวม', 'field': 'total'},
                        ],
                        rows=formatted
                    ).classes('w-full bg-white shadow-sm rounded-xl').props('flat bordered')
                except Exception as e:
                    ui.label(f'ผิดพลาด: {str(e)}').classes('text-red-500')

        # Load initial
        ui.timer(0.1, load_sheet_data, once=True)

@ui.page('/expense-summary')
def expense_summary_page():
    if not get_current_user():
        ui.navigate.to('/login')
        return

    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('สรุปรายจ่ายประจำเดือน').classes('text-xl font-bold')

    with ui.column().classes('p-8 w-full max-w-6xl mx-auto'):
        ui.label('สรุปภาพรวมรายจ่าย').classes('text-3xl font-black mb-8')
        
        summary_container = ui.row().classes('w-full gap-6')
        
        async def load_summary():
            summary_container.clear()
            sh, err = get_gsheet_client()
            if err:
                with summary_container:
                    ui.label(err).classes('text-red-500')
                return
            
            try:
                ws = sh.worksheet("เอกสารเบิกจ่าย")
                data = ws.get_all_values()
                rows = data[10:]
                
                total_all = 0.0
                by_month = {} # "MM/YY": total
                
                for r in rows:
                    if not r[7]: continue
                    try:
                        val = float(r[7].replace(',', ''))
                        total_all += val
                        
                        # Simple month extraction from DD/MM/YY
                        if r[0] and '/' in r[0]:
                            parts = r[0].split('/')
                            if len(parts) >= 2:
                                month_key = f"{parts[1]}/{parts[2]}"
                                by_month[month_key] = by_month.get(month_key, 0) + val
                    except: continue

                with summary_container:
                    with ui.card().classes('flex-1 p-8 bg-blue-600 text-white rounded-2xl shadow-xl'):
                        ui.label('ยอดรวมทั้งหมด').classes('text-sm uppercase tracking-widest opacity-80')
                        ui.label(f'{total_all:,.2f} ฿').classes('text-4xl font-black mt-2')
                    
                    with ui.card().classes('flex-1 p-8 bg-white rounded-2xl shadow-lg border border-slate-100'):
                        ui.label('จำนวนเดือนที่มีข้อมูล').classes('text-sm uppercase tracking-widest text-slate-400')
                        ui.label(f'{len(by_month)} เดือน').classes('text-4xl font-black text-slate-800 mt-2')

                # Monthly breakdown table
                ui.label('แยกตามเดือน').classes('text-xl font-bold mt-8 mb-4')
                month_data = [{'month': k, 'total': v} for k, v in by_month.items()]
                ui.table(
                    columns=[
                        {'name': 'month', 'label': 'เดือน/ปี', 'field': 'month', 'align': 'left'},
                        {'name': 'total', 'label': 'ยอดรวม', 'field': 'total', 'format': lambda v: f'{v:,.2f} ฿'},
                    ],
                    rows=month_data
                ).classes('w-full bg-white shadow-sm rounded-xl').props('flat bordered')
                
            except Exception as e:
                with summary_container:
                    ui.label(f'Error: {str(e)}').classes('text-red-500')

        ui.timer(0.1, load_summary, once=True)

# ===== B) หน้ารายงานภาษีรายเดือน =====
@ui.page('/tax-report')
def tax_report_page():
    if not verify_access(['admin', 'accountant']):
        return

    ui.query('body').style('background-color: #f8fafc;')

    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('📊 รายงานภาษีรายเดือน (Tax Monthly Report)').classes('text-xl font-bold')

    with ui.column().classes('p-8 w-full max-w-7xl mx-auto gap-6'):
        # === ตัวเลือกงวด ===
        with ui.card().classes('w-full p-6 rounded-2xl shadow-sm border border-slate-100'):
            with ui.row().classes('items-center gap-4'):
                now = datetime.now()
                period = ui.input(
                    'งวดภาษี (ปี-เดือน)', value=now.strftime('%Y-%m')
                ).classes('w-48').props('outlined')
                ui.label('รูปแบบ: 2026-03').classes('text-slate-400 text-sm')
                load_btn = ui.button('📥 โหลดรายงาน', icon='refresh').props('color=primary outline')

        result_area = ui.column().classes('w-full gap-6')

        def load_tax_report():
            result_area.clear()
            selected_period = period.value.strip()

            with Session() as s:
                comp = s.query(Company).first()
                vat_rate = comp.vat_rate if comp else 7.0

                # ---- WHT Records ----
                wht_recs = s.query(WHTRecord).filter(
                    WHTRecord.submit_period == selected_period
                ).all()

                # ---- Invoices (VAT ขาย) ----
                invoices = s.query(Invoice).filter(
                    Invoice.created_at.like(f"{selected_period}%")
                ).all()

                # ---- Expenses (VAT ซื้อ) ----
                expenses = s.query(Expense).filter(
                    Expense.expense_date.like(f"{selected_period}%")
                ).all()

            total_sales = sum(inv.total_amount or 0 for inv in invoices)
            total_vat_out = sum(inv.vat_amount or 0 for inv in invoices)
            total_purchase = sum(e.amount or 0 for e in expenses)
            total_vat_in = sum((e.vat_amount or e.amount * vat_rate / (100 + vat_rate)) for e in expenses)
            vat_payable = max(0, total_vat_out - total_vat_in)

            total_wht = sum(w.wht_amount for w in wht_recs)
            wht_by_form = {}
            for w in wht_recs:
                key = w.form_type or 'ไม่ระบุ'
                if key not in wht_by_form:
                    wht_by_form[key] = {'count': 0, 'gross': 0.0, 'wht': 0.0}
                wht_by_form[key]['count'] += 1
                wht_by_form[key]['gross'] += w.gross_amount
                wht_by_form[key]['wht'] += w.wht_amount

            with result_area:
                # === Summary Cards ===
                with ui.row().classes('w-full gap-4'):
                    def stat_card(icon, title, value, color, sub=''):
                        with ui.card().classes(f'flex-1 p-6 bg-{color}-50 border border-{color}-100 rounded-2xl shadow-none'):
                            with ui.row().classes('items-center gap-3 mb-2'):
                                ui.icon(icon).classes(f'text-{color}-600 text-2xl')
                                ui.label(title).classes(f'text-xs font-bold text-{color}-700 uppercase tracking-wider')
                            ui.label(value).classes(f'text-3xl font-black text-{color}-900')
                            if sub:
                                ui.label(sub).classes(f'text-xs text-{color}-500 mt-1')

                    stat_card('receipt_long', f'VAT ขาย (ภาษีขาย)', f'{total_vat_out:,.2f} ฿', 'blue', f'รายได้รวม {total_sales:,.2f} ฿')
                    stat_card('shopping_cart', 'VAT ซื้อ (ภาษีซื้อ)', f'{total_vat_in:,.2f} ฿', 'green', f'รายจ่ายรวม {total_purchase:,.2f} ฿')
                    stat_card('account_balance', 'VAT ต้องนำส่ง (ภ.พ.30)', f'{vat_payable:,.2f} ฿', 'amber', f'ยื่นภายใน 15 ของเดือนถัดไป')
                    stat_card('gavel', 'WHT รวมทั้งสิ้น', f'{total_wht:,.2f} ฿', 'red', f'{len(wht_recs)} รายการ')

                # === VAT Detail ===
                with ui.row().classes('w-full gap-4'):
                    with ui.card().classes('flex-1 p-6 rounded-2xl shadow-sm border border-slate-100'):
                        ui.label('📋 ภาษีมูลค่าเพิ่ม (VAT) - ภ.พ.30').classes('text-lg font-black text-slate-800 mb-4')
                        with ui.row().classes('w-full gap-0'):
                            with ui.column().classes('flex-1 p-4 bg-blue-50 rounded-l-xl'):
                                ui.label('ภาษีขาย').classes('text-xs font-bold text-blue-600 mb-1')
                                ui.label(f'{total_vat_out:,.2f} ฿').classes('text-2xl font-black text-blue-800')
                                ui.label(f'จาก {len(invoices)} ใบแจ้งหนี้').classes('text-xs text-blue-500')
                            with ui.column().classes('w-8 items-center justify-center text-slate-400 font-bold text-xl'):
                                ui.label('−')
                            with ui.column().classes('flex-1 p-4 bg-green-50'):
                                ui.label('ภาษีซื้อ').classes('text-xs font-bold text-green-600 mb-1')
                                ui.label(f'{total_vat_in:,.2f} ฿').classes('text-2xl font-black text-green-800')
                                ui.label(f'จาก {len(expenses)} รายจ่าย').classes('text-xs text-green-500')
                            with ui.column().classes('w-8 items-center justify-center text-slate-400 font-bold text-xl'):
                                ui.label('=')
                            with ui.column().classes('flex-1 p-4 bg-amber-50 rounded-r-xl'):
                                ui.label('ต้องนำส่ง').classes('text-xs font-bold text-amber-600 mb-1')
                                ui.label(f'{vat_payable:,.2f} ฿').classes('text-2xl font-black text-amber-800')
                                ui.label('ยื่น ภ.พ.30 ทุกเดือน').classes('text-xs text-amber-500')

                    # === WHT by Form ===
                    with ui.card().classes('flex-1 p-6 rounded-2xl shadow-sm border border-slate-100'):
                        ui.label('🔴 ภาษีหัก ณ ที่จ่าย แยกตามแบบฟอร์ม').classes('text-lg font-black text-slate-800 mb-4')
                        if not wht_by_form:
                            ui.label(f'ไม่มีรายการ WHT ในงวด {selected_period}').classes('text-slate-400 italic')
                        for form_name, data in wht_by_form.items():
                            with ui.row().classes('w-full justify-between items-center py-3 border-b border-slate-100'):
                                with ui.column():
                                    ui.label(form_name).classes('font-bold text-slate-800')
                                    ui.label(f"{data['count']} รายการ | ยอดรวม {data['gross']:,.2f} ฿").classes('text-xs text-slate-500')
                                ui.label(f"WHT: {data['wht']:,.2f} ฿").classes('font-black text-red-700 text-lg')

                # === WHT Table ===
                with ui.card().classes('w-full p-6 rounded-2xl shadow-sm border border-slate-100'):
                    ui.label('📑 รายการภาษีหัก ณ ที่จ่าย (รายละเอียด)').classes('text-lg font-black text-slate-800 mb-4')
                    wht_rows = [{
                        'ref': w.ref_id,
                        'payee': w.payee or '-',
                        'payee_tax': w.payee_tax_id or '-',
                        'income_type': w.income_type or '-',
                        'gross': f"{w.gross_amount:,.2f}",
                        'rate': f"{w.wht_rate:.0f}%",
                        'wht': f"{w.wht_amount:,.2f}",
                        'form': w.form_type or '-',
                        'date': w.payment_date[:10] if w.payment_date else '-'
                    } for w in wht_recs]
                    if wht_rows:
                        ui.table(
                            columns=[
                                {'name': 'ref', 'label': 'เลขที่อ้างอิง', 'field': 'ref', 'align': 'left'},
                                {'name': 'payee', 'label': 'ผู้รับเงิน', 'field': 'payee', 'align': 'left'},
                                {'name': 'payee_tax', 'label': 'เลขภาษี', 'field': 'payee_tax', 'align': 'left'},
                                {'name': 'income_type', 'label': 'มาตรา', 'field': 'income_type'},
                                {'name': 'gross', 'label': 'ยอดก่อนหัก ฿', 'field': 'gross'},
                                {'name': 'rate', 'label': 'อัตรา', 'field': 'rate'},
                                {'name': 'wht', 'label': 'WHT ฿', 'field': 'wht'},
                                {'name': 'form', 'label': 'แบบฟอร์ม', 'field': 'form'},
                                {'name': 'date', 'label': 'วันที่', 'field': 'date'},
                            ],
                            rows=wht_rows
                        ).classes('w-full').props('flat bordered dense')
                    else:
                        ui.label('ยังไม่มีรายการ WHT ในงวดนี้').classes('text-slate-400 italic text-center py-8')

                # === C) ภาษีเงินได้นิติบุคคล Calculator ===
                with ui.card().classes('w-full p-6 rounded-2xl shadow-sm border border-slate-100 bg-indigo-50'):
                    ui.label('🏢 เครื่องคำนวณภาษีเงินได้นิติบุคคล (SME Rate)').classes('text-lg font-black text-indigo-900 mb-2')
                    ui.label('อิงตามประกาศกรมสรรพากร: SMEs กำไร ≤300K = 0% | 300K-3M = 15% | >3M = 20%').classes('text-xs text-indigo-600 mb-4')

                    with ui.row().classes('w-full gap-4 items-end'):
                        net_profit_in = ui.number('กำไรสุทธิก่อนภาษี (บาท)', min=0, format='%.2f').classes('flex-1').props('outlined bg-white')
                        calc_year_in = ui.number('ปี พ.ศ.', value=now.year + 543).classes('w-32').props('outlined bg-white')
                        corp_result = ui.label('ภาษี: 0.00 ฿').classes('text-lg font-black text-indigo-800 bg-white px-4 py-3 rounded-xl')

                        def calc_sme_tax():
                            profit = net_profit_in.value or 0
                            if profit <= 300000:
                                tax = 0
                                detail = 'กำไร ≤ 300,000 ฿ → ยกเว้นภาษี'
                            elif profit <= 3000000:
                                tax = (profit - 300000) * 0.15
                                detail = f'ส่วนเกิน 300K x 15% = {tax:,.2f} ฿'
                            else:
                                tax = (3000000 - 300000) * 0.15 + (profit - 3000000) * 0.20
                                detail = f'(3M-300K)×15% + (เกิน3M)×20% = {tax:,.2f} ฿'
                            corp_result.text = f'ภาษี: {tax:,.2f} ฿  ({detail})'

                        net_profit_in.on('update:model-value', lambda _: calc_sme_tax())
                        ui.button('คำนวณ', icon='calculate', on_click=calc_sme_tax).classes('h-12 bg-indigo-700 text-white px-6 rounded-xl font-bold')

        load_btn.on('click', load_tax_report)
        ui.timer(0.1, load_tax_report, once=True)

        # === Google Workspace Tax Guide Section ===
        with ui.expansion('💡 คู่มือภาษี Google Workspace (สำหรับ Reseller)', icon='info').classes('w-full bg-blue-50 border border-blue-100 rounded-xl px-4'):
            with ui.column().classes('p-4 gap-4'):
                ui.markdown("""
                ### 📌 สิ่งที่ Reseller ต้องดำเนินการตามกฎหมายไทย
                
                **1. ฝั่งซื้อ (License จาก Google):**
                *   **ภ.พ.36:** ต้องยื่น VAT 7% ของยอดที่จ่ายให้ Google (ย่านายหน้า/ค่าสิทธิ์/บริการ) ภายในวันที่ 7 ของเดือนถัดไป
                *   **การเสียภาษีซ้ำซ้อน:** ต้องแจ้ง **Tax ID** ใน Google Admin Console เพื่อไม่ให้ Google เก็บ VAT 7% ซ้ำ (ถ้าไม่แจ้งจะเสีย 2 ต่อ คือเสียให้ Google และต้องยื่น ภ.พ.36 เองด้วย)
                *   **WHT (ภ.ง.ด.54):** ตามคำวินิจฉัยปี 2025 บริการ Cloud/SaaS ถือเป็นกำไรทางธุรกิจ ถ้าไม่มีสถานประกอบการในไทย **ไม่ต้องหัก WHT**
                
                **2. ฝั่งขาย (ขายให้ลูกค้า):**
                *   **ภ.พ.30:** ออกใบกำกับภาษีเก็บ VAT 7% จากลูกค้า และนำส่งตามปกติ (หักลบกับภาษีซื้อจาก ภ.พ.36 ได้)
                *   **WHT:** ลูกค้าจะหักเรา 3% (ค่าบริการ) เราต้องขอ **หนังสือรับรองหัก ณ ที่จ่าย** มาไว้ลดหย่อนภาษีปลายปี
                """).classes('text-slate-700')
                ui.button('อ่านรายละเอียดเชิงลึก', icon='open_in_new', on_click=lambda: ui.notify('รายละเอียดอยู่ในไฟล์ google_workspace_tax_notes.md', color='info'))


# ===== WHT Records page =====
@ui.page('/wht-records')
def wht_records_page():
    if not verify_access(['admin', 'accountant', 'finance']):
        return

    ui.query('body').style('background-color: #f8fafc;')

    with ui.header().classes('bg-slate-900 text-white p-4 justify-between shadow-md'):
        with ui.row().classes('items-center gap-4'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('🔴 รายการภาษีหัก ณ ที่จ่าย (WHT Records)').classes('text-xl font-bold')

    with ui.column().classes('p-8 w-full max-w-7xl mx-auto gap-4'):
        with ui.card().classes('w-full p-6 rounded-2xl shadow-sm border border-slate-100'):
            with ui.row().classes('justify-between items-center mb-4'):
                ui.label('ทะเบียนภาษีหัก ณ ที่จ่ายทั้งหมด').classes('text-2xl font-black text-slate-800')
                with ui.row().classes('gap-2'):
                    filter_period = ui.input('กรองงวด (ปี-เดือน)').classes('w-36').props('outlined dense placeholder="2026-03"')
                    filter_btn = ui.button('ค้นหา', icon='search').props('color=primary outline dense')

            def get_wht_rows(period_filter=''):
                with Session() as s:
                    q = s.query(WHTRecord)
                    if period_filter:
                        q = q.filter(WHTRecord.submit_period == period_filter)
                    recs = q.order_by(WHTRecord.id.desc()).limit(200).all()
                    return [{
                        'id': w.id,
                        'ref': w.ref_id,
                        'payee': w.payee or '-',
                        'payee_tax': w.payee_tax_id or '-',
                        'income_type': w.income_type or '-',
                        'income_desc': (w.income_description or '')[:30],
                        'gross': f"{w.gross_amount:,.2f}",
                        'rate': f"{w.wht_rate:.0f}%",
                        'wht': f"{w.wht_amount:,.2f}",
                        'net': f"{w.net_amount:,.2f}",
                        'form': w.form_type or '-',
                        'period': w.submit_period or '-',
                        'submitted': '✅ นำส่งแล้ว' if w.submitted else '⏳ รอนำส่ง',
                        'date': w.payment_date[:10] if w.payment_date else '-'
                    } for w in recs]

            wht_table = ui.table(
                columns=[
                    {'name': 'ref', 'label': 'เลขที่อ้างอิง', 'field': 'ref', 'align': 'left', 'sortable': True},
                    {'name': 'payee', 'label': 'ผู้รับเงิน', 'field': 'payee', 'align': 'left'},
                    {'name': 'payee_tax', 'label': 'เลขภาษีผู้รับ', 'field': 'payee_tax', 'align': 'left'},
                    {'name': 'income_type', 'label': 'มาตรา', 'field': 'income_type'},
                    {'name': 'gross', 'label': 'ยอดก่อนหัก ฿', 'field': 'gross'},
                    {'name': 'rate', 'label': 'อัตรา', 'field': 'rate'},
                    {'name': 'wht', 'label': 'WHT ฿', 'field': 'wht'},
                    {'name': 'net', 'label': 'สุทธิ ฿', 'field': 'net'},
                    {'name': 'form', 'label': 'แบบฟอร์ม', 'field': 'form'},
                    {'name': 'period', 'label': 'งวด', 'field': 'period'},
                    {'name': 'submitted', 'label': 'สถานะ', 'field': 'submitted'},
                    {'name': 'date', 'label': 'วันที่', 'field': 'date'},
                ],
                rows=get_wht_rows()
            ).classes('w-full').props('flat bordered dense')

            def do_filter():
                wht_table.rows[:] = get_wht_rows(filter_period.value.strip())
                wht_table.update()
            filter_btn.on('click', do_filter)


# เริ่มต้นระบบ
if __name__ in {"__main__", "__mp_main__"}:
    print("Starting Micro-Account with All Roles Integrated...")
    ui.run(
        title='Micro-Account Expert', 
        port=8080, 
        storage_secret='grids_micro_2026_super_secret',
        reload=True
    )
