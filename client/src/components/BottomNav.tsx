import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Radio, PlusCircle, Trophy, ShieldCheck } from 'lucide-react';
import { useContest } from '../context/ContestContext';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { isLiveActive } = useContest();

  const items = [
    { label: 'Inicio', path: '/', icon: Home },
    { label: 'Galería', path: '/participantes', icon: Users },
    ...(isLiveActive
      ? [{ label: 'En Vivo', path: '/en-vivo', icon: Radio, primary: true }]
      : [{ label: 'Registrar', path: '/registrar', icon: PlusCircle, primary: true }]),
    { label: 'Premios', path: '/premios', icon: Trophy },
    { label: 'Admin', path: '/admin', icon: ShieldCheck },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#080A12]/95 backdrop-blur-xl border-t border-[#282B47] safe-bottom-nav">
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                active
                  ? 'text-halloween-orange font-bold'
                  : 'text-halloween-muted hover:text-halloween-white'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  item.primary && !active
                    ? 'bg-halloween-orange/20 text-halloween-orange'
                    : item.primary && active
                    ? 'bg-halloween-orange text-white shadow-glow-orange scale-110'
                    : active
                    ? 'bg-halloween-orange/15 scale-105'
                    : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
