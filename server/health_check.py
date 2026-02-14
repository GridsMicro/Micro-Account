#!/usr/bin/env python3
"""Quick health-check script for the server.

Usage:
  # check HTTP health endpoint
  python health_check.py --url http://localhost:5000/health

  # or check DB directly (requires sqlalchemy and DB driver)
  DATABASE_URL=postgresql+psycopg2://account:account@localhost:5432/account_db python health_check.py --db

The script returns exit code 0 when OK, non-zero otherwise.
"""
import os
import sys
import argparse
import requests


def check_http(url):
    try:
        r = requests.get(url, timeout=5)
        print('HTTP', r.status_code, r.text[:200])
        return r.status_code == 200
    except Exception as e:
        print('HTTP error:', e)
        return False


def check_db(database_url):
    try:
        from sqlalchemy import create_engine, text
    except ImportError:
        print('sqlalchemy not installed. Install with: pip install SQLAlchemy psycopg2-binary')
        return False
    try:
        engine = create_engine(database_url, pool_pre_ping=True)
        with engine.connect() as conn:
            r = conn.execute(text('SELECT 1')).scalar()
            print('DB SELECT 1 ->', r)
            return r == 1
    except Exception as e:
        print('DB error:', e)
        return False


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--url', help='health endpoint URL, e.g. http://localhost:5000/health')
    p.add_argument('--db', action='store_true', help='check DB using DATABASE_URL env var')
    args = p.parse_args()

    ok = True
    if args.url:
        ok = check_http(args.url) and ok
    if args.db:
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            print('DATABASE_URL not set')
            ok = False
        else:
            ok = check_db(database_url) and ok

    if ok:
        print('OK')
        sys.exit(0)
    else:
        print('FAIL')
        sys.exit(2)


if __name__ == '__main__':
    main()
