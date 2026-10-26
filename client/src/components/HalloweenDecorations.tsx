import React from 'react';

export const GlowingPumpkin: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 15 C52 5, 58 5, 60 18" stroke="#22C55E" strokeWidth="6" strokeLinecap="round" />
    {/* Outer Ribs */}
    <ellipse cx="28" cy="55" rx="22" ry="32" fill="#FF7417" />
    <ellipse cx="72" cy="55" rx="22" ry="32" fill="#FF7417" />
    <ellipse cx="38" cy="56" rx="22" ry="35" fill="#FF8A3D" />
    <ellipse cx="62" cy="56" rx="22" ry="35" fill="#FF8A3D" />
    <ellipse cx="50" cy="56" rx="20" ry="36" fill="#FFA559" />
    {/* Glowing Face Features */}
    {/* Eyes */}
    <polygon points="36,44 44,52 32,52" fill="#090B14" />
    <polygon points="64,44 68,52 56,52" fill="#090B14" />
    {/* Nose */}
    <polygon points="50,56 46,62 54,62" fill="#090B14" />
    {/* Carved Mouth */}
    <path d="M30 68 Q50 82 70 68 Q64 74 58 70 Q54 75 50 71 Q46 75 42 70 Q36 74 30 68 Z" fill="#090B14" />
  </svg>
);

export const FloatingBat: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 24 C34 20 40 18 46 22 C52 26 58 20 62 14 C60 26 54 36 44 38 C48 44 42 50 36 46 C32 44 32 44 28 46 C22 50 16 44 20 38 C10 36 4 26 2 14 C6 20 12 26 18 22 C24 18 30 20 32 24 Z" />
  </svg>
);

export const SpookyGhost: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25 85 Q20 40 50 20 Q80 40 75 85 Q65 75 55 85 Q45 75 35 85 Q30 75 25 85 Z" fill="#A78BFA" opacity="0.85" />
    <circle cx="42" cy="42" r="5" fill="#090B14" />
    <circle cx="58" cy="42" r="5" fill="#090B14" />
    <ellipse cx="50" cy="54" rx="4" ry="7" fill="#090B14" />
  </svg>
);
