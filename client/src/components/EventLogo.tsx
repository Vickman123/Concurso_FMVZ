import React from 'react';

interface EventLogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const EventLogo: React.FC<EventLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const heightClasses = {
    sm: 'h-8 sm:h-9 max-w-[190px]',
    md: 'h-11 sm:h-13 max-w-[240px] sm:max-w-[280px]',
    lg: 'h-16 sm:h-20 max-w-[320px] sm:max-w-[380px]',
  };

  return (
    <div className={`flex items-center select-none group ${className}`}>
      <img
        src="/logos/concurso-fmvz-horizontal.png"
        alt="Concurso de Disfraces FMVZ"
        className={`w-auto ${heightClasses[size]} object-contain filter drop-shadow-[0_2px_12px_rgba(255,116,23,0.35)] group-hover:brightness-110 group-hover:scale-[1.02] transition-all duration-300`}
      />
    </div>
  );
};
