import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, QrCode, Sparkles, Radio } from 'lucide-react';
import { useContest } from '../context/ContestContext';
import { EventLogo } from './EventLogo';

interface NavbarProps {
  onOpenQr?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQr }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isLiveActive } = useContest();

  const navLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'Participantes', path: '/participantes' },
    ...(isLiveActive ? [{ label: 'Escenario en Vivo', path: '/en-vivo' }] : []),
    { label: 'Registrar mi disfraz', path: '/registrar' },
    { label: 'Consultar mi registro', path: '/registro/estado' },
    { label: 'Preguntas frecuentes', path: '/preguntas-frecuentes' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080A12]/85 backdrop-blur-md border-b border-[#282B47]/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand identifier: FMVZ Concurso de Disfraces (Sin UNAM) */}
          <Link to="/" className="flex items-center">
            <EventLogo size="md" />
          </Link>

          {/* Desktop Navigation with animated active indicator underline */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-3.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'text-halloween-white font-semibold'
                      : 'text-halloween-muted hover:text-halloween-white'
                  }`}
                >
                  <span>{link.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-halloween-orange to-halloween-orange-light rounded-full shadow-[0_0_8px_rgba(255,116,23,0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            {onOpenQr && (
              <button
                onClick={onOpenQr}
                title="Mostrar código QR personalizado con logo"
                className="p-2 rounded-xl bg-surface text-halloween-lavender hover:text-white hover:bg-surface-raised transition-colors border border-halloween-border"
              >
                <QrCode className="w-4 h-4" />
              </button>
            )}

            {isLiveActive ? (
              <Link
                to="/en-vivo"
                title="Votación sincronizada en vivo"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:brightness-110 shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all animate-pulse"
              >
                <Radio className="w-4 h-4" />
                <span>Votar en Vivo</span>
              </Link>
            ) : (
              <Link
                to="/participantes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-halloween-white bg-surface hover:bg-surface-raised border border-halloween-border transition-colors"
              >
                <Sparkles className="w-4 h-4 text-halloween-purple-light" />
                <span>Ver disfraces</span>
              </Link>
            )}
          </div>

          {/* Mobile menu and action buttons */}
          <div className="flex md:hidden items-center gap-2">
            {onOpenQr && (
              <button
                onClick={onOpenQr}
                aria-label="Código QR"
                className="p-2 rounded-xl bg-surface text-halloween-lavender border border-halloween-border"
              >
                <QrCode className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-surface text-gray-200 border border-halloween-border"
              aria-label="Menú principal"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#080A12]/95 backdrop-blur-xl border-b border-halloween-border px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-halloween-orange/15 text-halloween-orange font-bold border-l-2 border-halloween-orange'
                    : 'text-gray-300 hover:bg-surface-raised'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {isLiveActive && (
            <div className="pt-2">
              <Link
                to="/votar/en-vivo"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse"
              >
                <Radio className="w-4 h-4" />
                <span>Votar en Vivo desde tu Celular</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
