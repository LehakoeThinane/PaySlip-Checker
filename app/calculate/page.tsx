import Link from "next/link";

const calculators = [
  {
    title: "Two-Pot Calculator",
    href: "/calculate/two-pot",
    description:
      "Estimate retirement split outcomes with a clearly stated assumption set and room for future policy updates.",
    badge: "Planned",
  },
  {
    title: "Net Pay Calculator",
    href: "/calculate/net-pay",
    description:
      "Turn earnings and deductions into an estimated take-home amount using a traceable rules flow.",
    badge: "Planned",
  },
  {
    title: "PAYE Calculator",
    href: "/calculate/paye",
    description:
      "Focus on tax estimation separately so the app does not overpromise inside the payslip checking workflow.",
    badge: "Planned",
  },
  {
    title: "Salary Breakdown Calculator",
    href: "/calculate/salary-breakdown",
    description:
      "Give users a way to explore how gross, deductions, and net pay relate before we add more advanced tools.",
    badge: "Planned",
  },
];

export default function CalculatePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">
            Calculate
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Estimation tools belong here, not inside document verification.
          </h1>
          <p className="text-base leading-7 text-slate-600">
            This module is where we add user-input calculators over time. It
            keeps rule-based estimation separate from the `Check` workflow,
            which protects clarity across the whole product.
          </p>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {calculators.map((calculator) => (
          <Link
            key={calculator.title}
            href={calculator.href}
            className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_55px_rgba(15,23,42,0.1)]"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-slate-950">
                  {calculator.title}
                </h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                  {calculator.badge}
                </span>
              </div>
              <p className="text-sm leading-7 text-slate-600">
                {calculator.description}
              </p>
              <span className="inline-flex text-sm font-semibold text-sky-700">
                Open placeholder
              </span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
