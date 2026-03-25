import { NextResponse } from "next/server";

import { PasswordProtectedPdfError } from "@/lib/check/errors";
import { extractPayslipText } from "@/lib/check/pdf";
import type { ExtractedPayslipResponse } from "@/lib/check/types";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const runtime = "nodejs";

function isPasswordProtectedError(error: unknown) {
  const errorName =
    error && typeof error === "object" && "name" in error
      ? String(error.name)
      : "";
  const errorMessage =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "";
  const errorCode =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";

  return (
    error instanceof PasswordProtectedPdfError ||
    errorName === "PasswordProtectedPdfError" ||
    errorName === "PasswordException" ||
    errorCode === "PASSWORD_REQUIRED" ||
    errorCode === "INCORRECT_PASSWORD" ||
    errorMessage.toLowerCase().includes("password")
  );
}

function jsonResponse(
  body: ExtractedPayslipResponse,
  init?: ResponseInit,
) {
  return NextResponse.json(body, init);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const uploadedFile = formData.get("file");
    const passwordValue = formData.get("password");

    if (!(uploadedFile instanceof File)) {
      return jsonResponse(
        {
          ok: false,
          code: "INVALID_FILE",
          error: "Upload a PDF payslip before running the check.",
        },
        { status: 400 },
      );
    }

    const isPdfFile =
      uploadedFile.type === "application/pdf" ||
      uploadedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdfFile) {
      return jsonResponse(
        {
          ok: false,
          code: "UNSUPPORTED_TYPE",
          error: "Only PDF files are supported in this MVP.",
        },
        { status: 415 },
      );
    }

    if (uploadedFile.size > MAX_FILE_SIZE_BYTES) {
      return jsonResponse(
        {
          ok: false,
          code: "FILE_TOO_LARGE",
          error: "The file is too large. Upload a PDF smaller than 5 MB.",
        },
        { status: 413 },
      );
    }

    const arrayBuffer = await uploadedFile.arrayBuffer();
    const extraction = await extractPayslipText(
      new Uint8Array(arrayBuffer),
      uploadedFile.name,
      uploadedFile.size,
      typeof passwordValue === "string" ? passwordValue : undefined,
    );

    return jsonResponse({
      ok: true,
      data: extraction,
    });
  } catch (error) {
    if (isPasswordProtectedError(error)) {
      const passwordErrorCode =
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error.code === "PASSWORD_REQUIRED" ||
          error.code === "INCORRECT_PASSWORD")
          ? error.code
          : "PASSWORD_REQUIRED";

      return jsonResponse(
        {
          ok: false,
          code: passwordErrorCode,
          error:
            passwordErrorCode === "INCORRECT_PASSWORD"
              ? "That password was not accepted for this PDF. Check it and try again."
              : "This PDF is password-protected. Enter the password to continue.",
        },
        { status: 422 },
      );
    }

    const debug =
      process.env.NODE_ENV !== "production"
        ? {
            name:
              error && typeof error === "object" && "name" in error
                ? String(error.name)
                : "",
            message:
              error && typeof error === "object" && "message" in error
                ? String(error.message)
                : "",
            code:
              error && typeof error === "object" && "code" in error
                ? String(error.code)
                : "",
          }
        : undefined;

    return jsonResponse(
      {
        ok: false,
        code: "EXTRACTION_FAILED",
        error:
          "We could not extract text from that PDF. Try a clean text-based payslip export.",
        debug,
      },
      { status: 500 },
    );
  }
}
