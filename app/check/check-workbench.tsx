"use client";

import { useRef, useState } from "react";

import type { ExtractedPayslipResponse, PayslipCheckResult } from "@/lib/check/types";

const MAX_FILE_SIZE_MB = 5;

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getFieldBadgeClass(fieldCount: number) {
  if (fieldCount >= 4) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (fieldCount >= 2) {
    return "bg-amber-100 text-amber-900";
  }

  return "bg-rose-100 text-rose-800";
}

function getSeverityBadgeClass(severity: "pass" | "warning" | "fail") {
  if (severity === "pass") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (severity === "warning") {
    return "bg-amber-100 text-amber-900";
  }

  return "bg-rose-100 text-rose-800";
}

function getSeverityPanelClass(severity: "pass" | "warning" | "fail") {
  if (severity === "pass") {
    return "border-emerald-200 bg-[linear-gradient(135deg,#ecfdf3,#f7fee7)]";
  }

  if (severity === "warning") {
    return "border-amber-200 bg-[linear-gradient(135deg,#fff7ed,#fef3c7)]";
  }

  return "border-rose-200 bg-[linear-gradient(135deg,#fff1f2,#ffe4e6)]";
}

function getErrorBadgeLabel(
  code:
    | "INVALID_FILE"
    | "FILE_TOO_LARGE"
    | "UNSUPPORTED_TYPE"
    | "PASSWORD_REQUIRED"
    | "INCORRECT_PASSWORD"
    | "EXTRACTION_FAILED",
) {
  if (code === "PASSWORD_REQUIRED" || code === "INCORRECT_PASSWORD") {
    return "Password protected";
  }

  return "Extraction failed";
}

function getCheckByCode(
  checks: PayslipCheckResult[],
  code: PayslipCheckResult["code"],
) {
  return checks.find((check) => check.code === code);
}

export function CheckWorkbench() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<ExtractedPayslipResponse | null>(
    null,
  );

  const handleFileChange = (nextFile: File | null) => {
    setFile(nextFile);
    setPassword("");
    setResponse(null);
  };

  const submitFile = async () => {
    if (!file) {
      setResponse({
        ok: false,
        code: "INVALID_FILE",
        error: "Choose a PDF payslip before running the extraction step.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    if (password.trim()) {
      formData.append("password", password);
    }

    setIsSubmitting(true);

    try {
      const result = await fetch("/api/check/extract", {
        method: "POST",
        body: formData,
      });
      const payload = (await result.json()) as ExtractedPayslipResponse;
      setResponse(payload);
    } catch {
      setResponse({
        ok: false,
        code: "EXTRACTION_FAILED",
        error:
          "The request did not complete. Check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPassword("");
    setResponse(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">
              Upload a payslip PDF
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              This first MVP step checks whether a single monthly PDF contains
              extractable text. It does not store the raw file and it does not
              attempt OCR.
            </p>
          </div>

          <label className="block rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-slate-400 hover:bg-slate-100">
            <span className="block text-sm font-semibold text-slate-900">
              Supported upload
            </span>
            <span className="mt-2 block text-sm leading-7 text-slate-600">
              One text-based `.pdf` payslip, up to {MAX_FILE_SIZE_MB} MB.
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="mt-4 block w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
              onChange={(event) =>
                handleFileChange(event.target.files?.[0] ?? null)
              }
            />
          </label>

          <div className="rounded-[1.5rem] bg-slate-950 p-5 text-sm leading-7 text-slate-300">
            <p className="font-semibold text-white">Before you upload</p>
            <p className="mt-2">
              We are supporting exported text PDFs only in this phase. Scanned
              payslips will be flagged as unsupported rather than guessed.
            </p>
          </div>

          {(response?.ok === false &&
            (response.code === "PASSWORD_REQUIRED" ||
              response.code === "INCORRECT_PASSWORD")) ||
          password ? (
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
              <label className="block">
                <span className="block text-sm font-semibold text-slate-900">
                  PDF password
                </span>
                <span className="mt-2 block text-sm leading-7 text-slate-600">
                  Enter the password for this payslip, then run extraction
                  again.
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="Enter PDF password"
                />
              </label>
            </div>
          ) : null}

          {file ? (
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm leading-7 text-emerald-900">
              <p className="font-semibold">{file.name}</p>
              <p>{formatFileSize(file.size)}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={submitFile}
              disabled={isSubmitting}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? "Extracting text..." : "Run extraction"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={isSubmitting && !file}
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        {!response ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-950">
              Extraction result
            </h2>
            <p className="text-sm leading-7 text-slate-600">
              After upload, this panel will show whether the PDF is supported,
              how much text was found, and a short preview of the extracted
              content for the next normalization step.
            </p>
          </div>
        ) : null}

        {response && !response.ok ? (
          <div className="space-y-4">
            <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-rose-800">
              {getErrorBadgeLabel(response.code)}
            </span>
            <h2 className="text-2xl font-semibold text-slate-950">
              {response.code === "PASSWORD_REQUIRED" ||
              response.code === "INCORRECT_PASSWORD"
                ? "This PDF needs a password."
                : "We could not process that file."}
            </h2>
            <p className="text-sm leading-7 text-slate-600">{response.error}</p>
            {response.code === "PASSWORD_REQUIRED" ||
            response.code === "INCORRECT_PASSWORD" ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                Enter the PDF password on the left and run extraction again.
              </div>
            ) : null}
          </div>
        ) : null}

        {response?.ok ? (
          <div className="space-y-6">
            {(() => {
              const payeCheck = getCheckByCode(response.data.verdict.checks, "paye");
              const uifCheck = getCheckByCode(response.data.verdict.checks, "uif");
              const netPayCheck = getCheckByCode(
                response.data.verdict.checks,
                "net-pay",
              );

              const summaryChecks = [payeCheck, uifCheck, netPayCheck].filter(
                (check): check is PayslipCheckResult => Boolean(check),
              );

              return (
                <>
            <div className="space-y-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${
                  response.data.status === "supported"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {response.data.status === "supported"
                  ? "Supported text PDF"
                  : "Unsupported for MVP"}
              </span>
              <h2 className="text-2xl font-semibold text-slate-950">
                {response.data.fileName}
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    File size
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatFileSize(response.data.fileSize)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Pages
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {response.data.pageCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Text chars
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {response.data.extractedCharacterCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div
                className={`rounded-[1.75rem] border p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)] ${getSeverityPanelClass(
                  response.data.verdict.overall,
                )}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
                      Overall verdict
                    </p>
                    <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
                      {response.data.verdict.summary}
                    </h3>
                    <p className="text-sm leading-7 text-slate-700">
                      This top result combines completeness, PAYE reasonableness,
                      UIF reasonableness, and net pay reconciliation into one
                      clear outcome.
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] ${getSeverityBadgeClass(
                      response.data.verdict.overall,
                    )}`}
                  >
                    {response.data.verdict.overall}
                  </span>
                </div>
              </div>
            </div>

            {summaryChecks.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-950">
                    Quick scan
                  </h3>
                  <p className="text-sm text-slate-600">
                    PAYE, UIF, and net pay at a glance
                  </p>
                </div>
                <div className="grid gap-3 xl:grid-cols-3">
                  {summaryChecks.map((check) => (
                    <div
                      key={`summary-${check.code}`}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-slate-950">
                          {check.title}
                        </h4>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${getSeverityBadgeClass(
                            check.severity,
                          )}`}
                        >
                          {check.severity}
                        </span>
                      </div>
                      {check.metrics ? (
                        <div className="mt-4 grid gap-3">
                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Extracted
                            </p>
                            <p className="mt-1 text-base font-semibold text-slate-950">
                              {check.metrics.extractedValue}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Expected
                            </p>
                            <p className="mt-1 text-base font-semibold text-slate-950">
                              {check.metrics.expectedValue}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Difference
                            </p>
                            <p className="mt-1 text-base font-semibold text-slate-950">
                              {check.metrics.differenceValue}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm leading-7 text-slate-600">
                          {check.summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-950">
                  Detailed checks
                </h3>
                <p className="text-sm text-slate-600">
                  Full explanations for each deterministic rule
                </p>
              </div>
              <div className="space-y-3">
                {response.data.verdict.checks.map((check) => (
                  <div
                    key={check.code}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-slate-950">
                        {check.title}
                      </h4>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${getSeverityBadgeClass(
                          check.severity,
                        )}`}
                      >
                        {check.severity}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      {check.summary}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {check.detail}
                    </p>
                    {check.metrics ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {check.metrics.extractedLabel}
                          </p>
                          <p className="mt-2 text-base font-semibold text-slate-950">
                            {check.metrics.extractedValue}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {check.metrics.expectedLabel}
                          </p>
                          <p className="mt-2 text-base font-semibold text-slate-950">
                            {check.metrics.expectedValue}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {check.metrics.differenceLabel}
                          </p>
                          <p className="mt-2 text-base font-semibold text-slate-950">
                            {check.metrics.differenceValue}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
                </>
              );
            })()}

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-950">
                Check notes
              </h3>
              <ul className="space-y-2 text-sm leading-7 text-slate-600">
                {response.data.verdict.notes.map((note) => (
                  <li
                    key={note}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-950">
                  Normalized fields
                </h3>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${getFieldBadgeClass(
                    response.data.normalized.foundFields.length,
                  )}`}
                >
                  {response.data.normalized.foundFields.length}/5 fields found
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {response.data.normalized.foundFields.map((field) => (
                  <div
                    key={field.field}
                    className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-emerald-950">
                        {field.label}
                      </p>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        Found
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-slate-950">
                      {"formattedValue" in field ? field.formattedValue : field.value}
                    </p>
                    <p className="mt-2 text-xs leading-6 text-slate-600">
                      Source: {field.sourceText}
                    </p>
                  </div>
                ))}
                {response.data.normalized.missingFields.map((field) => (
                  <div
                    key={field.field}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {field.label}
                      </p>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Missing
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      No deterministic match was found in the extracted text.
                    </p>
                  </div>
                ))}
                {response.data.normalized.supplementaryFields.map((field) => (
                  <div
                    key={field.field}
                    className="rounded-[1.5rem] border border-sky-200 bg-sky-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-sky-950">
                        {field.label}
                      </p>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                        Supplementary
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-slate-950">
                      {field.formattedValue}
                    </p>
                    <p className="mt-2 text-xs leading-6 text-slate-600">
                      Source: {field.sourceText}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-950">
                Normalization notes
              </h3>
              <ul className="space-y-2 text-sm leading-7 text-slate-600">
                {response.data.normalized.notes.map((note) => (
                  <li
                    key={note}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-950">Notes</h3>
              <ul className="space-y-2 text-sm leading-7 text-slate-600">
                {response.data.notes.map((note) => (
                  <li
                    key={note}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-950">
                Extracted text preview
              </h3>
              <div className="rounded-[1.5rem] bg-slate-950 p-5 text-sm leading-7 text-slate-200">
                {response.data.previewText ? (
                  <p>{response.data.previewText}</p>
                ) : (
                  <p>No embedded text preview was found.</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-950">
                Page summaries
              </h3>
              <div className="space-y-3">
                {response.data.pageSummaries.map((page) => (
                  <div
                    key={page.pageNumber}
                    className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        Page {page.pageNumber}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {page.characterCount} chars
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {page.preview || "No text was extracted from this page."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
