import type {
  MissingNormalizedField,
  NormalizedMoneyField,
  NormalizedPayslipData,
  NormalizedPayslipField,
  NormalizedTextField,
} from "./types";

type MoneyFieldDefinition = {
  field: Exclude<NormalizedPayslipField, "payPeriod">;
  label: string;
  patterns: RegExp[];
};

type SupplementaryMoneyFieldDefinition = {
  field: "totalDeductions";
  label: string;
  patterns: RegExp[];
};

const moneyFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const moneyFieldDefinitions: MoneyFieldDefinition[] = [
  {
    field: "grossPay",
    label: "Gross pay",
    patterns: [
      /(?:gross\s+(?:pay|salary)|total\s+earnings|earnings)\s*[:\-]?\s*(?:r\s*)?(-?\d[\d,\s]*\.?\d{0,2})/i,
    ],
  },
  {
    field: "paye",
    label: "PAYE",
    patterns: [
      /(?:pay\s+as\s+you\s+earn|paye|paye\s+tax|employees?\s+tax|employee'?s\s+tax|income\s+tax|tax)\s*[:\-]?\s*(?:r\s*)?(-?\d[\d,\s]*\.?\d{0,2})/i,
    ],
  },
  {
    field: "uif",
    label: "UIF",
    patterns: [
      /(?:uif|unemployment\s+insurance\s+fund)\s*[:\-]?\s*(?:r\s*)?(-?\d[\d,\s]*\.?\d{0,2})/i,
    ],
  },
  {
    field: "netPay",
    label: "Net pay",
    patterns: [
      /(?:net\s+(?:pay|salary)|take[\s-]?home(?:\s+pay)?)\s*[:\-]?\s*(?:r\s*)?(-?\d[\d,\s]*\.?\d{0,2})/i,
    ],
  },
];

const supplementaryMoneyFieldDefinitions: SupplementaryMoneyFieldDefinition[] = [
  {
    field: "totalDeductions",
    label: "Total deductions",
    patterns: [
      /(?:total\s+deductions|deductions\s+total)\s*[:\-]?\s*(?:r\s*)?(-?\d[\d,\s]*\.?\d{0,2})/i,
    ],
  },
];

const payPeriodPatterns = [
  /(?:pay\s+period|period)\s*[:\-]?\s*([a-z]{3,9}\s+\d{4}\s*(?:-|to)\s*[a-z]{3,9}\s+\d{4})/i,
  /(?:pay\s+period|period)\s*[:\-]?\s*([a-z]{3,9}\s+\d{4})/i,
  /(?:pay\s+period|period)\s*[:\-]?\s*(\d{4}[\/-]\d{1,2}[\/-]\d{1,2}\s*(?:-|to)\s*\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
  /(?:pay\s+period|period)\s*[:\-]?\s*(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
  /(?:pay\s+period|period)\s*[:\-]?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\s*(?:-|to)\s*\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
  /(?:pay\s+period|period)\s*[:\-]?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
];

function parseMoney(value: string) {
  const normalized = value.replace(/[,\s]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchMoneyField(
  text: string,
  definition: MoneyFieldDefinition | SupplementaryMoneyFieldDefinition,
): NormalizedMoneyField | null {
  for (const pattern of definition.patterns) {
    const match = text.match(pattern);

    if (!match) {
      continue;
    }

    const value = parseMoney(match[1] ?? "");

    if (value === null) {
      continue;
    }

    return {
      field: definition.field,
      label: definition.label,
      value,
      formattedValue: moneyFormatter.format(value),
      sourceText: match[0].trim(),
      status: "found",
    };
  }

  return null;
}

function matchPayPeriod(text: string): NormalizedTextField | null {
  for (const pattern of payPeriodPatterns) {
    const match = text.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    return {
      field: "payPeriod",
      label: "Pay period",
      value: match[1].trim(),
      sourceText: match[0].trim(),
      status: "found",
    };
  }

  return null;
}

export function normalizePayslipFields(text: string): NormalizedPayslipData {
  const foundFields: Array<NormalizedMoneyField | NormalizedTextField> = [];
  const missingFields: MissingNormalizedField[] = [];
  const supplementaryFields: NormalizedMoneyField[] = [];
  const notes: string[] = [];

  for (const definition of moneyFieldDefinitions) {
    const matchedField = matchMoneyField(text, definition);

    if (matchedField) {
      foundFields.push(matchedField);
    } else {
      missingFields.push({
        field: definition.field,
        label: definition.label,
        status: "missing",
      });
    }
  }

  const payPeriod = matchPayPeriod(text);

  if (payPeriod) {
    foundFields.push(payPeriod);
  } else {
    missingFields.push({
      field: "payPeriod",
      label: "Pay period",
      status: "missing",
    });
  }

  for (const definition of supplementaryMoneyFieldDefinitions) {
    const matchedField = matchMoneyField(text, definition);

    if (matchedField) {
      supplementaryFields.push(matchedField);
    }
  }

  if (foundFields.length > 0) {
    notes.push(
      `Matched ${foundFields.length} of 5 core MVP fields using deterministic label rules.`,
    );
  } else {
    notes.push("No core MVP fields were matched from the extracted text.");
  }

  if (missingFields.length > 0) {
    notes.push(
      `Missing fields: ${missingFields.map((field) => field.label).join(", ")}.`,
    );
  }

  if (supplementaryFields.length > 0) {
    notes.push(
      `Also found supplementary fields: ${supplementaryFields.map((field) => field.label).join(", ")}.`,
    );
  }

  notes.push(
    "Field matching is currently label-based, so unusual payslip wording may need additional aliases.",
  );

  return {
    foundFields,
    missingFields,
    supplementaryFields,
    notes,
  };
}
