from flask import Blueprint, render_template, request, redirect, url_for, flash, Response, jsonify
from flask_login import current_user, login_user, logout_user, login_required
from . import db
from .models import User, Account, JournalEntry, JournalLine, Invoice, StockItem
from sqlalchemy import text
from decimal import Decimal
import io, csv

bp = Blueprint('main', __name__)


@bp.route('/health')
def health():
    try:
        # simple DB call
        db.session.execute(text('SELECT 1'))
        return jsonify(status='ok')
    except Exception as e:
        return jsonify(status='error', message=str(e)), 500


@bp.route('/')
@login_required
def index():
    accounts = Account.query.limit(5).all()
    invoices = Invoice.query.order_by(Invoice.date.desc()).limit(5).all()
    return render_template('index.html', accounts=accounts, invoices=invoices)


@bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('main.index'))
        flash('Invalid credentials')
    return render_template('login.html')


@bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.login'))


@bp.route('/accounts', methods=['GET', 'POST'])
@login_required
def accounts():
    if request.method == 'POST':
        code = request.form['code']
        name = request.form['name']
        type_ = request.form['type']
        a = Account(code=code, name=name, type=type_)
        db.session.add(a)
        db.session.commit()
        return redirect(url_for('main.accounts'))
    accounts = Account.query.order_by(Account.code).all()
    return render_template('accounts.html', accounts=accounts)


@bp.route('/journal', methods=['GET', 'POST'])
@login_required
def journal():
    if request.method == 'POST':
        date = request.form.get('date') or None
        description = request.form.get('description')
        debit_acc = request.form.get('debit_account')
        debit_amt = Decimal(request.form.get('debit_amount') or '0')
        credit_acc = request.form.get('credit_account')
        credit_amt = Decimal(request.form.get('credit_amount') or '0')

        entry = JournalEntry(description=description)
        db.session.add(entry)
        db.session.flush()

        da = Account.query.get(int(debit_acc))
        ca = Account.query.get(int(credit_acc))
        dl = JournalLine(entry_id=entry.id, account_id=da.id, debit=debit_amt, credit=0)
        cl = JournalLine(entry_id=entry.id, account_id=ca.id, debit=0, credit=credit_amt)
        db.session.add_all([dl, cl])
        db.session.commit()
        return redirect(url_for('main.journal'))

    entries = JournalEntry.query.order_by(JournalEntry.date.desc()).limit(50).all()
    accounts = Account.query.order_by(Account.code).all()
    return render_template('journal.html', entries=entries, accounts=accounts)


@bp.route('/invoices')
@login_required
def invoices():
    invs = Invoice.query.order_by(Invoice.date.desc()).all()
    return render_template('invoices.html', invoices=invs)


@bp.route('/reports/pl')
@login_required
def report_pl():
    # Profit & Loss: sum revenue - expense
    revenues = db.session.query(Account).filter(Account.type == 'revenue').all()
    expenses = db.session.query(Account).filter(Account.type == 'expense').all()

    def sum_for(accounts_list):
        total = Decimal('0')
        for a in accounts_list:
            s = db.session.query(db.func.coalesce(db.func.sum(JournalLine.debit - JournalLine.credit), 0)).join(JournalLine.account).filter(JournalLine.account_id == a.id).scalar() or 0
            total += Decimal(s)
        return total

    rev_total = sum_for(revenues)
    exp_total = sum_for(expenses)
    result = rev_total - exp_total

    if request.args.get('format') == 'csv':
        si = io.StringIO()
        cw = csv.writer(si)
        cw.writerow(['Type', 'Amount'])
        cw.writerow(['Revenue', str(rev_total)])
        cw.writerow(['Expense', str(exp_total)])
        cw.writerow(['Profit/Loss', str(result)])
        return Response(si.getvalue(), mimetype='text/csv', headers={"Content-Disposition": "attachment;filename=pl.csv"})

    return render_template('report_pl.html', revenue=rev_total, expense=exp_total, result=result)


@bp.route('/reports/bs')
@login_required
def report_bs():
    assets = db.session.query(db.func.coalesce(db.func.sum(JournalLine.debit - JournalLine.credit), 0)).join(Account).filter(Account.type == 'asset').scalar() or 0
    liabilities = db.session.query(db.func.coalesce(db.func.sum(JournalLine.credit - JournalLine.debit), 0)).join(Account).filter(Account.type == 'liability').scalar() or 0
    equity = db.session.query(db.func.coalesce(db.func.sum(JournalLine.credit - JournalLine.debit), 0)).join(Account).filter(Account.type == 'equity').scalar() or 0
    return render_template('report_bs.html', assets=assets, liabilities=liabilities, equity=equity)
