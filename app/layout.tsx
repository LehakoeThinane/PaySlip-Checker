import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PaySlip Checker",
  description:
    "A payroll workspace built around calculation tools and payslip checking.",
};

const navigation = [
  { href: "/", label: "Dashboard" },
  { href: "/calculate", label: "Calculate" },
  { href: "/check", label: "Check" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(13,110,145,0.16),transparent_34%),linear-gradient(180deg,#f6f7ef_0%,#f4efe4_100%)]">
          <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-6 lg:px-8">
            <header className="rounded-[1.75rem] border border-white/60 bg-white/75 px-5 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <Link
                    href="/"
                    className="text-lg font-semibold tracking-tight text-slate-950"
                  >
                    PaySlip Checker
                  </Link>
                  <p className="text-sm text-slate-600">
                    A clean workspace for payroll calculations and document
                    checks.
                  </p>
                </div>
                <nav className="flex flex-wrap gap-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </header>

            <main className="flex-1 py-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
