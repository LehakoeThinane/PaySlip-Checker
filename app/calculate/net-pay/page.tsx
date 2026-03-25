import Link from "next/link";

export default function NetPayPage() {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="max-w-3xl space-y-5">
        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-800">
          Net Pay Calculator
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          A focused place for take-home pay estimation.
        </h1>
        <p className="text-base leading-7 text-slate-600">
          This page will eventually turn payroll inputs into a traceable net pay
          estimate without relying on a payslip upload.
        </p>
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
