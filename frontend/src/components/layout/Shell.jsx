import { NavLink, Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Sparkles, Lock, Users, Mic, Flame, LogOut, Mail, ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import ThemeToggle from "../ui/ThemeToggle.jsx";

const links = [
  { to: "/app/assistant", label: "Guide", Icon: Sparkles },
  { to: "/app/vault", label: "Vault", Icon: Lock },
  { to: "/app/guardians", label: "Guardians", Icon: Users },
  { to: "/app/messages", label: "Messages", Icon: Mic },
  { to: "/app/companion", label: "Companion", Icon: MessageCircle },
  { to: "/app/executor", label: "Closures", Icon: Mail },
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
            <ThemeToggle />
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
      <StepNav />
    </div>
  );
}

// Previous / Next through the setup sequence — so you can always move back or forward.
function StepNav() {
  const { pathname } = useLocation();
  const i = links.findIndex((l) => pathname.startsWith(l.to));
  if (i === -1) return null;
  const prev = links[i - 1], next = links[i + 1];
  return (
    <div className="mx-auto max-w-content px-6 pb-14 flex items-center justify-between gap-3">
      {prev ? (
        <Link to={prev.to} className="btn-secondary btn-sm"><ArrowLeft size={15} /> {prev.label}</Link>
      ) : <span />}
      {next ? (
        <Link to={next.to} className="btn-primary btn-sm">Next: {next.label} <ArrowRight size={15} /></Link>
      ) : <span />}
    </div>
  );
}
