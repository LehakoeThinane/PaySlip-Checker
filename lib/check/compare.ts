import type {
  CheckSeverity,
  NormalizedMoneyField,
  NormalizedPayslipData,
  PayslipCheckResult,
  PayslipVerdict,
} from "./types";

const UIF_RATE = 0.01;
const UIF_MONTHLY_CAP = 177.12;
const UIF_TOLERANCE = 1;
const NET_PAY_TOLERANCE = 2;
const PAYE_WARNING_MIN_RATE = 0.08;
const PAYE_WARNING_MAX_RATE = 0.30;
const PAYE_FAIL_MIN_RATE = 0.04;
const PAYE_FAIL_MAX_RATE = 0.35;

function getMoneyField(
  normalized: NormalizedPayslipData,
  field: NormalizedMoneyField["field"],
) {
  const allMoneyFields = [
    ...normalized.foundFields,
    ...normalized.supplementaryFields,
  ];

  return allMoneyFields.find(
    (item): item is NormalizedMoneyField =>
      "formattedValue" in item && item.field === field,
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getOverallSeverity(checks: PayslipCheckResult[]): CheckSeverity {
  if (checks.some((check) => check.severity === "fail")) {
    return "fail";
  }

  if (checks.some((check) => check.severity === "warning")) {
    return "warning";
  }

  return "pass";
}

function formatPercentage(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function getSupplementarySummary(normalized: NormalizedPayslipData) {
  if (normalized.supplementaryFields.length === 0) {
    return null;
  }

  return normalized.supplementaryFields.map((field) => field.label).join(", ");
}

function buildCompletenessCheck(
  normalized: NormalizedPayslipData,
): PayslipCheckResult {
  const missingCoreMoneyFields = normalized.missingFields.filter((field) =>
    field.field === "grossPay" ||
    field.field === "paye" ||
    field.field === "uif" ||
    field.field === "netPay"
  );

  if (missingCoreMoneyFields.length === 0) {
    return {
      code: "completeness",
      title: "Core fields present",
      severity: "pass",
      summary: "All core money fields were matched.",
      detail:
        "Gross pay, PAYE, UIF, and net pay were all found in the extracted text.",
    };
  }

  if (missingCoreMoneyFields.length <= 2) {
    return {
      code: "completeness",
      title: "Some fields are missing",
      severity: "warning",
      summary: "The payslip is only partially structured for MVP checks.",
      detail: `Missing core fields: ${missingCoreMoneyFields
        .map((field) => field.label)
        .join(", ")}.`,
    };
  }

  return {
    code: "completeness",
    title: "Not enough fields for a reliable check",
    severity: "fail",
    summary: "Too many core fields are missing.",
    detail: `Missing core fields: ${missingCoreMoneyFields
      .map((field) => field.label)
      .join(", ")}.`,
  };
}

function buildNetPayCheck(normalized: NormalizedPayslipData): PayslipCheckResult {
  const grossPay = getMoneyField(normalized, "grossPay");
  const paye = getMoneyField(normalized, "paye");
  const uif = getMoneyField(normalized, "uif");
  const netPay = getMoneyField(normalized, "netPay");
  const totalDeductions = getMoneyField(normalized, "totalDeductions");

  if (!grossPay || !paye || !uif || !netPay) {
    return {
      code: "net-pay",
      title: "Net pay reconciliation",
      severity: "warning",
      summary: "Skipped because one or more required fields are missing.",
      detail:
        "Gross pay, PAYE, UIF, and net pay are all required before net pay can be reconciled.",
    };
  }

  const basicDeductions = paye.value + uif.value;
  const expectedNetPay = totalDeductions
    ? grossPay.value - totalDeductions.value
    : grossPay.value - basicDeductions;
  const difference = Math.abs(expectedNetPay - netPay.value);
  const expectationLabel = totalDeductions
    ? "Expected net pay from total deductions"
    : "Expected net pay";
  const reconciliationBasis = totalDeductions
    ? `Using gross pay minus total deductions (${totalDeductions.formattedValue}).`
    : `Using gross pay minus PAYE and UIF only (${formatCurrency(basicDeductions)} total deductions found across those two fields).`;

  if (difference <= NET_PAY_TOLERANCE) {
    return {
      code: "net-pay",
      title: "Net pay reconciliation",
      severity: "pass",
      summary: "Net pay matches the extracted deductions within tolerance.",
      detail: `${reconciliationBasis} Expected ${formatCurrency(expectedNetPay)} and found ${netPay.formattedValue}. Difference: ${formatCurrency(difference)}.`,
      metrics: {
        extractedLabel: "Extracted net pay",
        extractedValue: netPay.formattedValue,
        expectedLabel: expectationLabel,
        expectedValue: formatCurrency(expectedNetPay),
        differenceLabel: "Difference",
        differenceValue: formatCurrency(difference),
      },
    };
  }

  if (difference <= 50) {
    return {
      code: "net-pay",
      title: "Net pay reconciliation",
      severity: "warning",
      summary: "Net pay is close but not exact.",
      detail: `${reconciliationBasis} Expected ${formatCurrency(expectedNetPay)} and found ${netPay.formattedValue}. Difference: ${formatCurrency(difference)}.`,
      metrics: {
        extractedLabel: "Extracted net pay",
        extractedValue: netPay.formattedValue,
        expectedLabel: expectationLabel,
        expectedValue: formatCurrency(expectedNetPay),
        differenceLabel: "Difference",
        differenceValue: formatCurrency(difference),
      },
    };
  }

  return {
    code: "net-pay",
    title: "Net pay reconciliation",
    severity: "fail",
    summary: "Net pay does not reconcile with the extracted deductions.",
    detail: `${reconciliationBasis} Expected ${formatCurrency(expectedNetPay)} and found ${netPay.formattedValue}. Difference: ${formatCurrency(difference)}.`,
    metrics: {
      extractedLabel: "Extracted net pay",
      extractedValue: netPay.formattedValue,
      expectedLabel: expectationLabel,
      expectedValue: formatCurrency(expectedNetPay),
      differenceLabel: "Difference",
      differenceValue: formatCurrency(difference),
    },
  };
}

function buildPayeCheck(normalized: NormalizedPayslipData): PayslipCheckResult {
  const grossPay = getMoneyField(normalized, "grossPay");
  const paye = getMoneyField(normalized, "paye");

  if (!grossPay || !paye) {
    return {
      code: "paye",
      title: "PAYE reasonableness",
      severity: "warning",
      summary: "Skipped because gross pay or PAYE is missing.",
      detail:
        "Gross pay and PAYE are both required for the current MVP PAYE reasonableness check.",
    };
  }

  const effectiveRate = paye.value / grossPay.value;
  const differenceFromMidpoint = Math.abs(effectiveRate - 0.19);

  if (
    effectiveRate >= PAYE_WARNING_MIN_RATE &&
    effectiveRate <= PAYE_WARNING_MAX_RATE
  ) {
    return {
      code: "paye",
      title: "PAYE reasonableness",
      severity: "pass",
      summary: "PAYE sits inside the current MVP monthly reasonableness band.",
      detail: `The extracted PAYE implies an effective rate of ${formatPercentage(effectiveRate)} against gross pay. The current heuristic pass band is ${formatPercentage(PAYE_WARNING_MIN_RATE)} to ${formatPercentage(PAYE_WARNING_MAX_RATE)}.`,
      metrics: {
        extractedLabel: "Extracted PAYE",
        extractedValue: paye.formattedValue,
        expectedLabel: "Reasonable rate band",
        expectedValue: `${formatPercentage(PAYE_WARNING_MIN_RATE)} - ${formatPercentage(PAYE_WARNING_MAX_RATE)}`,
        differenceLabel: "Distance from mid band",
        differenceValue: formatPercentage(differenceFromMidpoint),
      },
    };
  }

  if (
    effectiveRate >= PAYE_FAIL_MIN_RATE &&
    effectiveRate <= PAYE_FAIL_MAX_RATE
  ) {
    return {
      code: "paye",
      title: "PAYE reasonableness",
      severity: "warning",
      summary: "PAYE is outside the preferred band but still plausible.",
      detail: `The extracted PAYE implies an effective rate of ${formatPercentage(effectiveRate)} against gross pay. The current heuristic warning band is outside ${formatPercentage(PAYE_WARNING_MIN_RATE)} to ${formatPercentage(PAYE_WARNING_MAX_RATE)} but inside ${formatPercentage(PAYE_FAIL_MIN_RATE)} to ${formatPercentage(PAYE_FAIL_MAX_RATE)}.`,
      metrics: {
        extractedLabel: "Extracted PAYE",
        extractedValue: paye.formattedValue,
        expectedLabel: "Reasonable rate band",
        expectedValue: `${formatPercentage(PAYE_WARNING_MIN_RATE)} - ${formatPercentage(PAYE_WARNING_MAX_RATE)}`,
        differenceLabel: "Effective PAYE rate",
        differenceValue: formatPercentage(effectiveRate),
      },
    };
  }

  return {
    code: "paye",
    title: "PAYE reasonableness",
    severity: "fail",
    summary: "PAYE is far outside the current monthly reasonableness range.",
    detail: `The extracted PAYE implies an effective rate of ${formatPercentage(effectiveRate)} against gross pay. That falls outside the broader heuristic band of ${formatPercentage(PAYE_FAIL_MIN_RATE)} to ${formatPercentage(PAYE_FAIL_MAX_RATE)}.`,
    metrics: {
      extractedLabel: "Extracted PAYE",
      extractedValue: paye.formattedValue,
      expectedLabel: "Broad heuristic band",
      expectedValue: `${formatPercentage(PAYE_FAIL_MIN_RATE)} - ${formatPercentage(PAYE_FAIL_MAX_RATE)}`,
      differenceLabel: "Effective PAYE rate",
      differenceValue: formatPercentage(effectiveRate),
    },
  };
}

function buildUifCheck(normalized: NormalizedPayslipData): PayslipCheckResult {
  const grossPay = getMoneyField(normalized, "grossPay");
  const uif = getMoneyField(normalized, "uif");

  if (!grossPay || !uif) {
    return {
      code: "uif",
      title: "UIF reasonableness",
      severity: "warning",
      summary: "Skipped because gross pay or UIF is missing.",
      detail:
        "Gross pay and UIF are both required for the current MVP UIF reasonableness check.",
    };
  }

  const expectedUif = Math.min(grossPay.value * UIF_RATE, UIF_MONTHLY_CAP);
  const difference = Math.abs(expectedUif - uif.value);

  if (difference <= UIF_TOLERANCE) {
    return {
      code: "uif",
      title: "UIF reasonableness",
      severity: "pass",
      summary: "UIF looks aligned with a simple 1% gross-pay rule.",
      detail: `Expected about ${formatCurrency(expectedUif)} and found ${uif.formattedValue}. Difference: ${formatCurrency(difference)}.`,
      metrics: {
        extractedLabel: "Extracted UIF",
        extractedValue: uif.formattedValue,
        expectedLabel: "Expected UIF",
        expectedValue: formatCurrency(expectedUif),
        differenceLabel: "Difference",
        differenceValue: formatCurrency(difference),
      },
    };
  }

  if (difference <= 25) {
    return {
      code: "uif",
      title: "UIF reasonableness",
      severity: "warning",
      summary: "UIF is in range but not a tight match.",
      detail: `Expected about ${formatCurrency(expectedUif)} and found ${uif.formattedValue}. Difference: ${formatCurrency(difference)}.`,
      metrics: {
        extractedLabel: "Extracted UIF",
        extractedValue: uif.formattedValue,
        expectedLabel: "Expected UIF",
        expectedValue: formatCurrency(expectedUif),
        differenceLabel: "Difference",
        differenceValue: formatCurrency(difference),
      },
    };
  }

  return {
    code: "uif",
    title: "UIF reasonableness",
    severity: "fail",
    summary: "UIF is not close to the current simple rule expectation.",
    detail: `Expected about ${formatCurrency(expectedUif)} and found ${uif.formattedValue}. Difference: ${formatCurrency(difference)}.`,
    metrics: {
      extractedLabel: "Extracted UIF",
      extractedValue: uif.formattedValue,
      expectedLabel: "Expected UIF",
      expectedValue: formatCurrency(expectedUif),
      differenceLabel: "Difference",
      differenceValue: formatCurrency(difference),
    },
  };
}

export function comparePayslip(normalized: NormalizedPayslipData): PayslipVerdict {
  const checks = [
    buildCompletenessCheck(normalized),
    buildPayeCheck(normalized),
    buildNetPayCheck(normalized),
    buildUifCheck(normalized),
  ];

  const overall = getOverallSeverity(checks);
  const notes = [
    "This MVP uses deterministic internal-consistency checks only.",
    "PAYE is currently checked with a broad effective-rate heuristic, not a full tax-table calculation.",
    "When a total deductions figure is present, net pay reconciliation uses it ahead of PAYE-plus-UIF-only matching.",
  ];
  const supplementarySummary = getSupplementarySummary(normalized);

  if (supplementarySummary) {
    notes.push(`Recognized other payroll lines: ${supplementarySummary}.`);
  }

  const summaryMap: Record<CheckSeverity, string> = {
    pass: "The extracted values look internally consistent for the current MVP checks.",
    warning:
      "The payslip produced a partial or borderline result and should be reviewed.",
    fail: "The payslip contains mismatches or missing data in the current MVP checks.",
  };

  return {
    overall,
    summary: summaryMap[overall],
    checks,
    notes,
  };
}
