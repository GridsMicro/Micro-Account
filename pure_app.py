from nicegui import ui, app
from sqlalchemy import create_engine, text, Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base
from passlib.hash import pbkdf2_sha256
import os
import base64
from datetime import datetime
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

CLOUD_DB_URL = os.getenv('DATABASE_URL')

# --- Database & Models ---
Base = declarative_base()

class Company(Base):
    __tablename__ = 'company_settings'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    tax_id = Column(String)
    address = Column(String)
    phone = Column(String)
    email = Column(String)
    logo_base64 = Column(String)
    logo_url = Column(String)
    website = Column(String)
    vat_rate = Column(Float, default=7.0)
    withholding_tax_rate = Column(Float, default=3.0)
    is_vat_registered = Column(Boolean, default=True)
    currency = Column(String, default="฿")
    bank_name = Column(String)
    bank_account_name = Column(String)
    bank_account_number = Column(String)
    bank_branch = Column(String)
    invoice_prefix = Column(String, default="INV")
    quotation_prefix = Column(String, default="QT")
    is_setup = Column(Boolean, default=False)
    updated_at = Column(String, default=lambda: datetime.now().isoformat())

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
    name = Column(String)
    email = Column(String, unique=True)
    password = Column(String) # Hashed
    role = Column(String, default="Member")
    status = Column(String, default="Active")
    created_at = Column(String, default=lambda: datetime.now().isoformat())

class Category(Base):
    __tablename__ = 'categories'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    description = Column(String)
    type = Column(String, default="product")

class Product(Base):
    __tablename__ = 'products'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    sku_number = Column(String, unique=True)
    source_info = Column(String)
    storage_location = Column(String)
    stock_quantity = Column(Integer, default=0)
    price = Column(Float, default=0.0)
    product_notes = Column(String)
    category_id = Column(Integer, ForeignKey('categories.id'))
    type = Column(String, default='product')
    created_at = Column(String, default=lambda: datetime.now().isoformat())

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
    email = Column(String)
    phone = Column(String)
    address = Column(String)
    tax_id = Column(String)
    contact_person = Column(String)
    contact_type = Column(String) # Customer, Supplier, Partner
    created_at = Column(String, default=lambda: datetime.now().isoformat())

class Invoice(Base):
    __tablename__ = 'invoices'
    id = Column(Integer, primary_key=True)
    invoice_number = Column(String, unique=True)
    contact_id = Column(Integer, ForeignKey('contacts.id'))
    status = Column(String, default='draft') # draft, sent, paid, overdue
    net_amount = Column(Float, default=0.0)
    issue_date = Column(String)
    due_date = Column(String)
    created_at = Column(String, default=lambda: datetime.now().isoformat())

class InvoiceItem(Base):
    __tablename__ = 'invoice_items'
    id = Column(Integer, primary_key=True)
    invoice_id = Column(Integer, ForeignKey('invoices.id'))
    product_id = Column(Integer, ForeignKey('products.id'))
    description = Column(String)
    qty = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    total = Column(Float, default=0.0)

class JournalEntry(Base):
    __tablename__ = 'journal_entries'
    id = Column(Integer, primary_key=True)
    entry_date = Column(String)
    reference_no = Column(String)
    description = Column(String)
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)
    journal_type = Column(String, default='General') # sales, receipt, purchase, payment, general
    account_id = Column(Integer, ForeignKey('accounts.id'))
    receipt_url = Column(String)
    created_at = Column(String, default=lambda: datetime.now().isoformat())

class Account(Base): # Chart of Accounts
    __tablename__ = 'accounts'
    id = Column(Integer, primary_key=True)
    code = Column(String, unique=True)
    name = Column(String)
    type = Column(String) # Asset, Liability, Equity, Revenue, Expense

class Quotation(Base):
    __tablename__ = 'quotations'
    id = Column(Integer, primary_key=True)
    quotation_number = Column(String, unique=True)
    contact_id = Column(Integer, ForeignKey('contacts.id'))
    status = Column(String, default='pending') # pending, sent, accepted, rejected
    total_amount = Column(Float, default=0.0)
    issue_date = Column(String)
    created_at = Column(String, default=lambda: datetime.now().isoformat())

class Payment(Base):
    __tablename__ = 'payments'
    id = Column(Integer, primary_key=True)
    payment_date = Column(String)
    contact_id = Column(Integer, ForeignKey('contacts.id'))
    amount = Column(Float, default=0.0)
    reference_number = Column(String)
    method = Column(String, default='Bank Transfer')
    notes = Column(String)
    created_at = Column(String, default=lambda: datetime.now().isoformat())

class DocumentPattern(Base):
    __tablename__ = 'document_patterns'
    id = Column(Integer, primary_key=True)
    document_type = Column(String, unique=True)
    prefix = Column(String)
    separator = Column(String, default='-')
    include_year = Column(Boolean, default=True)
    include_month = Column(Boolean, default=True)
    digits = Column(Integer, default=4)
    last_number = Column(Integer, default=0)
    updated_at = Column(String, default=lambda: datetime.now().isoformat())

DB_FILE = "database.db"
engine = create_engine(f"sqlite:///{DB_FILE}")
Session = sessionmaker(bind=engine)

def init_db():
    Base.metadata.create_all(engine)
    
    # Migration: Add missing columns...
    with engine.connect() as conn:
        # Check if old table 'company' exists and rename it
        tables = [row[0] for row in conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))]
        if 'company' in tables and 'company_settings' not in tables:
            conn.execute(text("ALTER TABLE company RENAME TO company_settings"))
            conn.commit()

        existing_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(company_settings)"))]
        new_cols = {
            'phone': 'TEXT', 
            'email': 'TEXT', 
            'vat_rate': 'FLOAT DEFAULT 7.0', 
            'currency': 'TEXT DEFAULT "฿"', 
            'invoice_prefix': 'TEXT DEFAULT "INV"', 
            'quotation_prefix': 'TEXT DEFAULT "QT"',
            'withholding_tax_rate': 'FLOAT DEFAULT 3.0',
            'is_vat_registered': 'BOOLEAN DEFAULT 1',
            'bank_name': 'TEXT',
            'bank_account_name': 'TEXT',
            'bank_account_number': 'TEXT',
            'bank_branch': 'TEXT',
            'website': 'TEXT',
            'logo_url': 'TEXT',
            'updated_at': 'TEXT'
        }
        for col, type_ in new_cols.items():
            if col not in existing_cols:
                conn.execute(text(f"ALTER TABLE company_settings ADD COLUMN {col} {type_}"))
        
        # Product Category & Type Migration
        prod_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(products)"))]
        if 'category_id' not in prod_cols:
            conn.execute(text("ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id)"))
        if 'type' not in prod_cols:
            conn.execute(text("ALTER TABLE products ADD COLUMN type TEXT DEFAULT 'product'"))
        
        # Contact Migration
        contact_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(contacts)"))]
        if 'tax_id' not in contact_cols:
            conn.execute(text("ALTER TABLE contacts ADD COLUMN tax_id TEXT"))
        if 'contact_person' not in contact_cols:
            conn.execute(text("ALTER TABLE contacts ADD COLUMN contact_person TEXT"))
        
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
    return app.storage.user.get('email')

def login(email, password):
    with Session() as session:
        user = session.query(User).filter_by(email=email).first()
        if user and pbkdf2_sha256.verify(password, user.password):
            app.storage.user.update({'email': email, 'role': user.role})
            return True
    return False

def logout():
    app.storage.user.clear()
    ui.navigate.to('/login')

# --- Pages ---

@ui.page('/login')
def login_page():
    if get_current_user():
        ui.navigate.to('/')
        return

    with ui.card().classes('fixed-center p-8 w-80 shadow-2xl'):
        ui.label('เข้าสู่ระบบ').classes('text-2xl font-bold mb-4 w-full text-center')
        email_input = ui.input('อีเมล (Email)').classes('w-full')
        pass_input = ui.input('รหัสผ่าน', password=True).classes('w-full')
        
        async def try_login():
            if login(email_input.value, pass_input.value):
                ui.navigate.to('/')
            else:
                ui.notify('อีเมลหรือรหัสผ่านไม่ถูกต้อง', color='red')
        
        ui.button('Login', on_click=try_login).classes('w-full mt-4 bg-blue-600')

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
                admin_email = ui.input('อีเมลสำหรับเข้าสู่ระบบ (Admin Email)').classes('w-full').props('outlined')
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
                            name='Admin',
                            email=admin_email.value,
                            password=pbkdf2_sha256.hash(admin_pass.value),
                            role='admin',
                            status='Active'
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

    # Dashboard 
    ui.query('body').style('background-color: #f1f5f9;')
    role = app.storage.user.get('role', 'staff')
    
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
            
            # Common Menus
            ui.button('หน้าแรก', icon='home', on_click=lambda: ui.navigate.to('/')).props('flat align=left').classes('w-full rounded-lg')
            
            # Role-Specific Menus
            if role in ['admin', 'accountant', 'billing', 'sales']:
                ui.button('ใบเสนอราคา', icon='description', on_click=lambda: ui.navigate.to('/quotations_hybrid')).props('flat align=left').classes('w-full rounded-lg text-blue-800')
                ui.button('สมุดรายวัน', icon='book', on_click=lambda: ui.navigate.to('/journals')).props('flat align=left').classes('w-full rounded-lg text-blue-800')
                ui.button('ใบแจ้งหนี้', icon='receipt_long', on_click=lambda: ui.navigate.to('/invoices')).props('flat align=left').classes('w-full rounded-lg text-blue-800')
                ui.button('ประวัติรับเงิน', icon='payments', on_click=lambda: ui.navigate.to('/payments_hybrid')).props('flat align=left').classes('w-full rounded-lg text-blue-800')

            if role in ['admin', 'accountant', 'finance']:
                ui.button('บัญชีแยกประเภท', icon='account_tree', on_click=lambda: ui.notify('ฟีเจอร์นี้กำลังอัปเดตจาก Cloud...')).props('flat align=left').classes('w-full rounded-lg text-indigo-800')
                ui.button('งบการเงิน', icon='summarize', on_click=lambda: ui.notify('ฟีเจอร์นี้เริ่มใช้งานได้บนระบบ Online')).props('flat align=left').classes('w-full rounded-lg text-indigo-800')

            if role in ['admin', 'inventory', 'sales']:
                ui.button('คลังสินค้า (Stock)', icon='inventory_2', on_click=lambda: ui.navigate.to('/inventory')).props('flat align=left').classes('w-full rounded-lg text-green-800')
                if role != 'sales': # Sales view only, OTHERS can adjust
                    ui.button('รับสินค้าเข้า', icon='add_shopping_cart', on_click=lambda: ui.navigate.to('/inventory')).props('flat align=left').classes('w-full rounded-lg text-green-800')

            if role in ['admin', 'sales']:
                ui.button('แคตตาล็อกสินค้า', icon='shopping_bag', on_click=lambda: ui.navigate.to('/catalog')).props('flat align=left').classes('w-full rounded-lg text-orange-800')

            if role in ['admin', 'sales', 'billing', 'accountant']:
                ui.button('สมุดรายชื่อ (Contacts)', icon='contact_phone', on_click=lambda: ui.navigate.to('/contacts')).props('flat align=left').classes('w-full rounded-lg text-blue-900')

            ui.button('ซูเปอร์ซิงค์ (Auto-Sync)', icon='sync', on_click=lambda: ui.navigate.to('/sync')).props('flat align=left').classes('w-full rounded-lg text-indigo-600 font-bold')

            ui.separator().classes('my-6')

            if role == 'admin':
                ui.button('การตั้งค่าระบบ (Settings)', icon='settings', on_click=lambda: ui.navigate.to('/settings')).props('flat align=left').classes('w-full rounded-lg text-slate-600')
                ui.button('ซิงค์ข้อมูล Cloud (Sync)', icon='cloud_upload', on_click=lambda: ui.navigate.to('/sync')).props('flat align=left').classes('w-full rounded-lg text-blue-600')

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
    if not get_current_user() or app.storage.user.get('role') != 'admin':
        ui.notify('สิทธิ์เข้าใช้งานเฉพาะ Admin เท่านั้น', color='red')
        ui.navigate.to('/')
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

        with ui.tab_panels(tabs, value=t1).classes('w-full bg-white p-8 shadow-2xl rounded-b-xl border border-slate-100 min-h-[500px]'):
            with ui.tab_panel(t1):
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

            with ui.tab_panel(t2):
                role_options = {
                    'admin': 'ผู้ดูแลระบบ (Admin)',
                    'accountant': 'พนักงานบัญชี (Accountant)',
                    'inventory': 'คลังสินค้า (Inventory)',
                    'finance': 'การเงิน (Finance)',
                    'billing': 'ออกบิล (Billing)',
                    'sales': 'ฝ่ายขาย (Sales)'
                }

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
                            s.commit()
                        log_action(get_current_user(), "UPDATE_DOCS", "แก้ไขคำนำหน้าเอกสาร")
                        ui.notify('บันทึกการตั้งค่าเอกสารแล้ว', color='green')

                    ui.button('บันทึกการตั้งค่าเอกสาร', on_click=save_doc_settings).classes('mt-8 bg-slate-800 px-8 py-2 text-white rounded-lg')

            with ui.tab_panel(t5):
                ui.label('การตั้งค่าภาษีและการเงิน').classes('text-2xl font-black mb-6 text-slate-800')
                with Session() as s:
                    c = s.query(Company).first()
                    with ui.row().classes('w-full gap-8'):
                        with ui.card().classes('flex-1 p-8 shadow-sm'):
                            ui.label('อัตราภาษีมูลค่าเพิ่ม (VAT %)').classes('text-slate-500 font-bold')
                            vat_val = ui.number(value=c.vat_rate, min=0, max=100).classes('w-full text-2xl').props('outlined suffix="%"')
                        with ui.card().classes('flex-1 p-8 shadow-sm'):
                            ui.label('สกุลเงินเริ่มต้น (Currency Source)').classes('text-slate-500 font-bold')
                            curr_val = ui.input(value=c.currency).classes('w-full text-2xl').props('outlined')
                    
                    async def save_fin():
                        with Session() as s:
                            comp = s.query(Company).first()
                            comp.vat_rate = vat_val.value
                            comp.currency = curr_val.value
                            s.commit()
                        log_action(get_current_user(), "UPDATE_FINANCE", "แก้ไขอัตราภาษี/สกุลเงิน")
                        ui.notify('บันทึกข้อมูลการเงินสำเร็จ', color='green')

                    ui.button('บันทึกนโยบายการเงิน', on_click=save_fin).classes('mt-8 bg-green-700 px-12 py-3 text-white rounded-xl shadow-lg')

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
            ui.button('เพิ่มสินค้า/บริการ', icon='add', on_click=lambda: add_dialog.open()).classes('bg-blue-600')

    def get_products():
        with Session() as s:
            products = s.query(Product).all()
            return [{
                'id': p.id,
                'sku': p.sku_number,
                'name': p.name,
                'price': p.price,
                'stock': p.stock_quantity,
                'type': 'product'
            } for p in products]

    with ui.column().classes('p-8 w-full max-w-6xl mx-auto'):
        with ui.row().classes('w-full items-center mb-4 gap-4'):
            search_input = ui.input(placeholder='ค้นหาชื่อสินค้า, SKU หรือหมวดหมู่...').classes('flex-1').props('outlined rounded-lg')
            search_input.on('update:model-value', lambda e: setattr(prod_table, 'filter', e))
            ui.icon('search').classes('text-2xl text-slate-400')
        # Dialog สำหรับเพิ่ม/แก้ไขสินค้า
        with ui.dialog() as add_dialog, ui.card().classes('p-8 w-[500px] rounded-2xl'):
            ui.label('รายละเอียดสินค้า/บริการ').classes('text-2xl font-black mb-6')
            
            with Session() as s:
                cats = {c.id: f"{c.name} ({c.type})" for c in s.query(Category).all()}
            
            sku = ui.input('รหัสสินค้า (SKU)').classes('w-full mb-4').props('outlined')
            name = ui.input('ชื่อสินค้า/บริการ').classes('w-full mb-4').props('outlined')
            price = ui.number('ราคาขาย', format='%.2f').classes('w-full mb-4').props('outlined')
            stock = ui.number('จำนวนสต็อกเริ่มต้น', value=0).classes('w-full mb-4').props('outlined')
            cat_id = ui.number('ID หมวดหมู่ (ชั่วคราว)').classes('w-full mb-8').props('outlined')

            async def save_product():
                if not sku.value or not name.value:
                    ui.notify('กรุณากรอกข้อมูลให้ครบถ้วน', color='orange')
                    return
                
                with Session() as s:
                    p = Product(
                        sku_number=sku.value,
                        name=name.value,
                        price=price.value,
                        stock_quantity=stock.value,
                    )
                    s.add(p)
                    s.commit()
                
                log_action(get_current_user(), "ADD_PRODUCT", f"เพิ่มสินค้า: {name.value} ({sku.value})")
                ui.notify('บันทึกสินค้าสำเร็จ', color='green')
                add_dialog.close()
                prod_table.rows[:] = get_products()
                prod_table.update()

            ui.button('บันทึกข้อมูล', on_click=save_product).classes('w-full h-12 bg-blue-700 text-white rounded-xl')

        # ตารางแสดงรายการ
        prod_table = ui.table(
            columns=[
                {'name': 'sku', 'label': 'SKU', 'field': 'sku', 'align': 'left', 'sortable': True},
                {'name': 'name', 'label': 'รายการ', 'field': 'name', 'align': 'left', 'sortable': True},
                {'name': 'price', 'label': 'ราคา', 'field': 'price', 'sortable': True},
                {'name': 'stock', 'label': 'สต็อก', 'field': 'stock', 'sortable': True},
            ],
            rows=get_products()
        ).classes('w-full bg-white shadow-sm rounded-xl').props('flat bordered')

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
    if not get_current_user():
        ui.navigate.to('/login')
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
                'person': c.contact_person
            } for c in s.query(Contact).all()]

    with ui.column().classes('p-8 w-full max-w-6xl mx-auto'):
        with ui.row().classes('w-full items-center mb-4 gap-4'):
            search_input = ui.input(placeholder='ค้นหารายชื่อ เบอร์โทร หรือเลขภาษี...').classes('flex-1').props('outlined rounded-lg')
            search_input.on('update:model-value', lambda e: setattr(contact_table, 'filter', e))
            ui.icon('search').classes('text-2xl text-slate-400')
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

        # ตารางแสดงรายชื่อ
        contact_table = ui.table(
            columns=[
                {'name': 'name', 'label': 'ชื่อลูกค้า/คู่ค้า', 'field': 'name', 'align': 'left', 'sortable': True},
                {'name': 'type', 'label': 'ประเภท', 'field': 'type', 'sortable': True},
                {'name': 'tax_id', 'label': 'เลขภาษี', 'field': 'tax_id'},
                {'name': 'phone', 'label': 'เบอร์โทร', 'field': 'phone'},
                {'name': 'email', 'label': 'อีเมล', 'field': 'email'},
                {'name': 'person', 'label': 'ผู้ติดต่อ', 'field': 'person'},
            ],
            rows=get_contacts()
        ).classes('w-full bg-white shadow-sm rounded-xl').props('flat bordered')

        # เพิ่มสไตล์ให้ประเภท
        contact_table.add_slot('body-cell-type', '''
            <q-td :props="props">
                <q-chip outline :color="props.value === 'customer' ? 'blue' : (props.value === 'supplier' ? 'orange' : 'green')" size="sm" class="font-bold">
                    {{ props.value.toUpperCase() }}
                </q-chip>
            </q-td>
        ''')

@ui.page('/quotations_hybrid')
def quotations_hybrid_page():
    if not get_current_user(): ui.navigate.to('/login'); return
    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 items-center justify-between'):
        with ui.row().classes('items-center'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('รายการใบเสนอราคา (Quotations)').classes('text-xl font-bold ml-4')
        ui.button('ไปที่ระบบ Online', icon='open_in_new', on_click=lambda: ui.open('https://micro-account.vercel.app/quotations')).classes('bg-blue-600')

    def get_quotations():
        with Session() as s:
            quotes = s.query(Quotation).all()
            contacts = {c.id: c.name for c in s.query(Contact).all()}
            return [{
                'id': q.id,
                'number': q.quotation_number,
                'customer': contacts.get(q.contact_id, 'ไม่ระบุ'),
                'amount': f"฿{q.total_amount:,.2f}",
                'status': q.status.upper(),
                'date': q.issue_date
            } for q in quotes]

    with ui.column().classes('p-8 w-full max-w-6xl mx-auto'):
        with ui.row().classes('w-full items-center mb-4 gap-4'):
            search_input = ui.input(placeholder='ค้นหาเลขที่ใบเสนอราคา หรือชื่อลูกค้า...').classes('flex-1').props('outlined rounded-lg')
            search_input.on('update:model-value', lambda e: setattr(q_table, 'filter', e))
            ui.icon('search').classes('text-2xl text-slate-400')

        q_table = ui.table(
            columns=[
                {'name': 'number', 'label': 'เลขที่ใบเสนอราคา', 'field': 'number', 'align': 'left', 'sortable': True},
                {'name': 'customer', 'label': 'ลูกค้า', 'field': 'customer', 'align': 'left', 'sortable': True},
                {'name': 'date', 'label': 'วันที่', 'field': 'date', 'sortable': True},
                {'name': 'amount', 'label': 'ยอดรวม', 'field': 'amount', 'sortable': True},
                {'name': 'status', 'label': 'สถานะ', 'field': 'status'},
            ],
            rows=get_quotations()
        ).classes('w-full bg-white shadow-xl rounded-2xl').props('flat bordered')

@ui.page('/invoices')
def invoices_page():
    if not get_current_user(): ui.navigate.to('/login'); return
    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 items-center justify-between'):
        with ui.row().classes('items-center'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('รายการใบแจ้งหนี้ (Invoices)').classes('text-xl font-bold ml-4')
        ui.button('ไปที่ระบบ Online', icon='open_in_new', on_click=lambda: ui.open('https://micro-account.vercel.app/invoices')).classes('bg-violet-600')

    def get_invoices():
        with Session() as s:
            invoices = s.query(Invoice).all()
            contacts = {c.id: c.name for c in s.query(Contact).all()}
            return [{
                'id': inv.id,
                'number': inv.invoice_number,
                'customer': contacts.get(inv.contact_id, 'ไม่ระบุ'),
                'amount': f"฿{inv.net_amount:,.2f}",
                'status': inv.status.upper(),
                'date': inv.issue_date
            } for inv in invoices]

    with ui.column().classes('p-8 w-full max-w-6xl mx-auto'):
        with ui.row().classes('w-full items-center mb-4 gap-4'):
            search_input = ui.input(placeholder='ค้นหาเลขที่ใบแจ้งหนี้ หรือชื่อลูกค้า...').classes('flex-1').props('outlined rounded-lg')
            search_input.on('update:model-value', lambda e: setattr(inv_table, 'filter', e))
            ui.icon('search').classes('text-2xl text-slate-400')
            
        inv_table = ui.table(
            columns=[
                {'name': 'number', 'label': 'เลขที่เอกสาร', 'field': 'number', 'align': 'left', 'sortable': True},
                {'name': 'customer', 'label': 'ลูกค้า', 'field': 'customer', 'align': 'left', 'sortable': True},
                {'name': 'date', 'label': 'วันที่', 'field': 'date', 'sortable': True},
                {'name': 'amount', 'label': 'ยอดเงิน', 'field': 'amount', 'sortable': True},
                {'name': 'status', 'label': 'สถานะ', 'field': 'status'},
            ],
            rows=get_invoices()
        ).classes('w-full bg-white shadow-xl rounded-2xl').props('flat bordered')

@ui.page('/payments_hybrid')
def payments_hybrid_page():
    if not get_current_user(): ui.navigate.to('/login'); return
    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 items-center justify-between'):
        with ui.row().classes('items-center'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('ประวัติการรับชำระเงิน (Payments)').classes('text-xl font-bold ml-4')
        ui.button('ไปที่ระบบ Online', icon='open_in_new', on_click=lambda: ui.open('https://micro-account.vercel.app/payments')).classes('bg-green-600')

    def get_payments():
        with Session() as s:
            payments = s.query(Payment).all()
            contacts = {c.id: c.name for c in s.query(Contact).all()}
            return [{
                'id': p.id,
                'date': p.payment_date,
                'customer': contacts.get(p.contact_id, 'ไม่ระบุ'),
                'amount': f"฿{p.amount:,.2f}",
                'ref': p.reference_number,
                'method': p.method
            } for p in payments]

    with ui.column().classes('p-8 w-full max-w-6xl mx-auto'):
        with ui.row().classes('w-full items-center mb-4 gap-4'):
            search_input = ui.input(placeholder='ค้นหาเลขที่อ้างอิง หรือชื่อลูกค้า...').classes('flex-1').props('outlined rounded-lg')
            search_input.on('update:model-value', lambda e: setattr(p_table, 'filter', e))
            ui.icon('search').classes('text-2xl text-slate-400')

        p_table = ui.table(
            columns=[
                {'name': 'date', 'label': 'วันที่รับชำระ', 'field': 'date', 'align': 'left', 'sortable': True},
                {'name': 'customer', 'label': 'ลูกค้า', 'field': 'customer', 'align': 'left', 'sortable': True},
                {'name': 'ref', 'label': 'หมายเลขอ้างอิง', 'field': 'ref', 'align': 'left', 'sortable': True},
                {'name': 'amount', 'label': 'จำนวนเงิน', 'field': 'amount', 'sortable': True},
                {'name': 'method', 'label': 'ช่องทาง', 'field': 'method'},
            ],
            rows=get_payments()
        ).classes('w-full bg-white shadow-xl rounded-2xl').props('flat bordered')

@ui.page('/journals')
def journals_page():
    if not get_current_user(): ui.navigate.to('/login'); return
    ui.query('body').style('background-color: #f1f5f9;')
    
    with ui.header().classes('bg-slate-900 text-white p-4 items-center justify-between'):
        with ui.row().classes('items-center'):
            ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
            ui.label('สมุดรายวัน (Accounting Journals)').classes('text-xl font-bold ml-4')
        ui.button('ไปที่ระบบ Online', icon='open_in_new', on_click=lambda: ui.open('https://micro-account.vercel.app/journals')).classes('bg-indigo-600')

    def get_journals():
        with Session() as s:
            entries = s.query(JournalEntry).order_by(JournalEntry.entry_date.desc()).limit(100).all()
            return [{
                'id': e.id,
                'date': e.entry_date,
                'ref': e.reference_no,
                'desc': e.description,
                'debit': f"{e.debit:,.2f}",
                'credit': f"{e.credit:,.2f}",
                'type': e.journal_type
            } for e in entries]

    with ui.column().classes('p-8 w-full max-w-6xl mx-auto'):
        with ui.row().classes('w-full items-center mb-4 gap-4'):
            search_input = ui.input(placeholder='ค้นหาเลขที่อ้างอิง หรือคำบรรยาย...').classes('flex-1').props('outlined rounded-lg')
            search_input.on('update:model-value', lambda e: setattr(journal_table, 'filter', e))
            ui.icon('search').classes('text-2xl text-slate-400')
            
        ui.label('รายการล่าสุด 100 รายการ').classes('text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest')
        journal_table = ui.table(
            columns=[
                {'name': 'date', 'label': 'วันที่', 'field': 'date', 'align': 'left', 'sortable': True},
                {'name': 'ref', 'label': 'อ้างอิง', 'field': 'ref', 'align': 'left', 'sortable': True},
                {'name': 'desc', 'label': 'คำบรรยาย', 'field': 'desc', 'align': 'left'},
                {'name': 'debit', 'label': 'เดบิต', 'field': 'debit', 'align': 'right'},
                {'name': 'credit', 'label': 'เครดิต', 'field': 'credit', 'align': 'right'},
            ],
            rows=get_journals()
        ).classes('w-full bg-white shadow-xl rounded-2xl').props('flat bordered')

@ui.page('/inventory')
def inventory_page():
    if not get_current_user(): ui.navigate.to('/login'); return
    ui.navigate.to('/catalog')

@ui.page('/sync')
def sync_page():
    if not get_current_user(): ui.navigate.to('/login'); return
    ui.query('body').style('background-color: #f8fafc;')
    
    with ui.header().classes('bg-blue-900 text-white p-4 items-center'):
        ui.button(icon='arrow_back', on_click=lambda: ui.navigate.to('/')).props('flat color=white')
        ui.label('ศูนย์ควบคุมการซิงค์ข้อมูล (Cloud Synchronization)').classes('text-xl font-bold ml-4')

    with ui.column().classes('p-12 w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-xl mt-12'):
        ui.label('Cloud Connectivity').classes('text-3xl font-black text-blue-900 mb-2')
        ui.label('เชื่อมโยงข้อมูลระหว่างเครื่อง Local และ Server ส่วนกลาง').classes('text-slate-400 mb-8')
        
        status_card = ui.card().classes('w-full p-6 bg-blue-50 border-none shadow-none mb-8')
        with status_card:
            ui.label('สถานะการเชื่อมต่อ').classes('text-xs font-bold text-blue-600 uppercase mb-2')
            if CLOUD_DB_URL:
                ui.label('✅ เชื่อมต่อกับ Neon Postgres เรียบร้อยแล้ว').classes('text-lg font-bold text-green-700')
            else:
                ui.label('❌ ยังไม่ได้ตั้งค่า DATABASE_URL ในไฟล์ .env').classes('text-lg font-bold text-red-700')

        async def start_sync():
            if not CLOUD_DB_URL:
                ui.notify('กรุณาตั้งค่า DATABASE_URL ก่อนซิงค์', color='red')
                return
            
            n = ui.notification('กำลังเริ่มกระบวนการซิงค์ข้อมูล...', timeout=None, spinner=True)
            try:
                # 1. สร้าง Cloud Engine และ Session
                # จัดการเรื่อง SSL mode สำหรับ Neon
                db_url = CLOUD_DB_URL.replace('"', '').strip()
                cloud_engine = create_engine(db_url)
                CloudSession = sessionmaker(bind=cloud_engine)

                # 2. ตรวจสอบและสร้าง Table บน Cloud (ถ้ายังไม่มี)
                Base.metadata.create_all(cloud_engine)
                
                # 3. เริ่มกระบวนการดึงข้อมูลจาก Local และส่งไป Cloud
                tables_to_sync = [User, Company, Category, Product, Contact, AuditLog, Invoice, InvoiceItem, JournalEntry, Account, Quotation, Payment, DocumentPattern]
                total_synced = 0

                with Session() as local_session, CloudSession() as cloud_session:
                    for Model in tables_to_sync:
                        # ดึงข้อมูลทั้งหมดจาก local
                        local_entries = local_session.query(Model).all()
                        
                        for entry in local_entries:
                            # ใช้ Merge เพื่อ Upsert (ถ้ามี ID เดิมจะ Update ถ้าไม่มีจะ Insert)
                            # เคล็ดลับ: expunge entry จาก local_session ก่อน merge เข้า cloud
                            local_session.expunge(entry)
                            cloud_session.merge(entry)
                        
                        total_synced += len(local_entries)
                    
                    cloud_session.commit()

                n.dismiss()
                ui.notify(f'ซิงค์ข้อมูลสำเร็จ! อัปเดตทั้งหมด {total_synced} รายการลงบน Cloud', color='green', icon='cloud_done')
                log_action(get_current_user(), "SYNC_CLOUD", f"ซิงค์ข้อมูลสำเร็จ จำนวน {total_synced} รายการ")

            except Exception as e:
                n.dismiss()
                error_msg = str(e)
                print(f"Sync Error: {error_msg}")
                ui.notify(f'เกิดข้อผิดพลาดในการซิงค์: {error_msg[:100]}...', color='red', icon='error')

        ui.button('เริ่มการซิงค์ข้อมูลเดี๋ยวนี้', icon='sync', on_click=start_sync).classes('w-full h-20 bg-blue-600 text-white font-black text-xl rounded-2xl shadow-lg shadow-blue-200 hover:scale-[1.02] transition-transform')
        
        with ui.row().classes('w-full mt-8 pt-8 border-t border-slate-100 justify-between'):
            ui.label('Database: PostgreSQL (Neon)').classes('text-xs text-slate-400')
            ui.label('Last Sync: ไม่เคย').classes('text-xs text-slate-400')

# เริ่มต้นระบบ
if __name__ in {"__main__", "__mp_main__"}:
    print("Starting Micro-Account with All Roles Integrated...")
    ui.run(
        title='Micro-Account Expert', 
        port=8080, 
        storage_secret='grids_micro_2026_super_secret',
        reload=True
    )
