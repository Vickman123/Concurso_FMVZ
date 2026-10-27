import React from 'react';

interface EventLogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const EventLogo: React.FC<EventLogoProps> = ({
  className = '',
  showSubtitle = true,
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11 sm:w-12 sm:h-12',
    lg: 'w-16 h-16 sm:w-20 sm:h-20',
  };

  const fmvzSizes = {
    sm: 'text-sm font-black',
    md: 'text-base sm:text-lg font-black',
    lg: 'text-2xl sm:text-3xl font-black',
  };

  const titleSizes = {
    sm: 'text-xs font-extrabold',
    md: 'text-xs sm:text-sm font-extrabold',
    lg: 'text-base sm:text-lg font-extrabold',
  };

  return (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      {/* Concept 2 Geometric Low-Poly Carved Pumpkin */}
      <div className={`relative ${iconSizes[size]} flex-shrink-0 flex items-center justify-center`}>
        {/* Ambient violet/orange glow underneath */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#8B5CF6]/40 to-[#FF7417]/30 blur-md group-hover:scale-110 transition-transform duration-300" />
        
        <img
          src="/logos/pumpkin-concept2-clean.png"
          alt="FMVZ Concurso de Disfraces"
          className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(255,116,23,0.4)] group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Typography: "FMVZ · Concurso de Disfraces" (Sin UNAM) */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-2">
          <span className={`font-display tracking-wider text-[#F7F4F0] ${fmvzSizes[size]}`}>
            FMVZ
          </span>
          <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full bg-[#15182A] border border-[#8B5CF6]/50 text-[#B79AFF] shadow-sm uppercase">
            HALLOWEEN
          </span>
        </div>

        {/* Title: Concurso de Disfraces */}
        <div className="mt-0.5">
          <span className={`font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FF7417] via-[#FF9A24] to-[#FF7417] drop-shadow-[0_1px_6px_rgba(255,116,23,0.35)] ${titleSizes[size]}`}>
            Concurso de Disfraces
          </span>
        </div>

        {showSubtitle && (
          <span className="text-[10px] font-medium text-[#A7ABC0] tracking-tight hidden sm:inline mt-0.5">
            Segundo Concurso · 3 de noviembre de 2026
          </span>
        )}
      </div>
    </div>
  );
};
