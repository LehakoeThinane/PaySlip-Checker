export type ExtractionStatus = "supported" | "unsupported";
export type NormalizedFieldStatus = "found" | "missing";
export type CheckSeverity = "pass" | "warning" | "fail";

export type NormalizedPayslipField =
  | "grossPay"
  | "paye"
  | "uif"
  | "netPay"
  | "payPeriod";

export type SupplementaryPayslipField =
  | "totalDeductions"
  | "pension"
  | "medicalAid"
  | "bonus";

export type ExtractionPageSummary = {
  pageNumber: number;
  preview: string;
  characterCount: number;
};

export type NormalizedMoneyField = {
  field: Exclude<NormalizedPayslipField, "payPeriod"> | SupplementaryPayslipField;
  label: string;
  value: number;
  formattedValue: string;
  sourceText: string;
  status: NormalizedFieldStatus;
};

export type NormalizedTextField = {
  field: "payPeriod";
  label: string;
  value: string;
  sourceText: string;
  status: NormalizedFieldStatus;
};

export type MissingNormalizedField = {
  field: NormalizedPayslipField;
  label: string;
  status: "missing";
};

export type NormalizedPayslipData = {
  foundFields: Array<NormalizedMoneyField | NormalizedTextField>;
  missingFields: MissingNormalizedField[];
  supplementaryFields: NormalizedMoneyField[];
  notes: string[];
};

export type PayslipCheckResult = {
  code: "completeness" | "paye" | "net-pay" | "uif";
  title: string;
  severity: CheckSeverity;
  summary: string;
  detail: string;
  metrics?: {
    extractedLabel: string;
    extractedValue: string;
    expectedLabel: string;
    expectedValue: string;
    differenceLabel: string;
    differenceValue: string;
  };
};

export type PayslipVerdict = {
  overall: CheckSeverity;
  summary: string;
  checks: PayslipCheckResult[];
  notes: string[];
};

export type ExtractedPayslipPayload = {
  status: ExtractionStatus;
  fileName: string;
  fileSize: number;
  pageCount: number;
  extractedCharacterCount: number;
  previewText: string;
  pageSummaries: ExtractionPageSummary[];
  notes: string[];
  normalized: NormalizedPayslipData;
  verdict: PayslipVerdict;
};

export type ExtractedPayslipResponse =
  | {
      ok: true;
      data: ExtractedPayslipPayload;
    }
  | {
      ok: false;
      error: string;
      code:
        | "INVALID_FILE"
        | "FILE_TOO_LARGE"
        | "UNSUPPORTED_TYPE"
        | "PASSWORD_REQUIRED"
        | "INCORRECT_PASSWORD"
        | "EXTRACTION_FAILED";
      debug?: {
        name: string;
        message: string;
        code: string;
      };
    };
