import fs from 'fs';
import path from 'path';
import { INITIAL_57_PARTICIPANTS } from './initialData';

export function generateCostumeSvgs() {
  const uploadsDir = path.resolve(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const themes = [
    { bg: ['#2E1065', '#0F172A'], accent: '#F59E0B', icon: '💀', title: 'Catrina' },
    { bg: ['#14532D', '#0F172A'], accent: '#22C55E', icon: '🃏', title: 'Caos' },
    { bg: ['#78350F', '#090B14'], accent: '#F97316', icon: '🤠', title: 'Vaquero' },
    { bg: ['#831843', '#090B14'], accent: '#EC4899', icon: '💉', title: 'Guardia' },
    { bg: ['#1E3A8A', '#064E3B'], accent: '#10B981', icon: '🦖', title: 'Dino' },
    { bg: ['#18181B', '#090B14'], accent: '#E2E8F0', icon: '😱', title: 'Scream' },
    { bg: ['#3B0764', '#1E1B4B'], accent: '#A855F7', icon: '🧙‍♀️', title: 'Bruja' },
    { bg: ['#4C0519', '#090B14'], accent: '#EF4444', icon: '🧛‍♂️', title: 'Vampiro' },
    { bg: ['#042F2E', '#090B14'], accent: '#14B8A6', icon: '🧟‍♂️', title: 'Franken' },
    { bg: ['#1C1917', '#090B14'], accent: '#D97706', icon: '🎭', title: 'Peste' },
  ];

  INITIAL_57_PARTICIPANTS.forEach((p, idx) => {
    const theme = themes[idx % themes.length];
    const numStr = String(p.contest_number).padStart(2, '0');
    const filename = `costume_${numStr}.svg`;
    const targetFile = path.join(uploadsDir, filename);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad${numStr}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg[0]}" />
      <stop offset="100%" stop-color="${theme.bg[1]}" />
    </linearGradient>
    <radialGradient id="glow${numStr}" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#090B14" stop-opacity="0" />
    </radialGradient>
    <filter id="shadow${numStr}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="100%" height="100%" fill="url(#bgGrad${numStr})" />
  
  <!-- Festive Glow -->
  <circle cx="200" cy="190" r="150" fill="url(#glow${numStr})" />

  <!-- Moon Silhouette backdrop -->
  <circle cx="200" cy="180" r="110" fill="#1E1B4B" stroke="${theme.accent}" stroke-width="2" stroke-opacity="0.4" />

  <!-- Atmospheric Bats / Embers -->
  <path d="M 90 90 Q 95 80 105 85 Q 115 80 120 90 Q 110 88 105 92 Q 100 88 90 90 Z" fill="${theme.accent}" opacity="0.6"/>
  <path d="M 290 80 Q 295 72 303 76 Q 311 72 315 80 Q 307 78 303 82 Q 299 78 290 80 Z" fill="${theme.accent}" opacity="0.5"/>
  <path d="M 330 130 Q 334 124 340 127 Q 346 124 350 130 Q 344 128 340 132 Q 336 128 330 130 Z" fill="${theme.accent}" opacity="0.4"/>

  <!-- Character Icon / Symbol representation -->
  <g transform="translate(200, 195) scale(1.1)" filter="url(#shadow${numStr})">
    <circle cx="0" cy="-10" r="75" fill="#141626" stroke="#8B5CF6" stroke-width="2" opacity="0.9" />
    <text x="0" y="24" font-size="78" text-anchor="middle" dominant-baseline="central">${theme.icon}</text>
  </g>

  <!-- Bottom Dark Vignette Overlay -->
  <rect y="310" width="400" height="170" fill="url(#bgGrad${numStr})" opacity="0.95" />
  
  <!-- Banner Details -->
  <rect x="25" y="340" width="350" height="110" rx="16" fill="#141626" stroke="#282B47" stroke-width="1.5" />

  <text x="45" y="375" fill="#FF7417" font-family="system-ui, sans-serif" font-size="13" font-weight="700" letter-spacing="1.5">PARTICIPANTE #${numStr}</text>
  <text x="45" y="405" fill="#F8F5F0" font-family="system-ui, sans-serif" font-size="18" font-weight="700">${escapeXml(p.costume_title)}</text>
  <text x="45" y="430" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="13">${escapeXml(p.public_display_name)} · ${p.participant_type === 'student' ? 'Estudiante FMVZ' : 'Trabajador FMVZ'}</text>
</svg>`;

    fs.writeFileSync(targetFile, svg, 'utf8');
  });

  console.log(`[SVG Generator] Created 57 custom costume SVGs in ${uploadsDir}`);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
