import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { comparePayslip } from "./compare";
import { PasswordProtectedPdfError } from "./errors";
import { normalizePayslipFields } from "./normalize";
import type { ExtractedPayslipPayload, ExtractionPageSummary } from "./types";

const execFileAsync = promisify(execFile);
const MINIMUM_TEXT_CHARACTERS = 40;
const PREVIEW_LENGTH = 800;
const extractorScriptPath = path.join(
  process.cwd(),
  "scripts",
  "extract-pdf.mjs",
);

type RawExtractionResult = {
  pageCount: number;
  pageSummaries: ExtractionPageSummary[];
  joinedText: string;
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

async function runPdfExtractionScript(
  fileBuffer: Uint8Array,
  password?: string,
) {
  const tempFilePath = path.join(os.tmpdir(), `payslip-${randomUUID()}.pdf`);

  await writeFile(tempFilePath, fileBuffer);

  try {
    const args = [extractorScriptPath, tempFilePath];

    if (password) {
      args.push(password);
    }

    const { stdout } = await execFileAsync(process.execPath, args);

    return JSON.parse(stdout) as RawExtractionResult;
  } catch (error) {
    const stderr =
      error &&
      typeof error === "object" &&
      "stderr" in error &&
      typeof error.stderr === "string"
        ? error.stderr
        : "";

    let parsedError: { code?: string } | null = null;

    if (stderr) {
      try {
        parsedError = JSON.parse(stderr) as { code?: string };
      } catch {
        parsedError = null;
      }
    }

    if (
      parsedError?.code === "PASSWORD_REQUIRED" ||
      parsedError?.code === "INCORRECT_PASSWORD"
    ) {
      throw new PasswordProtectedPdfError(parsedError.code);
    }

    throw error;
  } finally {
    await unlink(tempFilePath).catch(() => undefined);
  }
}

export async function extractPayslipText(
  fileBuffer: Uint8Array,
  fileName: string,
  fileSize: number,
  password?: string,
): Promise<ExtractedPayslipPayload> {
  const extraction = await runPdfExtractionScript(fileBuffer, password);
  const joinedText = normalizeWhitespace(extraction.joinedText);
  const normalized = normalizePayslipFields(joinedText);
  const verdict = comparePayslip(normalized);
  const notes = [
    "Processed in memory with a temporary local extraction worker and auto-deleted after completion.",
    "Text extraction works on text-based PDFs in this MVP.",
  ];

  const status = joinedText.length >= MINIMUM_TEXT_CHARACTERS
    ? "supported"
    : "unsupported";

  if (status === "unsupported") {
    notes.push(
      "The PDF appears to contain too little embedded text, which usually means it is scanned or image-based.",
    );
  } else {
    notes.push(
      "The extracted text can now feed the field-normalization and validation stages.",
    );
  }

  return {
    status,
    fileName,
    fileSize,
    pageCount: extraction.pageCount,
    extractedCharacterCount: joinedText.length,
    previewText: joinedText.slice(0, PREVIEW_LENGTH),
    pageSummaries: extraction.pageSummaries,
    notes,
    normalized,
    verdict,
  };
}
