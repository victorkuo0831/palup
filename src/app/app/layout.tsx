"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/app", label: "Home" },
  { href: "/app/deals", label: "Deals" },
  { href: "/app/activity", label: "Activity" },
  { href: "/app/settings", label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* ─── Top Navigation Bar ─────────────────────────── */}
      <header className="glass fixed top-0 left-0 right-0 z-30 border-b border-white/[0.06]">
        <div className="mx-auto flex h-14 max-w-[1000px] items-center justify-between px-6">
          {/* Left: Logo + tagline */}
          <div className="flex items-center gap-3">
            <div className="relative h-7 w-7 rounded-[8px] bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <div className="absolute inset-0 rounded-[8px] bg-gradient-to-br from-white/20 to-transparent" />
            </div>
            <span className="text-[14px] font-semibold tracking-tight text-white">PalUp</span>
            <span className="hidden sm:inline text-[12px] text-zinc-500 pl-1">Your AI Sales Team</span>
          </div>

          {/* Center: Nav links */}
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/app"
                  ? pathname === "/app"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Company badge + avatar */}
          <div className="flex items-center gap-3">
            <span className="badge bg-white/[0.06] text-zinc-300 text-[11px]">CloudSync</span>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[11px] font-semibold text-white shadow-lg shadow-emerald-500/10 cursor-pointer">
              CS
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ───────────────────────────────── */}
      <main className="pt-14">
        <div className="mx-auto max-w-[1000px] px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
