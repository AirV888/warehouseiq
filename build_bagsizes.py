"""
BoonmaIQ Part Finder — Express Post bag size lookup
====================================================
Works out which Express Post satchel each part fits in, using our own
despatch history rather than measuring anything.

Method:
  1. Read the Sales Data Dump CSV (FY23 onwards).
  2. Keep only lines shipped via a single Express Post bag
     (Exp Post XSmall / Small / Medium / Large / XL — combos like
     "Exp Post Small x2" or "ExpPost M & S" are ignored).
  3. Keep only invoices with exactly ONE line, so the bag size can be
     attributed to that part alone.
  4. Prefer instances where Quantity = 1 (one piece in the bag). Parts with
     no qty-1 instance fall back to any single-line Express Post invoice.
  5. Where a part has been sent in more than one size, take the most
     frequently used size; ties go to the LARGER bag (safer to over-size).

Output: public/data/bagsizes.json  →  {"EM-5551": "Small", ...}

Usage:
  python build_bagsizes.py --csv "path/to/Sales Data Dump - CSV FY27 - end P01 July.csv"
"""

import argparse
import collections
import csv
import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_JSON = os.path.join(SCRIPT_DIR, 'public', 'data', 'bagsizes.json')
PRODUCTS_JSON = os.path.join(SCRIPT_DIR, 'public', 'data', 'products.json')

BAGS = {
    'exp post xsmall': 'XSmall',
    'exp post small':  'Small',
    'exp post medium': 'Medium',
    'exp post large':  'Large',
    'exp post xl':     'XL',
}
ORDER = ['XSmall', 'Small', 'Medium', 'Large', 'XL']


def pick(counter):
    """Most-used bag per part; ties go to the larger bag."""
    by_part = collections.defaultdict(dict)
    for (pid, bag), n in counter.items():
        by_part[pid][bag] = n
    return {
        pid: sorted(bags.items(), key=lambda kv: (-kv[1], -ORDER.index(kv[0])))[0][0]
        for pid, bags in by_part.items()
    }


def main():
    ap = argparse.ArgumentParser(description='Build the Express Post bag size lookup')
    ap.add_argument('--csv', required=True, help='Path to the Sales Data Dump CSV')
    args = ap.parse_args()

    invoices = collections.defaultdict(list)
    with open(args.csv, encoding='utf-8-sig', errors='replace') as fh:
        for row in csv.DictReader(fh):
            bag = BAGS.get((row.get('Ship Via') or '').strip().lower())
            if bag:
                invoices[row['Invoice No.']].append(
                    (row['Item Number'].strip().upper(), row['Quantity'], bag)
                )

    qty1, any_qty = collections.Counter(), collections.Counter()
    for lines in invoices.values():
        if len(lines) != 1:
            continue                       # more than one part on the invoice
        pid, qty, bag = lines[0]
        any_qty[(pid, bag)] += 1
        try:
            if int(float(qty)) == 1:
                qty1[(pid, bag)] += 1
        except (TypeError, ValueError):
            pass

    sizes = pick(qty1)
    for pid, bag in pick(any_qty).items():
        sizes.setdefault(pid, bag)         # fallback for parts never sent as qty 1

    # Only keep parts the app actually knows about.
    with open(PRODUCTS_JSON, encoding='utf-8') as f:
        known = {p['PartID_upper'] for p in json.load(f)}
    matched = {k: v for k, v in sorted(sizes.items()) if k in known}

    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(matched, f, separators=(',', ':'))

    pct = round(100 * len(matched) / len(known)) if known else 0
    print(f'  {len(matched)} of {len(known)} parts have a bag size ({pct}%)')
    print('  ' + ', '.join(f'{b}: {n}' for b, n in
                           collections.Counter(matched.values()).most_common()))
    print(f'  Written to {OUT_JSON}')


if __name__ == '__main__':
    main()
