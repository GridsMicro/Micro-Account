from nicegui import ui, app
from sqlalchemy import create_engine, text, Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base
from passlib.hash import pbkdf2_sha256
import os
import base64
from datetime import datetime, timedelta
from fpdf import FPDF

# --- Database & Models ---
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
    is_setup = Column(Boolean, default=False)

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
    amount = Column(Float)
    withholding_tax_amount = Column(Float, default=0.0)  # ภาษีหัก ณ ที่จ่าย
    net_amount = Column(Float)  # ยอดหลังหักภาษี
    expense_date = Column(String, default=lambda: datetime.now().isoformat())
    vendor = Column(String)
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

DB_FILE = "database.db"
engine = create_engine(f"sqlite:///{DB_FILE}")
Session = sessionmaker(bind=engine)

def init_db():
    Base.metadata.create_all(engine)
    
    # Migration: Add missing columns... (Code simplified for brevity but logic maintained)
    with engine.connect() as conn:
        existing_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(company)"))]
        new_cols = {'phone': 'TEXT', 'email': 'TEXT', 'vat_rate': 'FLOAT DEFAULT 7.0', 'currency': 'TEXT DEFAULT "฿"', 'inv_prefix': 'TEXT DEFAULT "INV"', 'rec_prefix': 'TEXT DEFAULT "REC"'}
        for col, type_ in new_cols.items():
            if col not in existing_cols:
                conn.execute(text(f"ALTER TABLE company ADD COLUMN {col} {type_}"))
        
        # Product Category Migration
        prod_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(products)"))]
        if 'category_id' not in prod_cols:
            conn.execute(text("ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id)"))
        
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
            if role in ['admin', 'accountant', 'billing']:
                ui.button('สมุดรายวัน', icon='book').props('flat align=left').classes('w-full rounded-lg text-blue-800')
                ui.button('ออกใบแจ้งหนี้', icon='receipt_long', on_click=lambda: ui.navigate.to('/invoice')).props('flat align=left').classes('w-full rounded-lg text-blue-800')

            if role in ['admin', 'accountant', 'finance']:
                ui.button('บัญชีแยกประเภท', icon='account_tree').props('flat align=left').classes('w-full rounded-lg text-indigo-800')
                ui.button('งบการเงิน', icon='summarize').props('flat align=left').classes('w-full rounded-lg text-indigo-800')

            if role in ['admin', 'inventory', 'sales']:
                ui.button('คลังสินค้า (Stock)', icon='inventory_2').props('flat align=left').classes('w-full rounded-lg text-green-800')
                if role != 'sales': # Sales view only, OTHERS can adjust
                    ui.button('รับสินค้าเข้า', icon='add_shopping_cart').props('flat align=left').classes('w-full rounded-lg text-green-800')

            if role in ['admin', 'sales']:
                ui.button('แคตตาล็อกสินค้า', icon='shopping_bag', on_click=lambda: ui.navigate.to('/catalog')).props('flat align=left').classes('w-full rounded-lg text-orange-800')

            if role in ['admin', 'inventory', 'sales']:
                ui.button('หมวดหมู่สินค้า', icon='category', on_click=lambda: ui.navigate.to('/categories')).props('flat align=left').classes('w-full rounded-lg text-purple-800')

            if role in ['admin', 'sales', 'billing', 'accountant']:
                ui.button('สมุดรายชื่อ (Contacts)', icon='contact_phone', on_click=lambda: ui.navigate.to('/contacts')).props('flat align=left').classes('w-full rounded-lg text-blue-900')

            # Financial Management
            if role in ['admin', 'accountant', 'billing']:
                ui.button('บัญชีรับเงิน', icon='payments', on_click=lambda: ui.navigate.to('/payments')).props('flat align=left').classes('w-full rounded-lg text-emerald-800')
                ui.button('ออกใบเสร็จรับเงิน', icon='receipt', on_click=lambda: ui.navigate.to('/receipts')).props('flat align=left').classes('w-full rounded-lg text-emerald-800')

            if role in ['admin', 'accountant', 'finance']:
                ui.button('บัญชีจ่าย', icon='money_off', on_click=lambda: ui.navigate.to('/expenses')).props('flat align=left').classes('w-full rounded-lg text-red-800')

            if role in ['admin', 'accountant']:
                ui.button('ทรัพย์สินบริษัท', icon='business', on_click=lambda: ui.navigate.to('/assets')).props('flat align=left').classes('w-full rounded-lg text-amber-800')

            ui.separator().classes('my-6')

            if role == 'admin':
                ui.button('การตั้งค่าระบบ (Settings)', icon='settings', on_click=lambda: ui.navigate.to('/settings')).props('flat align=left').classes('w-full rounded-lg text-slate-600')

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
            ui.button('เพิ่มสินค้า/บริการ', icon='add', on_click=lambda: add_dialog.open()).classes('bg-blue-600')

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
                'type': c.type if c else 'product'
            } for p, c in results]

    with ui.column().classes('p-8 w-full max-w-6xl mx-auto'):
        # Dialog สำหรับเพิ่ม/แก้ไขสินค้า
        with ui.dialog() as add_dialog, ui.card().classes('p-8 w-[500px] rounded-2xl'):
            ui.label('รายละเอียดสินค้า/บริการ').classes('text-2xl font-black mb-6')
            
            with Session() as s:
                cats = {c.id: f"{c.name} ({c.type})" for c in s.query(Category).all()}
            
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
                    p = Product(
                        sku=sku.value,
                        name=name.value,
                        price=price.value,
                        unit=unit.value,
                        stock_qty=stock.value,
                        category_id=cat_id.value
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
                {'name': 'category', 'label': 'หมวดหมู่', 'field': 'category', 'sortable': True},
                {'name': 'price', 'label': 'ราคา', 'field': 'price', 'sortable': True},
                {'name': 'stock', 'label': 'สต็อก', 'field': 'stock', 'sortable': True},
                {'name': 'unit', 'label': 'หน่วย', 'field': 'unit'},
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
                    
                    customer_options = []
                    customer_select = ui.select(customer_options, label='ลูกค้า').classes('flex-1').props('outlined')
                    
                    def update_customer_options():
                        customer_options[:] = get_customers()
                        customer_select.update()
                    
                    # Load initial data
                    update_customer_options()
                    
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
                def get_products():
                    with Session() as s:
                        products = [{'label': f"{p.name} - {p.price}฿", 'value': p.id} for p in s.query(Product).all()]
                        print(f"DEBUG: Found {len(products)} products: {products}")  # Debug print
                        return products
                
                product_options = []
                product_select = ui.select(product_options, label='เลือกสินค้า').classes('flex-1').props('outlined')
                
                def update_product_options():
                    product_options[:] = get_products()
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

                def generate_pdf(invoice_data=None):
                    """Generate PDF for invoice"""
                    pdf = FPDF()
                    pdf.add_page()
                    
                    # Set font
                    pdf.add_font('DejaVu', '', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', uni=True)
                    pdf.set_font('DejaVu', '', 12)
                    
                    # Company header
                    with Session() as s:
                        company = s.query(Company).first()
                        pdf.set_font('DejaVu', '', 16)
                        pdf.cell(0, 10, company.name, ln=True, align='C')
                        pdf.set_font('DejaVu', '', 10)
                        pdf.cell(0, 5, f"Tax ID: {company.tax_id}", ln=True)
                        pdf.cell(0, 5, company.address, ln=True)
                        pdf.cell(0, 5, f"Phone: {company.phone} | Email: {company.email}", ln=True)
                    
                    pdf.ln(10)
                    
                    # Invoice title
                    pdf.set_font('DejaVu', '', 14)
                    pdf.cell(0, 10, 'INVOICE', ln=True, align='C')
                    pdf.ln(5)
                    
                    # Invoice details
                    pdf.set_font('DejaVu', '', 10)
                    if invoice_data:
                        pdf.cell(0, 5, f"Invoice Number: {invoice_data['number']}", ln=True)
                        pdf.cell(0, 5, f"Date: {invoice_data['date']}", ln=True)
                        pdf.cell(0, 5, f"Due Date: {invoice_data['due_date']}", ln=True)
                    else:
                        pdf.cell(0, 5, f"Date: {datetime.now().strftime('%Y-%m-%d')}", ln=True)
                    
                    pdf.ln(5)
                    
                    # Customer info
                    if customer_select.value:
                        with Session() as s:
                            customer = s.query(Contact).get(customer_select.value)
                            if customer:
                                pdf.cell(0, 5, f"Bill To: {customer.name}", ln=True)
                                pdf.cell(0, 5, f"Tax ID: {customer.tax_id}", ln=True)
                                pdf.cell(0, 5, customer.address, ln=True)
                    
                    pdf.ln(10)
                    
                    # Items table
                    pdf.set_font('DejaVu', '', 9)
                    col_widths = [80, 20, 25, 25, 30]
                    headers = ['Description', 'Qty', 'Unit Price', 'Discount', 'Total']
                    
                    for i, header in enumerate(headers):
                        pdf.cell(col_widths[i], 8, header, 1, 0, 'C')
                    pdf.ln()
                    
                    items = app.storage.user.get('invoice_items', [])
                    for item in items:
                        pdf.cell(col_widths[0], 6, item['product_name'][:35], 1)
                        pdf.cell(col_widths[1], 6, str(item['quantity']), 1, 0, 'C')
                        pdf.cell(col_widths[2], 6, f"{item['unit_price']:.2f}", 1, 0, 'R')
                        pdf.cell(col_widths[3], 6, f"{item['discount_percent']}%", 1, 0, 'C')
                        pdf.cell(col_widths[4], 6, f"{item['total_price']:.2f}", 1, 0, 'R')
                        pdf.ln()
                    
                    pdf.ln(5)
                    
                    # Totals
                    with Session() as s:
                        company = s.query(Company).first()
                        subtotal = sum(item['total_price'] for item in items)
                        vat_rate = company.vat_rate if company else 7.0
                        vat_amount = subtotal * vat_rate / 100
                        total = subtotal + vat_amount
                        
                        pdf.cell(120, 6, '', 0)
                        pdf.cell(30, 6, 'Subtotal:', 0, 0, 'R')
                        pdf.cell(30, 6, f"{subtotal:.2f}", 0, 1, 'R')
                        
                        pdf.cell(120, 6, '', 0)
                        pdf.cell(30, 6, f'VAT ({vat_rate}%):', 0, 0, 'R')
                        pdf.cell(30, 6, f"{vat_amount:.2f}", 0, 1, 'R')
                        
                        pdf.set_font('DejaVu', '', 11)
                        pdf.cell(120, 8, '', 0)
                        pdf.cell(30, 8, 'Total:', 0, 0, 'R')
                        pdf.cell(30, 8, f"{total:.2f} {company.currency if company else '฿'}", 1, 1, 'R')
                    
                    # Notes
                    if invoice_notes.value:
                        pdf.ln(5)
                        pdf.set_font('DejaVu', '', 9)
                        pdf.cell(0, 5, f"Notes: {invoice_notes.value}", ln=True)
                    
                    return pdf.output(dest='S').encode('latin-1')

                async def print_pdf():
                    """Generate and download PDF"""
                    try:
                        pdf_data = generate_pdf()
                        pdf_filename = f"invoice_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                        
                        # Create download link
                        ui.download(pdf_data, filename=pdf_filename, mime_type='application/pdf')
                        ui.notify('PDF พร้อมดาวน์โหลด', color='green')
                    except Exception as e:
                        ui.notify(f'เกิดข้อผิดพลาด: {str(e)}', color='red')

                with ui.row().classes('w-full justify-end gap-4 mt-6'):
                    ui.button('พิมพ์ PDF', icon='print', on_click=print_pdf).classes('h-12 bg-blue-600 text-white px-6 rounded-lg font-bold')
                    ui.button('บันทึกใบแจ้งหนี้', icon='save', on_click=save_invoice).classes('h-12 bg-green-600 text-white px-6 rounded-lg font-bold')

        # Initialize
        update_invoice_table()

# เริ่มต้นระบบ
if __name__ in {"__main__", "__mp_main__"}:
    print("Starting Micro-Account with All Roles Integrated...")
    ui.run(
        title='Micro-Account Expert', 
        port=8080, 
        storage_secret='grids_micro_2026_super_secret',
        reload=True
    )
