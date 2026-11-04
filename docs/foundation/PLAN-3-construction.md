# PLAN-3 — Construction checks

Tell Claude Code: "Read PLAN.md, PLAN-2.md and PLAN-3-construction.md. Do not start PLAN-3 until PLAN-2 is finished. Start at Step 0. Stop after each step and show me."

## When this starts
Only after both of these are true:
1. PLAN-2 is finished and live.
2. At least one construction office is in a pilot, and Devin has run these checks **by hand** for them first.

Until then, every check below is done manually during pilots. Build only the ones offices actually used.

## Rules for this phase
- **Rule zero from PLAN-2 still wins.** Mastiff never slows down a legitimate payment.
- **Nothing in this plan creates a new hold.** Only the three PLAN-2 holds stop a payment on their own (payee not on file, bank details changed, amount out of range). Everything here shows as a **caution** on the ticket. An org owner can choose to turn one caution into a hold in settings; it is off by default.
- **Wording:** "worth checking" or "missing," never "fraud," "illegal" or "lien risk confirmed." Every construction screen carries: "Mastiff flags. It does not give legal advice. Your firm makes every payment decision."
- If something tempting isn't listed here, write it in `LATER.md` and move on.

---

## Step 0 — Audit (read only)
Confirm PLAN-2 is fully shipped. Report anything PARTIAL or MISSING. Change nothing. Stop and show me.

## Step 1 — Construction org setup
- Org setting: `industry = construction` turns on everything in this plan. Other orgs never see it.
- Vendors get an optional `type`: `subcontractor` / `supplier` / `other`.
- Optional `jobs` table: job name and address. A request can be tied to a job. Fully optional; nothing breaks without it.
- Test: a non-construction org sees no new fields.

## Step 2 — Document intake (AI reads, a human confirms)
- Upload per subcontractor: insurance certificate (COI), sworn statement, lien waivers. PDF or phone photo.
- AI pulls out the key fields:
  - COI: insured name, policy dates
  - Sworn statement: sub name, job, contract amount, amount paid to date
  - Waiver: sub name, job, amount, through-date, signed yes/no
- **Every extraction shows a preview, and a person confirms or fixes it before it is saved.** Never trust the AI read on its own.
- Original file is kept and linked from the record.
- Test: 10 sample documents (clean, blurry, handwritten); every one goes through the confirm screen, none save automatically.

## Step 3 — Pre-payment cautions for subcontractors
When a request is to a `subcontractor`, check and show cautions:
- Insurance certificate missing, expired, or expiring within 14 days
- No lien waiver on file covering the **previous** payment to this sub on this job
- Waiver name doesn't match the vendor name on file (use the closest-match hint from PLAN-2)
- Payment would push total paid above the sworn statement's contract amount
- Each caution is one plain-English line, for example: `insurance certificate expired Sep 30 — worth checking before paying`.
- Test: a sub with everything current → PASS, no cautions, no extra step.

## Step 4 — Positive pay export (check fraud)
- Export issued checks as a CSV: check number, issue date, amount, payee.
- Owner maps columns to their bank's format once; the mapping is saved per org.
- **Mastiff never sends anything to the bank.** The office uploads the file themselves.
- Test: the export matches the checks entered for that week exactly.

## Step 5 — New vendor W-9 check
- When adding a new vendor, optionally record the W-9 legal name and business name.
- Caution if the W-9 name doesn't match the payee name.
- The checklist reminds the office to run IRS TIN Matching themselves as the payer. Mastiff only records the result: matched / not matched / not run.
- **Never store full tax IDs.** Last 4 digits at most.
- Test: a mismatched W-9 name shows a caution; the record never contains a full TIN.

## Step 6 — Construction in the Monday digest
Add one short section to the existing weekly digest:
- Insurance certificates expiring in the next 30 days
- Subs paid this week with a missing waiver
No new notifications. No new emails.

---

## Do not
- File, track or advise on liens
- Give legal advice of any kind
- Send files to banks or connect to bank accounts
- Store full tax IDs or full account numbers
- Add new holds beyond PLAN-2's three
- Auto-save anything the AI extracted without a person confirming it
