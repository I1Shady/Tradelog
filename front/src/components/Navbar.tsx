import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router";

function Navbar() {
  const { theme, toggleTheme } = useTheme();

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

        <div className="flex items-center gap-5">
          <span className="hidden text-[11px] font-semibold tracking-[0.18em] text-slate-400 sm:block">
            TRADING JOURNAL
          </span>

          <div className="h-6 w-px bg-white/10" />

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
