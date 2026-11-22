import { useTheme } from "../context/ThemeContext";
import { Link, useLocation } from "react-router";
import { Mic, BookOpen } from "lucide-react";

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isVoicePage = location.pathname === "/voice";
  const isJournalPage = location.pathname === "/journal";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/10 bg-[#111c30] text-white shadow-lg shadow-slate-950/5">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-5 md:px-10">

        <Link
          to="/"
          className="group flex items-center gap-3 transition-opacity duration-200 hover:opacity-80"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-blue-500 text-sm font-black text-white shadow-md shadow-blue-500/20">
            T
          </span>

          <span className="text-xl font-bold tracking-tight">
            Trade<span className="text-blue-400">Log</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">

          <nav className="flex items-center gap-1.5 sm:gap-2">

            <Link
              to="/journal"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                isJournalPage
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <BookOpen className="size-4" />
              <span className="hidden sm:inline">Journal</span>
            </Link>

            <Link
              to="/voice"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                isVoicePage
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Mic className="size-4" />
              <span className="hidden sm:inline">Voice Journal</span>
            </Link>

          </nav>

          <span className="hidden text-[11px] font-semibold tracking-[0.18em] text-slate-400 xl:block">
            TRADING JOURNAL
          </span>

          <div className="hidden h-6 w-px bg-white/10 sm:block" />

          <label className="switch" aria-label="Toggle theme">
            <input
              type="checkbox"
              id="themeToggle"
              checked={theme === "dark"}
              onChange={toggleTheme}
            />

            <span className="thumb">
              <div className="cranium" />
              <div className="mouth" />
            </span>

            <span className="arm-wrapper">
              <span className="arm">
                <span className="bone" />
                <span className="bone" />

                <span className="hand">
                  <span className="bone" />
                  <span className="bone" />
                  <span className="bone" />
                  <span className="bone" />
                </span>

                <span className="big" />
              </span>
            </span>
          </label>

        </div>
      </div>
    </header>
  );
}

export default Navbar;