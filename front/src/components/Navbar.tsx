import { useTheme } from '../context/ThemeContext';
import { Link } from "react-router";

function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="w-full bg-background">
      <div className="flex items-center justify-between px-6 md:px-10 h-20">
        
        
        <Link to="/" className="text-2xl font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity">
          TradeLog 
        </Link>

        <nav className="flex items-center">
          <label className="switch" aria-label="Toggle theme">
            <input 
              type="checkbox" 
              id="themeToggle" 
              checked={theme === 'dark'}
              onChange={toggleTheme}
            />
            <span className="thumb">
              <div className="cranium"></div>
              <div className="mouth"></div>
            </span>
            <span className="arm-wrapper">
              <span className="arm">
                <span className="bone"></span>
                <span className="bone"></span>
                <span className="hand">
                  <span className="bone"></span>
                  <span className="bone"></span>
                  <span className="bone"></span>
                  <span className="bone"></span>
                </span>
                <span className="big"></span>
              </span>
            </span>
          </label>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;