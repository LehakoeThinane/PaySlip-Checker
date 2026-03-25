import Link from "next/link";

const modules = [
  {
    title: "Check",
    href: "/check",
    description:
      "Upload a supported payslip and verify whether the extracted values are internally consistent.",
    status: "Core MVP",
  },
  {
    title: "Calculate",
    href: "/calculate",
    description:
      "Explore payroll calculators like Two-Pot, PAYE, net pay, and salary breakdowns from user inputs.",
    status: "Product module",
  },
];

const highlights = [
  "One app shell with room for both verification and calculators",
  "Deterministic rules first, AI later if it earns its place",
  "Clear product split between uploaded documents and user-entered estimates",
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-[2rem] border border-white/50 bg-[linear-gradient(135deg,rgba(10,31,68,0.98),rgba(14,72,118,0.96)_52%,rgba(240,165,0,0.88))] p-8 text-white shadow-[0_30px_80px_rgba(5,17,34,0.18)] sm:p-10">
        <div className="max-w-3xl space-y-6">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
            Payroll Confidence Workspace
          </span>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Build the product around two jobs: calculate and check.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/82 sm:text-lg">
              We are starting with a clean foundation so the app can support
              document verification without becoming trapped inside a single
              upload flow.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/check"
              className="rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Open Check
            </Link>
            <Link
              href="/calculate"
              className="rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Open Calculate
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-5 sm:grid-cols-2">
          {modules.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_55px_rgba(15,23,42,0.12)]"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold text-slate-950">
                    {module.title}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    {module.status}
                  </span>
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  {module.description}
                </p>
                <span className="inline-flex items-center text-sm font-semibold text-sky-700 transition group-hover:text-sky-800">
                  Explore module
                </span>
              </div>
            </Link>
          ))}
        </div>

        <aside className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,0.1)]">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Why this shape works
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Keep verification and estimation separate from day one.
              </h2>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-slate-300">
              {highlights.map((item) => (
                <li key={item} className="rounded-2xl bg-white/5 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
