from datetime import date
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from . import db, login


class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_admin = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


@login.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class Account(db.Model):
    __tablename__ = 'accounts'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(32), unique=True, nullable=False)
    name = db.Column(db.String(128), nullable=False)
    type = db.Column(db.String(32), nullable=False)  # asset, liability, equity, revenue, expense


class JournalEntry(db.Model):
    __tablename__ = 'journal_entries'
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, default=date.today, nullable=False)
    description = db.Column(db.String(255))
    lines = db.relationship('JournalLine', backref='entry', cascade='all, delete-orphan')


class JournalLine(db.Model):
    __tablename__ = 'journal_lines'
    id = db.Column(db.Integer, primary_key=True)
    entry_id = db.Column(db.Integer, db.ForeignKey('journal_entries.id'))
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'))
    debit = db.Column(db.Numeric(14, 2), default=0)
    credit = db.Column(db.Numeric(14, 2), default=0)
    account = db.relationship('Account')


class Invoice(db.Model):
    __tablename__ = 'invoices'
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.String(64), unique=True)
    date = db.Column(db.Date, default=date.today)
    customer = db.Column(db.String(128))
    total = db.Column(db.Numeric(14, 2), default=0)
    paid = db.Column(db.Boolean, default=False)


class StockItem(db.Model):
    __tablename__ = 'stock_items'
    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(64), unique=True)
    name = db.Column(db.String(128))
    quantity = db.Column(db.Integer, default=0)
    unit_price = db.Column(db.Numeric(14, 2), default=0)
