import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { useState } from 'react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 glass-header shadow-sm">
      <nav className="mx-auto flex h-20 w-full max-w-screen-2xl items-center justify-between px-4 sm:px-6 md:px-12">
      <Link to="/" className="flex items-center gap-2.5 text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface font-headline">
        <img
          src="/image/Waterious.png"
          alt="WashNet logo"
          className="h-8 w-8 rounded-md object-cover sm:h-9 sm:w-9"
        />
        <span>WashNet</span>
      </Link>

      <div className="hidden md:flex items-center space-x-8">
        <a href="/#features" className="text-primary font-semibold border-b-2 border-primary pb-1 text-sm">Features</a>
        <Link to="/partners" className="text-on-surface-variant hover:text-on-surface transition-colors text-sm">Partners</Link>
        <a
          href="https://trinova.it.com/pitch-desk/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-on-surface-variant hover:text-on-surface transition-colors text-sm"
        >
          About
        </a>
      </div>

      <div className="hidden md:block">
        <Link to="/login">
          <Button
            label="Get Started"
            className="power-gradient text-white px-8 py-2.5 rounded-full font-bold text-sm hover:opacity-90 active:scale-95 transition-all duration-300 border-none"
          />
        </Link>
      </div>

      <Button
        type="button"
        text
        rounded
        className="md:hidden flex h-10 w-10 items-center justify-center text-on-surface-variant hover:bg-surface-container-low border-none shadow-none"
        aria-label="Toggle menu"
        onClick={() => setMenuOpen((prev) => !prev)}
        icon={menuOpen ? 'pi pi-times' : 'pi pi-bars'}
      />
      </nav>

      {menuOpen && (
        <div className="border-t border-outline-variant/20 bg-surface-container-lowest px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:hidden">
          <div className="flex flex-col gap-4 text-sm font-semibold">
            <a href="/#features" className="text-on-surface-variant hover:text-on-surface" onClick={() => setMenuOpen(false)}>Features</a>
            <Link to="/partners" className="text-on-surface-variant hover:text-on-surface" onClick={() => setMenuOpen(false)}>Partners</Link>
            <a
              href="https://trinova.it.com/pitch-desk/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-on-surface-variant hover:text-on-surface"
              onClick={() => setMenuOpen(false)}
            >
              About
            </a>
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              <Button
                label="Get Started"
                className="mt-1 w-full power-gradient text-white py-2.5 rounded-full font-bold border-none"
              />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
