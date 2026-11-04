"""Builds wall_log_30d.csv: 40 Wall-export rows over 30 days (2026-09-01 to 2026-09-30).

31 pass; 9 holds: 4 released (one approved by the person who submitted it), 2 rejected, 1 void,
1 override, 1 still open. One pass row carries a 9-digit account value, to prove it is cut on import.
Run: python -m lookback.tests.fixtures.make_wall_log
"""
import csv
from datetime import datetime, timedelta
from pathlib import Path

HEADER = ["date_time", "payee", "amount", "request_type", "bank", "account_last4", "how_arrived", "submitted_by",
          "verdict", "reasons", "cautions", "status", "resolved_at", "who_called", "number_called", "vendor_said",
          "approver", "override_reason"]
BASE = datetime(2026, 9, 1, 13, 0, 0)

PASS_PAYEES = [("Oakland Roofing", "4120.00"), ("Great Lakes Electric", "2310.50"), ("Birmingham Lumber", "880.00"),
               ("Superior Drywall LLC", "1950.00"), ("Rochester Plumbing", "640.25"), ("Troy Equipment Rental", "715.00"),
               ("Clarkston Paving", "3300.00"), ("Lakeshore Concrete Supply", "1280.00"), ("Pontiac Tile Co", "905.40")]


def ts(day, hour, minute=0):
    return (BASE.replace(hour=hour, minute=minute) + timedelta(days=day - 1)).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def hold(day, payee, amount, rtype, last4, how, by, reasons, status, hours, caller, number, said, approver, why=""):
    at = BASE.replace(hour=14) + timedelta(days=day - 1)
    resolved = (at + timedelta(hours=hours)).strftime("%Y-%m-%dT%H:%M:%S.000Z") if hours else ""
    return [at.strftime("%Y-%m-%dT%H:%M:%S.000Z"), payee, amount, rtype, "Huron Valley Bank", last4, how, by, "HOLD",
            reasons, "", status, resolved, caller, number, said, approver, why]


def rows():
    out = []
    # 31 passes on days 1..30 (day 15 has two).
    for i in range(31):
        day = i + 1 if i < 15 else i
        payee, amount = PASS_PAYEES[i % len(PASS_PAYEES)]
        by = "Dana" if i % 4 else "Marcus"
        acct = "123456789" if i == 10 else str(1000 + (i % 9) * 111)[-4:]
        cautions = "Arrived outside payment hours. Worth checking." if i == 6 else ""
        out.append([ts(day, 9 + i % 6, i), payee, amount, "payment", "Huron Valley Bank", acct,
                    ["email", "portal", "phone"][i % 3], by, "PASS", "", cautions, "pass", "", "", "", "", "", ""])
    out += [
        hold(3, "Lakeshore Concrete Supply", "3200.00", "new vendor", "5530", "email", "Dana",
             "Payee not on file.", "released", 5, "Marcus", "248-555-0142", "Confirmed the bank details by phone.", "Priya"),
        hold(8, "Great Lakes Electric", "8450.00", "bank change", "4412", "email", "Dana",
             "Bank details changed: last 4 is 4412, file has 7781.", "released", 26, "Marcus", "248-555-0177",
             "Confirmed new account by phone.", "Priya"),
        hold(12, "Oakland Roofing", "18900.00", "payment", "2290", "portal", "Dana",
             "Amount $18,900 is more than 2x the 90-day average of $6,200.", "released", 3, "Priya", "248-555-0119",
             "Confirmed the amount for the roof deck.", "Marcus"),
        hold(17, "Birmingham Lumber", "2750.00", "new vendor", "6071", "phone", "Dana",
             "Payee not on file.", "released", 48, "Marcus", "248-555-0163", "Confirmed they are a new supplier.", "Dana"),
        hold(19, "Superior Drywall LLC", "12300.00", "bank change", "9904", "email", "Marcus",
             "Bank details changed: last 4 is 9904, file has 3318.", "rejected", 2, "Dana", "248-555-0188",
             "Vendor says it did not send a change request.", "Priya"),
        hold(22, "Pontiac Tile Co", "4980.00", "new vendor", "7745", "text", "Dana",
             "Payee not on file.", "rejected", 20, "Marcus", "248-555-0131", "No record of this order.", "Priya"),
        hold(24, "Clarkston Paving", "950.00", "payment", "1188", "portal", "Dana",
             "Payee not on file.", "void", 1, "", "", "", "", "Entered twice by mistake."),
        hold(26, "Rochester Plumbing", "6100.00", "payment", "3302", "phone", "Dana",
             "Amount $6,100 is more than 2x the 90-day average of $2,400.", "override", 1, "", "", "", "Priya",
             "Owner on site; vendor unreachable"),
        hold(29, "Troy Excavating", "9800.00", "new vendor", "8860", "email", "Marcus",
             "Payee not on file.", "open hold", 0, "", "", "", ""),
    ]
    out.sort(key=lambda r: r[0])
    return out


def main():
    path = Path(__file__).with_name("wall_log_30d.csv")
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, quoting=csv.QUOTE_ALL, lineterminator="\r\n")
        w.writerow(HEADER)
        w.writerows(rows())
    print(f"Wrote {path} ({len(rows())} rows)")


if __name__ == "__main__":
    main()
