# PaySlip Checker

PaySlip Checker is a payroll workspace built around two jobs:

- `Calculate` for user-input estimation tools
- `Check` for document-based payslip verification

The current MVP is centered on `Check`.

## Current MVP

The `Check` module accepts one monthly text-based PDF payslip and:

- extracts embedded PDF text
- normalizes core payroll fields
- compares extracted values against deterministic rules
- returns `pass`, `warning`, or `fail`

### Core fields

- Gross pay
- PAYE
- UIF
- Net pay
- Pay period

### Current checks

- Core field completeness
- PAYE reasonableness
- UIF reasonableness
- Net pay reconciliation

### Supported now

- One text-based `.pdf` payslip
- Files up to `5 MB`
- Password-protected PDFs with password prompt support
- Deterministic label matching such as `PAYE`, `Pay as you Earn`, `Employees Tax`, and `Income Tax`

### Explicitly outside MVP

- Scanned/image payslips
- OCR
- Bonuses and complex fringe benefits
- Pension or provident-fund edge cases
- Multi-file history
- AI fraud-detection claims
- Employer-specific advanced payroll logic

## Product Structure

### `Calculate`

Planned calculator section for:

- Two-Pot Calculator
- Net Pay Calculator
- PAYE Calculator
- Salary Breakdown Calculator

### `Check`

Main verification workflow for payslip uploads and deterministic consistency checks.

## Stack

- Next.js `16`
- React `19`
- TypeScript
- Tailwind CSS `4`
- `pdfjs-dist` for PDF text extraction

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the dev server:

```bash
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Useful Routes

- `/`
- `/calculate`
- `/check`

## Validation Commands

Run lint:

```bash
pnpm lint
```

Run the Check engine tests:

```bash
pnpm test:check
```

Build the app:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

## How Check Works

1. User uploads a PDF payslip.
2. The server validates file type and size.
3. A local extraction worker reads embedded PDF text.
4. The normalization layer maps text into known payroll fields.
5. The comparison engine evaluates deterministic checks.
6. The UI shows verdicts, explanations, extracted values, expected values, and differences.

## Privacy Notes

The current implementation is intentionally conservative:

- uploaded files are processed temporarily for extraction
- temporary extraction artifacts are deleted after processing
- the app does not rely on OCR in this MVP
- verification is rules-based and traceable

## Project Status

This repository is still early-stage, but the `Check` MVP foundation is already working and tested. The next major improvements will likely be:

- stronger payroll-rule coverage
- better result explanations
- auth and user history
- the first working calculators under `Calculate`
