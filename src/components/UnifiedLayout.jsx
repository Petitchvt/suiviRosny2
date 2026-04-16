import { Home, LineChart, ShieldAlert, Target, Trophy } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const appTabs = [
  { to: "/", label: "Accueil", icon: Home, exact: true },
  { to: "/challenge", label: "Challenge", icon: Trophy },
  { to: "/laboratoires", label: "Labos", icon: LineChart },
  { to: "/tg", label: "TG", icon: Target },
  { to: "/vigilance", label: "Vigilance", icon: ShieldAlert },
];

function isTabActive(pathname, to, exact) {
  if (exact) {
    return pathname === to;
  }

  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function UnifiedLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Gestion unifiée
            </p>
            <h1 className="text-xl font-semibold text-slate-900">
              Rosny pilotage commerce
            </h1>
          </div>
          <div className="hidden rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm md:block">
            Web unique aujourd&apos;hui, base prête pour iPhone ensuite
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4 sm:px-6">
          {appTabs.map(({ to, label, icon: Icon, exact }) => {
            const active = isTabActive(pathname, to, exact);
            return (
              <NavLink
                key={to}
                to={to}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                    : "bg-white/70 text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

export function ModuleLayout({ badge, title, description, tabs }) {
  const { pathname } = useLocation();

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl sm:p-8">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(circle at top left, rgba(14,165,233,0.16), transparent 34%), radial-gradient(circle at right, rgba(249,115,22,0.14), transparent 28%)",
          }}
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {badge}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab.to, false);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? "bg-sky-600 text-white shadow-lg shadow-sky-600/20"
                  : "bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              {tab.label}
            </NavLink>
          );
        })}
      </div>

      <div className="rounded-[28px] border border-white/70 bg-white/55 p-2 shadow-lg shadow-slate-200/50 backdrop-blur-sm sm:p-4">
        <Outlet />
      </div>
    </div>
  );
}
