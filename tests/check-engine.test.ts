import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { comparePayslip } from "../lib/check/compare";
import { normalizePayslipFields } from "../lib/check/normalize";

const fixturesDirectory = path.join(process.cwd(), "fixtures", "check");

async function loadFixture(fileName: string) {
  return readFile(path.join(fixturesDirectory, fileName), "utf8");
}

function normalizeCurrencyText(value: string | undefined) {
  return (value ?? "").replace(/[^\d.-]/g, "");
}

test("pass fixture produces a pass verdict with all core fields", async () => {
  const text = await loadFixture("pass-monthly.txt");

  const normalized = normalizePayslipFields(text);
  const verdict = comparePayslip(normalized);

  assert.equal(normalized.foundFields.length, 5);
  assert.equal(normalized.missingFields.length, 0);
  assert.equal(verdict.overall, "pass");
  assert.equal(verdict.checks[0]?.severity, "pass");
  assert.equal(verdict.checks[1]?.severity, "pass");
  assert.equal(verdict.checks[2]?.severity, "pass");
  assert.equal(verdict.checks[3]?.severity, "pass");
  assert.equal(verdict.checks[1]?.code, "paye");
  assert.equal(
    normalizeCurrencyText(verdict.checks[2]?.metrics?.extractedValue),
    "2162288",
  );
  assert.equal(
    normalizeCurrencyText(verdict.checks[2]?.metrics?.expectedValue),
    "2162288",
  );
  assert.equal(
    normalizeCurrencyText(verdict.checks[2]?.metrics?.differenceValue),
    "000",
  );
  assert.equal(
    normalizeCurrencyText(verdict.checks[3]?.metrics?.extractedValue),
    "17712",
  );
  assert.equal(
    normalizeCurrencyText(verdict.checks[3]?.metrics?.expectedValue),
    "17712",
  );
});

test("warning fixture produces a warning verdict for near-miss values", async () => {
  const text = await loadFixture("warning-monthly.txt");

  const normalized = normalizePayslipFields(text);
  const verdict = comparePayslip(normalized);

  assert.equal(normalized.foundFields.length, 5);
  assert.equal(verdict.overall, "warning");
  assert.equal(verdict.checks[1]?.code, "paye");
  assert.equal(verdict.checks[1]?.severity, "warning");
  assert.equal(verdict.checks[2]?.code, "net-pay");
  assert.equal(verdict.checks[2]?.severity, "warning");
  assert.equal(
    normalizeCurrencyText(verdict.checks[2]?.metrics?.differenceValue),
    "3000",
  );
  assert.equal(verdict.checks[3]?.code, "uif");
  assert.equal(verdict.checks[3]?.severity, "warning");
  assert.equal(
    normalizeCurrencyText(verdict.checks[3]?.metrics?.differenceValue),
    "1788",
  );
});

test("fail fixture produces a fail verdict for strong mismatches", async () => {
  const text = await loadFixture("fail-monthly.txt");

  const normalized = normalizePayslipFields(text);
  const verdict = comparePayslip(normalized);

  assert.equal(normalized.foundFields.length, 4);
  assert.equal(normalized.missingFields.length, 1);
  assert.equal(verdict.overall, "fail");
  assert.equal(verdict.checks[0]?.code, "completeness");
  assert.equal(verdict.checks[0]?.severity, "pass");
  assert.equal(verdict.checks[1]?.code, "paye");
  assert.equal(verdict.checks[1]?.severity, "fail");
  assert.equal(verdict.checks[2]?.code, "net-pay");
  assert.equal(verdict.checks[2]?.severity, "fail");
  assert.equal(
    normalizeCurrencyText(verdict.checks[2]?.metrics?.expectedValue),
    "2170000",
  );
  assert.equal(
    normalizeCurrencyText(verdict.checks[2]?.metrics?.differenceValue),
    "420000",
  );
  assert.equal(verdict.checks[3]?.code, "uif");
  assert.equal(verdict.checks[3]?.severity, "fail");
  assert.equal(
    normalizeCurrencyText(verdict.checks[3]?.metrics?.expectedValue),
    "17712",
  );
  assert.equal(
    normalizeCurrencyText(verdict.checks[3]?.metrics?.differenceValue),
    "7712",
  );
});

test("normalization matches 'Pay as you Earn' as PAYE", () => {
  const normalized = normalizePayslipFields(
    "Gross Pay: 32932.11 Pay as you Earn 6200.00 UIF 177.12 Net Pay 26055.91 Period: 2025/12/31",
  );

  const payeField = normalized.foundFields.find(
    (field) => field.field === "paye",
  );

  assert.ok(payeField);
  assert.equal(
    normalizeCurrencyText(
      "formattedValue" in payeField ? payeField.formattedValue : "",
    ),
    "620000",
  );

  const payPeriodField = normalized.foundFields.find(
    (field) => field.field === "payPeriod",
  );

  assert.ok(payPeriodField);
  assert.equal(payPeriodField.value, "2025/12/31");
});

test("uif check applies the monthly statutory cap", () => {
  const normalized = normalizePayslipFields(
    "Gross Pay: 32932.11 Pay as you Earn 3904.02 UIF 177.12 Net Pay 26055.91 Period: 2025/12/31",
  );
  const verdict = comparePayslip(normalized);
  const uifCheck = verdict.checks.find((check) => check.code === "uif");

  assert.ok(uifCheck);
  assert.equal(uifCheck.severity, "pass");
  assert.equal(
    normalizeCurrencyText(uifCheck.metrics?.expectedValue),
    "17712",
  );
});

test("net pay reconciliation uses total deductions when available", () => {
  const normalized = normalizePayslipFields(
    "Gross Pay: 32932.11 Pay as you Earn 3904.02 UIF 177.12 Total Deductions 6876.20 Net Pay 26055.91 Period: 2025/12/31",
  );
  const verdict = comparePayslip(normalized);
  const netPayCheck = verdict.checks.find((check) => check.code === "net-pay");

  assert.ok(netPayCheck);
  assert.equal(netPayCheck.severity, "pass");
  assert.equal(
    normalizeCurrencyText(netPayCheck.metrics?.expectedValue),
    "2605591",
  );
  assert.equal(
    normalized.supplementaryFields.find((field) => field.field === "totalDeductions")
      ?.value,
    6876.2,
  );
});

test("normalization matches broader South African payslip aliases", () => {
  const normalized = normalizePayslipFields(
    [
      "Salary Advice",
      "Salary Period: 2026/03/31",
      "Basic Salary: 25000.00",
      "Employees Tax: 3200.00",
      "UIF Contribution: 177.12",
      "Amount Due: 21622.88",
      "Deduction Total: 3377.12",
    ].join(" "),
  );

  const grossPay = normalized.foundFields.find((field) => field.field === "grossPay");
  const paye = normalized.foundFields.find((field) => field.field === "paye");
  const uif = normalized.foundFields.find((field) => field.field === "uif");
  const netPay = normalized.foundFields.find((field) => field.field === "netPay");
  const payPeriod = normalized.foundFields.find((field) => field.field === "payPeriod");
  const totalDeductions = normalized.supplementaryFields.find(
    (field) => field.field === "totalDeductions",
  );

  assert.ok(grossPay);
  assert.ok(paye);
  assert.ok(uif);
  assert.ok(netPay);
  assert.ok(payPeriod);
  assert.ok(totalDeductions);
  assert.equal(grossPay.value, 25000);
  assert.equal(paye.value, 3200);
  assert.equal(uif.value, 177.12);
  assert.equal(netPay.value, 21622.88);
  assert.equal(payPeriod.value, "2026/03/31");
  assert.equal(totalDeductions.value, 3377.12);
});

test("normalization captures supplementary payroll lines for richer explanations", () => {
  const normalized = normalizePayslipFields(
    [
      "Gross Salary: 32932.11",
      "PAYE: 3904.02",
      "UIF: 177.12",
      "Pension Fund: 1203.90",
      "Bonitas Medical Aid: 1429.00",
      "13th Cheque: 16052.03",
      "Total Deductions: 6876.20",
      "Net Pay: 26055.91",
      "Pay Period: 2025/12/31",
    ].join(" "),
  );

  const supplementaryFields = normalized.supplementaryFields.reduce<
    Record<string, number>
  >((accumulator, field) => {
    accumulator[field.field] = field.value;
    return accumulator;
  }, {});

  assert.equal(supplementaryFields.totalDeductions, 6876.2);
  assert.equal(supplementaryFields.pension, 1203.9);
  assert.equal(supplementaryFields.medicalAid, 1429);
  assert.equal(supplementaryFields.bonus, 16052.03);
});

test("sanitized employer-style fixture preserves realistic payslip layout coverage", async () => {
  const text = await loadFixture("employer-layout-scorpion-sanitized.txt");

  const normalized = normalizePayslipFields(text);
  const verdict = comparePayslip(normalized);
  const supplementaryFields = normalized.supplementaryFields.reduce<
    Record<string, number>
  >((accumulator, field) => {
    accumulator[field.field] = field.value;
    return accumulator;
  }, {});

  assert.equal(normalized.foundFields.length, 5);
  assert.equal(normalized.missingFields.length, 0);
  assert.equal(verdict.overall, "pass");
  assert.equal(normalized.foundFields.find((field) => field.field === "grossPay")?.value, 16850);
  assert.equal(normalized.foundFields.find((field) => field.field === "paye")?.value, 2300);
  assert.equal(normalized.foundFields.find((field) => field.field === "uif")?.value, 168.5);
  assert.equal(normalized.foundFields.find((field) => field.field === "netPay")?.value, 12281.5);
  assert.equal(
    normalized.foundFields.find((field) => field.field === "payPeriod")?.value,
    "2026/03/31",
  );
  assert.equal(supplementaryFields.totalDeductions, 4568.5);
  assert.equal(supplementaryFields.pension, 900);
  assert.equal(supplementaryFields.medicalAid, 1200);
  assert.equal(supplementaryFields.bonus, 1500);
  assert.equal(
    normalizeCurrencyText(verdict.checks[2]?.metrics?.expectedValue),
    "1228150",
  );
});
