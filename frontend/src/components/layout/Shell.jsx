import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const links = [
  { to: "/app/assistant", label: "Guide" },
  { to: "/app/vault", label: "Vault" },
  { to: "/app/guardians", label: "Guardians" },
  { to: "/app/messages", label: "Messages" },
];

export default function Shell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <NavLink to="/app/assistant" className="flex items-center gap-2 font-display text-lg">
            <span>🕯️</span> LastLogin
          </NavLink>
          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-full text-sm ${isActive ? "bg-ink text-paper" : "text-ink hover:bg-line/60"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <button onClick={() => { logout(); nav("/"); }} className="ml-2 text-sm text-mist hover:text-ink">
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
