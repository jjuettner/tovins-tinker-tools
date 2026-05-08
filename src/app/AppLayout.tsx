import { Book, ChevronDown, Dice6, LogOut, Menu, Moon, Sun, Sword, Swords, Tent, User, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useStoredState } from "@/hooks/useStoredState";
import { APP_DISPLAY_NAME, STORAGE_KEYS } from "@/lib/appConstants";
import { signOut, useProfile } from "@/lib/auth";
import CharacterAvatar from "@/components/ui/CharacterAvatar";

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
  const { value: usedCharacterId } = useStoredState<string | null>(STORAGE_KEYS.usedCharacterId, null);
  const { value: usedCharacterName } = useStoredState<string | null>(STORAGE_KEYS.usedCharacterName, null);
  const { value: usedCharacterClassIndex } = useStoredState<string | null>(STORAGE_KEYS.usedCharacterClassIndex, null);
  const { value: usedCharacterAvatarUrl } = useStoredState<string | null>(STORAGE_KEYS.usedCharacterAvatarUrl, null);
  const usedCharacter = useMemo(() => {
    if (!usedCharacterId) return null;
    return {
      id: usedCharacterId,
      name: usedCharacterName ?? "Unnamed",
      classIndex: usedCharacterClassIndex ?? "",
      avatarUrl: usedCharacterAvatarUrl
    };
  }, [usedCharacterAvatarUrl, usedCharacterClassIndex, usedCharacterId, usedCharacterName]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const navItems: NavItem[] = [
    { to: "/play", label: "Play", icon: <Sword className="h-4 w-4" aria-hidden="true" /> },
    { to: "/compendium", label: "Compendium", icon: <Book className="h-4 w-4" aria-hidden="true" /> },
    { to: "/campaigns", label: "Campaigns", icon: <Tent className="h-4 w-4" aria-hidden="true" /> },
    { to: "/encounters", label: "Encounters", icon: <Swords className="h-4 w-4" aria-hidden="true" /> }
  ];

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dmMenuOpen, setDmMenuOpen] = useState(false);
  const [mobileDmOpen, setMobileDmOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setDmMenuOpen(false);
    setMobileDmOpen(false);
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
            <div className="flex items-center gap-1">
              {navItems.slice(0, 2).map((item) => (
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
                  end={item.to === "/play"}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="mx-1 h-6 w-px bg-zinc-200/70 dark:bg-zinc-800/70" aria-hidden="true" />
            <div className="relative">
              <button
                type="button"
                className={
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition " +
                  "text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-50"
                }
                onClick={() => setDmMenuOpen((v) => !v)}
                aria-label="DM menu"
                aria-expanded={dmMenuOpen}
              >
                DM
                <ChevronDown className="h-4 w-4 opacity-80" aria-hidden="true" />
              </button>
              {dmMenuOpen ? (
                <div className="absolute left-0 top-12 z-30 w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                  {navItems.slice(2).map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        (
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium " +
                          "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900/60 " +
                          (isActive ? "bg-zinc-100 dark:bg-zinc-900/60" : "")
                        ).trim()
                      }
                    >
                      {item.icon}
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                className="hidden rounded-md sm:block"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-label="User menu"
                aria-expanded={userMenuOpen}
              >
                {usedCharacter ? (
                  <CharacterAvatar
                    characterId={usedCharacter.id}
                    name={usedCharacter.name || "Unnamed"}
                    classIndex={usedCharacter.classIndex}
                    avatarUrl={usedCharacter.avatarUrl}
                    size="sm"
                  />
                ) : (
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 bg-white/70 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-50">
                    <User className="h-4 w-4" aria-hidden="true" />
                  </div>
                )}
              </button>
              {userMenuOpen ? (
                <div className="absolute right-0 top-12 z-30 w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                  <NavLink
                    to="/"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900/60"
                  >
                    <Dice6 className="h-4 w-4" aria-hidden="true" />
                    Manage Characters
                  </NavLink>
                </div>
              ) : null}
            </div>
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
              {navItems.slice(0, 2).map((item) => (
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
                  end={item.to === "/play"}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
              <div className="my-1 border-t border-zinc-200/70 dark:border-zinc-800/70" />
              <button
                type="button"
                className="inline-flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-50"
                onClick={() => setMobileDmOpen((v) => !v)}
                aria-expanded={mobileDmOpen}
              >
                <span className="inline-flex items-center gap-2">
                  DM
                </span>
                <ChevronDown className={"h-4 w-4 opacity-80 transition " + (mobileDmOpen ? "rotate-180" : "")} aria-hidden="true" />
              </button>
              {mobileDmOpen ? (
                <div className="flex flex-col gap-1 pl-2">
                  {navItems.slice(2).map((item) => (
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
                    >
                      {item.icon}
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              ) : null}
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

