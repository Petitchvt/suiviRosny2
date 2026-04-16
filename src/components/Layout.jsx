import { Outlet, Link, useLocation } from "react-router-dom";
import { Trophy, Users, ShoppingCart, CreditCard } from "lucide-react";

const tabs = [
  { path: "/", label: "Podium", icon: Trophy },
  { path: "/cartes", label: "Cartes", icon: CreditCard },
  { path: "/operateurs", label: "Opérateurs", icon: Users },
  { path: "/ventes", label: "Ventes", icon: ShoppingCart },
];

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen" style={{background: "linear-gradient(135deg, #e8f0fe 0%, #f0f4ff 40%, #faf5ff 70%, #f0fdf4 100%)"}}>
      <nav className="sticky top-0 z-50 glass-nav">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-1 h-14">
          <span className="font-bold text-slate-800 mr-6 text-lg tracking-tight">🏆 Challenge</span>
          {tabs.map(({ path, label, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}