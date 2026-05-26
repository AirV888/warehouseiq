"""
BoonmaIQ Part Finder — Data Refresh Script
===========================================
Run this script whenever you have a new CSV export from AutoInfo.
It will:
  1. Convert the CSV to products.json
  2. Update the stock date in metadata.json to today
  3. Bump the service worker cache version (so the app picks up fresh data)
  4. Commit and push everything to GitHub (Vercel auto-deploys)

Usage:
  python update_data.py
  python update_data.py --csv "MyExport.csv"           # specify a different filename
  python update_data.py --date "1 June 2026"           # override the stock date
  python update_data.py --no-push                      # convert only, don't push
"""

import csv
import json
import re
import os
import sys
import subprocess
import argparse
from datetime import date

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CSV  = os.path.join(SCRIPT_DIR, 'PartFinderAppData_Upload.csv')
PRODUCTS_JSON = os.path.join(SCRIPT_DIR, 'public', 'data', 'products.json')
METADATA_JSON = os.path.join(SCRIPT_DIR, 'public', 'data', 'metadata.json')
SW_JS         = os.path.join(SCRIPT_DIR, 'public', 'sw.js')

# ── Helpers ────────────────────────────────────────────────────────────────────
MONTH_RE = re.compile(r'^[A-Z][a-z]{2}-\d{2}$')

def format_date(d: date) -> str:
    """Returns e.g. '26 May 2026'"""
    return d.strftime('%-d %B %Y') if sys.platform != 'win32' else d.strftime('%#d %B %Y')

def convert_csv(csv_path: str) -> list:
    """Convert the AutoInfo CSV export to a list of product dicts."""
    # Load existing products.json to preserve PhotoFile mappings
    photo_map = {}
    if os.path.exists(PRODUCTS_JSON):
        with open(PRODUCTS_JSON, encoding='utf-8') as f:
            existing = json.load(f)
        photo_map = {p['PartID_upper']: p.get('PhotoFile', '') for p in existing}

    products = []
    with open(csv_path, encoding='utf-8-sig', errors='replace') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"  CSV rows loaded: {len(rows)}")

    for row in rows:
        part_id       = row.get('PartID', '').strip()
        part_id_upper = part_id.upper()

        # Sales months
        sales = []
        total_sales = 0
        for col, val in row.items():
            col = col.strip()
            if MONTH_RE.match(col):
                try:
                    qty = int(float(val)) if val and val.strip() else 0
                except ValueError:
                    qty = 0
                sales.append({'month': col, 'qty': qty})
                total_sales += qty

        avg_monthly = round(total_sales / len(sales), 2) if sales else 0
        last_12     = sales[-12:] if len(sales) >= 12 else sales
        avg_12mth   = round(sum(s['qty'] for s in last_12) / len(last_12), 2) if last_12 else 0

        try:
            current_stock = int(float(row.get('Current Stock', 0) or 0))
        except (ValueError, TypeError):
            current_stock = 0

        try:
            on_order = int(float(row.get('On Order', 0) or 0))
        except (ValueError, TypeError):
            on_order = 0

        photo_file = photo_map.get(part_id_upper, f'{part_id_upper}.png')

        products.append({
            'PartID':         part_id,
            'PartID_upper':   part_id_upper,
            'PartDescription': row.get('PartDescription', '').strip(),
            'PartBinAddress': row.get('PartBinAddress', '').strip(),
            'PartBarCode':    row.get('PartBarCode', '').strip(),
            'ProductClass':   row.get('Product Class', '').strip(),
            'CurrentStock':   current_stock,
            'OnOrder':        on_order,
            'PhotoFile':      photo_file,
            'TotalSales':     total_sales,
            'AvgMonthlySales': avg_monthly,
            'Avg12MthSales':  avg_12mth,
            'sales':          sales,
        })

    return products

def bump_sw_version(sw_path: str) -> str:
    """Increment the wiq-vN cache version in sw.js. Returns the new version string."""
    with open(sw_path, encoding='utf-8') as f:
        content = f.read()

    match = re.search(r"const CACHE = 'wiq-v(\d+)'", content)
    if not match:
        print("  WARNING: Could not find cache version in sw.js — skipping version bump.")
        return None

    old_version = int(match.group(1))
    new_version = old_version + 1
    new_content = content.replace(
        f"const CACHE = 'wiq-v{old_version}'",
        f"const CACHE = 'wiq-v{new_version}'"
    )

    with open(sw_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return f'wiq-v{new_version}'

def git_push(commit_message: str) -> bool:
    """Stage all changes, commit, and push. Returns True on success."""
    repo = SCRIPT_DIR
    try:
        subprocess.run(['git', 'add', 'public/data/products.json', 'public/data/metadata.json', 'public/sw.js'],
                       cwd=repo, check=True)
        subprocess.run(['git', 'commit', '-m', commit_message],
                       cwd=repo, check=True)
        subprocess.run(['git', 'push'],
                       cwd=repo, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n  ERROR during git operation: {e}")
        print("  Your files are updated locally. Please push manually from Git Bash:")
        print('  git add public/data/products.json public/data/metadata.json public/sw.js')
        print(f'  git commit -m "{commit_message}"')
        print('  git push')
        return False

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description='BoonmaIQ data refresh')
    parser.add_argument('--csv',      default=DEFAULT_CSV, help='Path to the AutoInfo CSV export')
    parser.add_argument('--date',     default=None,        help='Stock date override e.g. "1 June 2026" (defaults to today)')
    parser.add_argument('--no-push',  action='store_true', help='Convert files only — do not push to GitHub')
    args = parser.parse_args()

    print('\n=== BoonmaIQ Data Refresh ===\n')

    # 1. Validate CSV
    csv_path = args.csv
    if not os.path.exists(csv_path):
        print(f'ERROR: CSV file not found at:\n  {csv_path}')
        print('\nMake sure the CSV is saved as "PartFinderAppData_Upload.csv" in the app folder,')
        print('or run:  python update_data.py --csv "path/to/your/file.csv"')
        sys.exit(1)

    print(f'CSV:  {os.path.basename(csv_path)}')

    # 2. Convert CSV → products.json
    print('\n[1/3] Converting CSV to products.json...')
    products = convert_csv(csv_path)
    with open(PRODUCTS_JSON, 'w', encoding='utf-8') as f:
        json.dump(products, f, separators=(',', ':'))
    on_order_count = sum(1 for p in products if p['OnOrder'] > 0)
    print(f'  Done — {len(products)} parts, {on_order_count} with stock on order')

    # 3. Update metadata.json with stock date
    print('\n[2/3] Updating stock date...')
    stock_date = args.date if args.date else format_date(date.today())
    with open(METADATA_JSON, 'w', encoding='utf-8') as f:
        json.dump({'stockAsAt': stock_date}, f)
    print(f'  Stock date set to: {stock_date}')

    # 4. Bump service worker cache version
    print('\n[3/3] Bumping service worker cache version...')
    new_version = bump_sw_version(SW_JS)
    if new_version:
        print(f'  Cache version → {new_version}')

    # 5. Push to GitHub
    if args.no_push:
        print('\nFiles updated locally. Skipping push (--no-push was set).')
    else:
        print('\n[Pushing to GitHub]...')
        commit_msg = f'Data refresh — {stock_date}'
        success = git_push(commit_msg)
        if success:
            print('\n✓ All done! Vercel is now deploying the update.')
            print('  The app will show fresh data within 1–2 minutes.')
        else:
            print('\nFiles are ready — just push manually when you can.')

    print()

if __name__ == '__main__':
    main()
