import { CheckWorkbench } from "./check-workbench";

export default function CheckPage() {
  const steps = [
    "Upload one supported monthly text-based PDF payslip",
    "Extract text and normalize payroll fields",
    "Compare extracted values against deterministic rules",
    "Return pass, warning, or fail with plain-language notes",
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-rose-800">
            Check
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            The main MVP feature for supported payslip verification.
          </h1>
          <p className="text-base leading-7 text-slate-600">
            This module will handle text-based PDF uploads and run a transparent
            consistency check. We are intentionally keeping it narrow so the
            first version is predictable, testable, and trustworthy.
          </p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold text-slate-950">
            Planned MVP flow
          </h2>
          <ol className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            {steps.map((step, index) => (
              <li
                key={step}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <aside className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-semibold tracking-tight">
            Explicitly outside MVP
          </h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
            <li className="rounded-2xl bg-white/5 px-4 py-3">
              Scanned image payslips and OCR
            </li>
            <li className="rounded-2xl bg-white/5 px-4 py-3">
              Complex fringe benefits and pension edge cases
            </li>
            <li className="rounded-2xl bg-white/5 px-4 py-3">
              AI-driven fraud detection claims
            </li>
            <li className="rounded-2xl bg-white/5 px-4 py-3">
              Employer-specific advanced payroll logic
            </li>
          </ul>
        </aside>
      </section>

      <CheckWorkbench />
    </div>
  );
}
