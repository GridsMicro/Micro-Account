import click
from flask.cli import with_appcontext
from app import create_app, db
from flask_migrate import init as fm_init, migrate as fm_migrate, upgrade as fm_upgrade, revision as fm_revision, stamp as fm_stamp


app = create_app()


@click.group()
def cli():
    """Management commands for migrations and seeding"""
    pass


@cli.command('db_init')
@with_appcontext
def db_init():
    fm_init()


@cli.command('db_migrate')
@with_appcontext
def db_migrate():
    fm_migrate(message='auto migration')


@cli.command('db_upgrade')
@with_appcontext
def db_upgrade():
    fm_upgrade()


@cli.command('db_stamp')
@with_appcontext
def db_stamp():
    fm_stamp()


@cli.command('db_revision')
@with_appcontext
def db_revision():
    fm_revision(message='revision')


@cli.command('seed')
@with_appcontext
def seed():
    """Seed sample data: admin user, sample accounts, one invoice and a journal entry"""
    from app.models import User, Account, Invoice, JournalEntry, JournalLine
    # admin user
    if not User.query.filter_by(username='admin').first():
        u = User(username='admin', is_admin=True)
        u.set_password('admin')
        db.session.add(u)

    # sample accounts
    accounts = [
        ('1000', 'Cash', 'asset'),
        ('2000', 'Accounts Payable', 'liability'),
        ('3000', 'Equity', 'equity'),
        ('4000', 'Sales', 'revenue'),
        ('5000', 'Expenses', 'expense'),
    ]
    for code, name, type_ in accounts:
        if not Account.query.filter_by(code=code).first():
            a = Account(code=code, name=name, type=type_)
            db.session.add(a)

    db.session.commit()

    # sample invoice
    if not Invoice.query.first():
        inv = Invoice(number='INV-1000', customer='Sample Customer', total=1000)
        db.session.add(inv)

    db.session.commit()

    # sample journal entry: debit Cash, credit Sales
    cash = Account.query.filter_by(code='1000').first()
    sales = Account.query.filter_by(code='4000').first()
    if cash and sales:
        je = JournalEntry(description='Sample sale')
        db.session.add(je)
        db.session.flush()
        jl1 = JournalLine(entry_id=je.id, account_id=cash.id, debit=1000, credit=0)
        jl2 = JournalLine(entry_id=je.id, account_id=sales.id, debit=0, credit=1000)
        db.session.add_all([jl1, jl2])
        db.session.commit()

    click.echo('Seeding complete')


if __name__ == '__main__':
    cli()
