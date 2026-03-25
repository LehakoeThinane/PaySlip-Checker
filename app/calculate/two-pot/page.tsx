import Link from "next/link";

export default function TwoPotPage() {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="max-w-3xl space-y-5">
        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">
          Two-Pot Calculator
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          A dedicated calculator page for retirement split estimates.
        </h1>
        <p className="text-base leading-7 text-slate-600">
          We are treating Two-Pot as its own calculation workflow, which keeps
          policy assumptions and explanatory copy out of the payslip-checking
          engine.
        </p>
        <div className="rounded-[1.5rem] bg-slate-50 p-5 text-sm leading-7 text-slate-600">
          Initial implementation notes:
          <br />
          Capture user inputs explicitly.
          <br />
          Show assumptions clearly.
          <br />
          Keep the logic versioned and traceable as rules evolve.
        </div>
        <Link
          href="/calculate"
          className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
        >
          Back to Calculate
        </Link>
      </div>
    </section>
  );
}
