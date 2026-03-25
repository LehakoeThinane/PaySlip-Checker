export class PasswordProtectedPdfError extends Error {
  code: string;

  constructor(code: "PASSWORD_REQUIRED" | "INCORRECT_PASSWORD") {
    super(
      code === "PASSWORD_REQUIRED"
        ? "This PDF is password-protected and needs a password before it can be processed."
        : "The password supplied for this PDF is incorrect.",
    );
    this.name = "PasswordProtectedPdfError";
    this.code = code;
  }
}
