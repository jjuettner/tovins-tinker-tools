import { Dice6, LogOut, Menu, Moon, Sun, Sword, Tent, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useStoredState } from "../hooks/useStoredState";
import { APP_DISPLAY_NAME, STORAGE_KEYS } from "../lib/appConstants";
import { signOut, useProfile } from "../lib/auth";

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

function usePrefersDark() {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  }, []);
}

export function AppLayout() {
  const prefersDark = usePrefersDark();
  const { value: dark, setValue: setDark } = useStoredState<boolean>(STORAGE_KEYS.themeDark, prefersDark);
  const { profile } = useProfile();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const navItems: NavItem[] = [
    { to: "/", label: "Characters", icon: <Dice6 className="h-4 w-4" aria-hidden="true" /> },
    { to: "/play", label: "Play", icon: <Sword className="h-4 w-4" aria-hidden="true" /> },
    { to: "/campaigns", label: "Campaigns", icon: <Tent className="h-4 w-4" aria-hidden="true" /> }
  ];

  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-zinc-50/70 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white/70 text-zinc-900 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-50 dark:hover:bg-zinc-900 sm:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
            </button>

            <div className="flex flex-col leading-tight">
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-display truncate text-base font-semibold tracking-tight sm:whitespace-normal">
                  {APP_DISPLAY_NAME}
                </span>
              </div>
              <span className="hidden text-xs text-zinc-600 dark:text-zinc-400 sm:block">
                Characters
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  (
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition " +
                    "text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-50 " +
                    (isActive ? "bg-zinc-200/60 text-zinc-900 dark:bg-zinc-900/60 dark:text-zinc-50" : "")
                  ).trim()
                }
                end={item.to === "/" || item.to === "/play"}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {profile ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white/70 px-3 text-sm font-medium text-zinc-900 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-50 dark:hover:bg-zinc-900"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white/70 px-3 text-sm font-medium text-zinc-900 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-50 dark:hover:bg-zinc-900"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
              <span className="hidden sm:inline">{dark ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-zinc-200/70 bg-zinc-50/80 px-4 py-2 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/50 sm:hidden">
            <nav className="mx-auto flex max-w-6xl flex-col gap-1" aria-label="Mobile primary">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    (
                      "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium " +
                      "text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-50 " +
                      (isActive ? "bg-zinc-200/60 text-zinc-900 dark:bg-zinc-900/60 dark:text-zinc-50" : "")
                    ).trim()
                  }
                  end={item.to === "/" || item.to === "/play"}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

