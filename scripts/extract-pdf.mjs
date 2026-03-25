import { readFile } from "node:fs/promises";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const filePath = process.argv[2];
const password = process.argv[3];
const PAGE_PREVIEW_LENGTH = 220;

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function getPagePreview(text) {
  return normalizeWhitespace(text).slice(0, PAGE_PREVIEW_LENGTH);
}

if (!filePath) {
  process.stderr.write(
    JSON.stringify({
      code: "INVALID_INPUT",
      message: "Missing PDF file path.",
    }),
  );
  process.exit(1);
}

try {
  const buffer = new Uint8Array(await readFile(filePath));
  const loadingTask = getDocument({
    data: buffer,
    password: password || undefined,
    useSystemFonts: true,
    isEvalSupported: false,
  });
  const pdf = await loadingTask.promise;
  const pageSummaries = [];
  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    const normalizedPageText = normalizeWhitespace(pageText);

    pageTexts.push(normalizedPageText);
    pageSummaries.push({
      pageNumber,
      preview: getPagePreview(normalizedPageText),
      characterCount: normalizedPageText.length,
    });
  }

  await pdf.destroy();

  process.stdout.write(
    JSON.stringify({
      pageCount: pdf.numPages,
      pageSummaries,
      joinedText: normalizeWhitespace(pageTexts.join(" ")),
    }),
  );
} catch (error) {
  const name = error?.name ?? "";
  const message = error?.message ?? "";
  const code = error?.code ?? "";

  if (name === "PasswordException") {
    process.stderr.write(
      JSON.stringify({
        code: code === 2 ? "INCORRECT_PASSWORD" : "PASSWORD_REQUIRED",
        name,
        message,
      }),
    );
    process.exit(2);
  }

  process.stderr.write(
    JSON.stringify({
      code: "EXTRACTION_FAILED",
      name,
      message,
      pdfCode: code,
    }),
  );
  process.exit(1);
}
