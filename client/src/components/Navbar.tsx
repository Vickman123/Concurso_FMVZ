import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, QrCode, Sparkles, Heart, Volume2, VolumeX, Radio } from 'lucide-react';
import { useContest } from '../context/ContestContext';
import { soundEngine } from '../services/soundEffects';
import { EventLogo } from './EventLogo';

interface NavbarProps {
  onOpenQr?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQr }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const location = useLocation();
  const { isVotingOpen, isLiveActive } = useContest();

  const navLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'Participantes', path: '/participantes' },
    ...(isLiveActive ? [{ label: 'Escenario en Vivo', path: '/en-vivo' }] : []),
    { label: 'Registrar mi disfraz', path: '/registrar' },
    { label: 'Premios', path: '/premios' },
    { label: 'Preguntas frecuentes', path: '/preguntas-frecuentes' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleToggleAudio = () => {
    const active = soundEngine.toggle();
    setIsAudioActive(active);
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
            {/* Ambient sound toggle */}
            <button
              onClick={handleToggleAudio}
              aria-label={isAudioActive ? 'Silenciar ambiente' : 'Activar sonido ambiental misterioso'}
              title={isAudioActive ? 'Silenciar atmósfera de Halloween' : 'Activar atmósfera misteriosa (Web Audio)'}
              className={`p-2 rounded-xl border transition-all ${
                isAudioActive
                  ? 'bg-halloween-orange/20 border-halloween-orange text-halloween-orange shadow-glow-orange animate-pulse'
                  : 'bg-surface border-halloween-border text-halloween-muted hover:text-halloween-white hover:bg-surface-raised'
              }`}
            >
              {isAudioActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {onOpenQr && (
              <button
                onClick={onOpenQr}
                title="Mostrar código QR personalizado con logo"
                className="p-2 rounded-xl bg-surface text-halloween-lavender hover:text-white hover:bg-surface-raised transition-colors border border-halloween-border"
              >
                <QrCode className="w-4 h-4" />
              </button>
            )}

            {isLiveActive && (
              <Link
                to="/en-vivo"
                title="Escenario de votación sincronizada en vivo (Modo Kahoot)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30 text-xs font-bold transition-all shadow-sm animate-pulse"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>En Vivo</span>
              </Link>
            )}

            {isVotingOpen ? (
              <Link
                to="/votar"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-halloween-orange to-halloween-orange-light hover:brightness-110 shadow-glow-orange transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>Votar ahora</span>
              </Link>
            ) : (
              <Link
                to="/participantes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-halloween-white bg-surface hover:bg-surface-raised border border-halloween-border transition-colors"
              >
                <Sparkles className="w-4 h-4 text-halloween-purple-light" />
                <span>Ver participantes</span>
              </Link>
            )}
          </div>

          {/* Mobile menu and action buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={handleToggleAudio}
              aria-label={isAudioActive ? 'Silenciar sonido' : 'Activar sonido'}
              className={`p-2 rounded-xl border ${
                isAudioActive
                  ? 'bg-halloween-orange/20 border-halloween-orange text-halloween-orange'
                  : 'bg-surface border-halloween-border text-halloween-muted'
              }`}
            >
              {isAudioActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

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
          <div className="pt-2">
            <Link
              to="/votar"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-halloween-orange to-halloween-orange-light shadow-glow-orange"
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
