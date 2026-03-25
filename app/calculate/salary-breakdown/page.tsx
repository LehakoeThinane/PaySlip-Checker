import Link from "next/link";

export default function SalaryBreakdownPage() {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="max-w-3xl space-y-5">
        <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-violet-800">
          Salary Breakdown
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          A calculator for understanding the shape of a salary.
        </h1>
        <p className="text-base leading-7 text-slate-600">
          This placeholder marks where we can later explain the relationship
          between gross pay, deductions, and final take-home outcomes.
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
