import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, QrCode, Sparkles, Heart } from 'lucide-react';
import { useContest } from '../context/ContestContext';

interface NavbarProps {
  onOpenQr?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQr }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isVotingOpen } = useContest();

  const navLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'Participantes', path: '/participantes' },
    { label: 'Registrar mi disfraz', path: '/registrar' },
    { label: 'Premios', path: '/premios' },
    { label: 'Preguntas frecuentes', path: '/preguntas-frecuentes' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-halloween-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand identifier */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-halloween-orange to-halloween-purple flex items-center justify-center shadow-glow-orange group-hover:scale-105 transition-transform">
              <span className="text-xl">🎃</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-sm sm:text-base tracking-wider text-halloween-white">
                  UNAM
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-halloween-purple/30 text-halloween-lavender font-semibold">
                  FMVZ
                </span>
              </div>
              <span className="text-[11px] text-halloween-muted font-medium hidden sm:inline">
                Segundo Concurso de Disfraces 2026
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'text-halloween-orange bg-halloween-orange/10 font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-surface-raised'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {onOpenQr && (
              <button
                onClick={onOpenQr}
                title="Mostrar código QR del evento"
                className="p-2 rounded-lg bg-surface-raised text-halloween-lavender hover:text-white hover:bg-halloween-purple/20 transition-colors border border-halloween-border"
              >
                <QrCode className="w-5 h-5" />
              </button>
            )}

            {isVotingOpen ? (
              <Link
                to="/votar"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-halloween-orange to-amber-600 hover:from-halloween-orange-dark hover:to-halloween-orange shadow-glow-orange transition-all transform hover:-translate-y-0.5"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>Votar ahora</span>
              </Link>
            ) : (
              <Link
                to="/participantes"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-halloween-white bg-surface-raised hover:bg-surface-card border border-halloween-border transition-colors"
              >
                <Sparkles className="w-4 h-4 text-halloween-purple-light" />
                <span>Ver galería</span>
              </Link>
            )}
          </div>

          {/* Mobile menu and QR buttons */}
          <div className="flex md:hidden items-center gap-2">
            {onOpenQr && (
              <button
                onClick={onOpenQr}
                aria-label="Código QR"
                className="p-2 rounded-lg bg-surface-raised text-halloween-lavender border border-halloween-border"
              >
                <QrCode className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-surface-raised text-gray-200 border border-halloween-border"
              aria-label="Menú principal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-halloween-border px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
                isActive(link.path)
                  ? 'bg-halloween-orange/15 text-halloween-orange font-bold'
                  : 'text-gray-200 hover:bg-surface-raised'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              to="/votar"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-halloween-orange to-amber-600 shadow-glow-orange"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Votar ahora</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
