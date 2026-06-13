import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Sparkles, Lock, Users, Mic, Flame, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const links = [
  { to: "/app/assistant", label: "Guide", Icon: Sparkles },
  { to: "/app/vault", label: "Vault", Icon: Lock },
  { to: "/app/guardians", label: "Guardians", Icon: Users },
  { to: "/app/messages", label: "Messages", Icon: Mic },
];

export default function Shell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/70 backdrop-blur-md">
        <div className="mx-auto max-w-content px-6 h-16 flex items-center justify-between">
          <NavLink to="/app/assistant" className="flex items-center gap-2">
            <span className="grid place-items-center h-7 w-7 rounded-lg bg-ember/12 text-ember">
              <Flame size={16} strokeWidth={2.25} />
            </span>
            <span className="font-display text-lg tracking-tight">LastLogin</span>
          </NavLink>

          <nav className="flex items-center gap-1">
            {links.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
                <Icon size={16} strokeWidth={2} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 pl-2">
            <span className="hidden md:block text-sm text-graphite max-w-[10rem] truncate">{user?.name || user?.email}</span>
            <button onClick={() => { logout(); nav("/"); }}
              className="btn-ghost btn-sm" title="Sign out">
              <LogOut size={15} strokeWidth={2} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-content px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
}
