import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { FloatingBat, GlowingPumpkin } from './HalloweenDecorations';

export const HeroVisual: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const charactersRef = useRef<HTMLDivElement>(null);
  const mistRef = useRef<HTMLDivElement>(null);
  const batsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    // Mouse parallax on desktop
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

      // Deep moon layer moves slowly (depth = far)
      if (moonRef.current) {
        gsap.to(moonRef.current, {
          x: x * 8,
          y: y * 6,
          duration: 1.2,
          ease: 'power2.out',
        });
      }

      // Middle characters layer moves medium
      if (charactersRef.current) {
        gsap.to(charactersRef.current, {
          x: x * 16,
          y: y * 12,
          duration: 0.9,
          ease: 'power2.out',
        });
      }

      // Foreground mist moves fast (depth = near)
      if (mistRef.current) {
        gsap.to(mistRef.current, {
          x: x * -24,
          y: y * -10,
          duration: 0.8,
          ease: 'power2.out',
        });
      }

      // Bats react to mouse
      if (batsRef.current) {
        gsap.to(batsRef.current, {
          x: x * -14,
          y: y * -12,
          duration: 1,
          ease: 'power2.out',
        });
      }
    };

    const handleMouseLeave = () => {
      if (moonRef.current) gsap.to(moonRef.current, { x: 0, y: 0, duration: 1.5, ease: 'power2.out' });
      if (charactersRef.current) gsap.to(charactersRef.current, { x: 0, y: 0, duration: 1.5, ease: 'power2.out' });
      if (mistRef.current) gsap.to(mistRef.current, { x: 0, y: 0, duration: 1.5, ease: 'power2.out' });
      if (batsRef.current) gsap.to(batsRef.current, { x: 0, y: 0, duration: 1.5, ease: 'power2.out' });
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-xl mx-auto aspect-[4/3] sm:aspect-[16/11] lg:aspect-[5/4] flex items-center justify-center select-none"
    >
      {/* 1. Deep Backlight & Glowing Halloween Moon */}
      <div
        ref={moonRef}
        className="absolute top-2 right-12 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-[#FF9A24] via-[#FF7417] to-amber-700/30 opacity-80 blur-[2px] shadow-[0_0_90px_rgba(255,116,23,0.45)] pointer-events-none"
      >
        {/* Soft inner texture */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-transparent via-amber-200/20 to-transparent blur-[1px]" />
      </div>

      {/* Ambient background glow behind characters */}
      <div className="absolute inset-0 bg-radial from-halloween-purple/20 via-transparent to-transparent blur-3xl pointer-events-none" />

      {/* 2. Layered Flying Bats */}
      <div ref={batsRef} className="absolute inset-0 pointer-events-none z-10">
        <FloatingBat className="absolute top-6 left-10 w-7 h-7 text-[#FF9A24]/70 animate-float-slow drop-shadow-[0_0_6px_rgba(255,154,36,0.6)]" />
        <FloatingBat className="absolute top-14 right-8 w-9 h-9 text-purple-300/60 animate-float-slow [animation-delay:1.5s]" />
        <FloatingBat className="absolute top-24 left-1/3 w-5 h-5 text-gray-400/50 animate-float-slow [animation-delay:3s]" />
        <FloatingBat className="absolute top-4 right-1/3 w-6 h-6 text-halloween-orange/60 animate-float-slow [animation-delay:2s]" />
      </div>

      {/* 3. Main Composition: Costumed Characters (Catrina, Vampire, Witch) */}
      <div
        ref={charactersRef}
        className="relative z-20 w-full h-full flex items-center justify-center overflow-visible"
      >
        <img
          src="/hero-cinematic.png"
          alt="Estudiantes universitarios caracterizados para el Concurso de Disfraces FMVZ"
          className="w-full h-full object-contain object-bottom pointer-events-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)] filter contrast-[1.05] brightness-[1.02]"
          loading="eager"
        />

        {/* Floating Halloween quote / badge as seen in top right of reference */}
        <div className="absolute top-3 right-3 sm:top-5 sm:right-6 px-3 py-1 rounded-full bg-[#15182A]/80 border border-halloween-purple/40 backdrop-blur-md text-[10px] sm:text-xs font-semibold tracking-wider text-halloween-lavender shadow-md uppercase">
          ✦ Mismas ideas, distintos mundos
        </div>
      </div>

      {/* 4. Foreground Creeping Violet Mist & Vignette */}
      <div
        ref={mistRef}
        className="absolute -bottom-4 left-0 right-0 h-28 pointer-events-none z-30 bg-gradient-to-t from-[#080A12] via-[#080A12]/80 to-transparent flex items-end justify-between px-6 pb-2"
      >
        <div className="w-full h-12 bg-gradient-to-r from-halloween-purple/15 via-halloween-orange/15 to-halloween-purple/15 blur-xl" />
      </div>
    </div>
  );
};
