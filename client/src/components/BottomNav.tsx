import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Heart, Trophy } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const items = [
    { label: 'Inicio', path: '/', icon: Home },
    { label: 'Participantes', path: '/participantes', icon: Users },
    { label: 'Votar', path: '/votar', icon: Heart },
    { label: 'Premios', path: '/premios', icon: Trophy },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0D0F1C]/95 backdrop-blur-lg border-t border-halloween-border/90 safe-bottom-nav">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full py-1 transition-colors ${
                active ? 'text-halloween-orange' : 'text-halloween-muted hover:text-halloween-lavender'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${active ? 'bg-halloween-orange/15 scale-110' : ''}`}>
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px] drop-shadow-[0_0_8px_rgba(255,116,23,0.5)]' : ''}`} />
              </div>
              <span className={`text-[11px] mt-0.5 ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
