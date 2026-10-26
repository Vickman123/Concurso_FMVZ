import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Trophy,
  Gift,
  ArrowRight,
  PlusCircle,
  HelpCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { useContest } from '../context/ContestContext';
import { Participant } from '../types';
import { ParticipantCard } from '../components/ParticipantCard';
import { GlowingPumpkin, FloatingBat, SpookyGhost } from '../components/HalloweenDecorations';

export const Home: React.FC = () => {
  const { settings, isVotingOpen } = useContest();
  const [featuredParticipants, setFeaturedParticipants] = useState<Participant[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    fetch('/api/participants?limit=6')
      .then(res => res.json())
      .then(data => {
        if (data.participants) {
          setFeaturedParticipants(data.participants.slice(0, 6));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFeatured(false));
  }, []);

  return (
    <div className="relative min-h-screen safe-bottom">
      {/* Background Ambience Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-halloween-purple/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-48 left-10 w-[300px] h-[300px] bg-halloween-orange/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative pt-6 sm:pt-12 pb-12 sm:pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden glass-panel border border-halloween-border/90 p-6 sm:p-12 lg:p-16 text-center shadow-card">
            
            {/* Atmospheric Background Graphics */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              {/* Moon Backdrop */}
              <div className="absolute top-4 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-12 w-44 h-44 sm:w-60 sm:h-60 rounded-full bg-gradient-to-br from-halloween-orange/40 to-amber-500/10 blur-xl" />
              {/* Bats */}
              <FloatingBat className="absolute top-8 left-12 w-8 h-8 text-halloween-purple/60 animate-float-slow" />
              <FloatingBat className="absolute top-16 right-20 w-6 h-6 text-halloween-orange/50 animate-float-slow" />
              <FloatingBat className="absolute bottom-12 left-1/4 w-5 h-5 text-halloween-lavender/40" />
            </div>

            {/* Badge: SEGUNDO */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-halloween-purple/20 border border-halloween-purple/40 text-halloween-lavender text-xs sm:text-sm font-semibold tracking-widest uppercase mb-4 shadow-sm animate-pulse-glow">
              <Sparkles className="w-4 h-4 text-halloween-orange" />
              <span>SEGUNDO CONCURSO</span>
            </div>

            {/* Big Title matching the reference design */}
            <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight text-halloween-white leading-tight">
              Concurso de <br className="sm:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-halloween-orange via-amber-400 to-halloween-orange">
                Disfraces FMVZ
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-3 text-base sm:text-xl text-halloween-lavender/90 font-medium max-w-2xl mx-auto">
              ¡Creatividad, talento y espíritu universitario!
            </p>

            {/* Date and Location Badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-300 font-medium">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-raised/80 border border-halloween-border">
                <Calendar className="w-4 h-4 text-halloween-orange" />
                <span>3 de noviembre de 2026</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-raised/80 border border-halloween-border">
                <MapPin className="w-4 h-4 text-halloween-purple-light" />
                <span>FMVZ, Ciudad Universitaria</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
              <Link
                to="/participantes"
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-halloween-orange to-amber-600 hover:from-halloween-orange-dark hover:to-halloween-orange shadow-glow-orange transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
              >
                <span>⭐ Ver participantes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/registrar"
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-base text-halloween-white bg-surface-raised hover:bg-surface-subtle border border-halloween-border/90 hover:border-halloween-purple/50 transition-all duration-200"
              >
                <PlusCircle className="w-4 h-4 text-halloween-purple-light" />
                <span>Registrar mi disfraz</span>
              </Link>
            </div>

            {/* Floating Pumpkins at bottom of hero */}
            <div className="mt-8 pt-6 border-t border-halloween-border/40 flex items-center justify-center gap-6">
              <GlowingPumpkin className="w-8 h-8 sm:w-10 sm:h-10 opacity-90" />
              <span className="text-xs text-halloween-muted">
                Capacidad: <strong className="text-halloween-white">{settings?.total_registered || 57}</strong> / {settings?.registration_limit || 100} concursantes
              </span>
              <GlowingPumpkin className="w-8 h-8 sm:w-10 sm:h-10 opacity-90 transform scale-x-[-1]" />
            </div>

            {/* Quick Action Icons bar (matching mobile screen 1) */}
            <div className="mt-8 grid grid-cols-4 gap-2 max-w-lg mx-auto pt-4 border-t border-halloween-border/30">
              <Link to="/registrar" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-surface-raised transition-colors">
                <div className="w-10 h-10 rounded-full bg-halloween-purple/20 flex items-center justify-center text-halloween-lavender">
                  <SpookyGhost className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-gray-300">Participa</span>
              </Link>

              <Link to="/premios" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-surface-raised transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-gray-300">Premios</span>
              </Link>

              <Link to="/votar" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-surface-raised transition-colors">
                <div className="w-10 h-10 rounded-full bg-halloween-orange/20 flex items-center justify-center text-halloween-orange">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-gray-300">Vota</span>
              </Link>

              <Link to="/preguntas-frecuentes" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-surface-raised transition-colors">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-gray-300">FAQs</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CÓMO VOTAR + PREMIOS + INFORMACIÓN (GRID SECTION) ===================== */}
      <section className="py-8 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Card 1: ¿Cómo votar? */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-halloween-border/90 relative overflow-hidden">
              <div className="absolute top-4 right-4 opacity-30">
                <SpookyGhost className="w-12 h-12" />
              </div>

              <div>
                <h2 className="font-display font-extrabold text-2xl text-halloween-white flex items-center gap-2">
                  <span>¿Cómo votar?</span>
                </h2>
                <p className="text-xs text-halloween-muted mt-1 mb-6">
                  Proceso transparente en 5 sencillos pasos:
                </p>

                <div className="space-y-4">
                  {[
                    { step: '1', title: 'Ingresa tus datos', desc: 'Nombre y número de cuenta o identificación' },
                    { step: '2', title: 'Explora los disfraces', desc: 'Conoce a todas las personas participantes' },
                    { step: '3', title: 'Elige tu favorito', desc: 'Una sola vez por persona' },
                    { step: '4', title: 'Confirma tu voto', desc: 'Tu voto quedará registrado transaccionalmente' },
                    { step: '5', title: '¡Listo!', desc: 'Recibe tu comprobante con folio único' },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-full bg-halloween-purple text-white flex-shrink-0 flex items-center justify-center font-display font-bold text-xs shadow-md">
                        {s.step}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-halloween-white">{s.title}</h4>
                        <p className="text-xs text-halloween-muted">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-halloween-border/40">
                <Link
                  to="/votar"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white bg-halloween-orange hover:bg-halloween-orange-dark transition-colors"
                >
                  <span>Iniciar votación</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Card 2: Premios */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-halloween-border/90 relative overflow-hidden">
              <div className="absolute top-4 right-4 opacity-25">
                <Trophy className="w-10 h-10 text-amber-400" />
              </div>

              <div>
                <h2 className="font-display font-extrabold text-2xl text-halloween-white flex items-center gap-2">
                  <span className="text-amber-400">👑</span>
                  <span>Premios</span>
                </h2>
                <p className="text-xs text-halloween-muted mt-1 mb-6">
                  Reconocimiento al talento de nuestra facultad:
                </p>

                {/* 3 Podium Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                  {/* 1st Place */}
                  <div className="bg-gradient-to-b from-amber-500/20 to-surface-card rounded-2xl p-3 text-center border border-amber-500/40 shadow-sm">
                    <span className="text-xl">🏆</span>
                    <div className="text-[11px] font-bold text-amber-300 mt-1 uppercase">1er lugar</div>
                    <div className="font-display font-extrabold text-sm sm:text-base text-white mt-1">$10,000</div>
                    <div className="text-[10px] text-gray-400">MXN</div>
                  </div>

                  {/* 2nd Place */}
                  <div className="bg-gradient-to-b from-slate-400/20 to-surface-card rounded-2xl p-3 text-center border border-slate-400/30 shadow-sm">
                    <span className="text-xl">🥈</span>
                    <div className="text-[11px] font-bold text-slate-200 mt-1 uppercase">2do lugar</div>
                    <div className="font-display font-extrabold text-sm sm:text-base text-white mt-1">$7,000</div>
                    <div className="text-[10px] text-gray-400">MXN</div>
                  </div>

                  {/* 3rd Place */}
                  <div className="bg-gradient-to-b from-amber-700/20 to-surface-card rounded-2xl p-3 text-center border border-amber-700/30 shadow-sm">
                    <span className="text-xl">🥉</span>
                    <div className="text-[11px] font-bold text-amber-200 mt-1 uppercase">3er lugar</div>
                    <div className="font-display font-extrabold text-sm sm:text-base text-white mt-1">$6,000</div>
                    <div className="text-[10px] text-gray-400">MXN</div>
                  </div>
                </div>

                {/* 20 Additional Prizes Banner */}
                <div className="p-3.5 rounded-2xl bg-halloween-purple/15 border border-halloween-purple/30 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-halloween-purple/30 flex items-center justify-center text-halloween-lavender flex-shrink-0 mt-0.5">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-xs sm:text-sm text-halloween-white">
                      20 premios adicionales
                    </h4>
                    <p className="text-xs text-halloween-lavender font-semibold">
                      con un valor de $5,000 MXN cada uno
                    </p>
                    <p className="text-[11px] text-halloween-muted mt-1 leading-snug">
                      Modalidad por definir en las bases oficiales del concurso (no asignación automática de clasificación).
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-halloween-border/40">
                <Link
                  to="/premios"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-halloween-lavender hover:text-white bg-surface-raised hover:bg-surface-subtle transition-colors border border-halloween-border"
                >
                  <span>Ver detalles de premiación</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Card 3: Información del evento */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-halloween-border/90 relative overflow-hidden">
              <div>
                <h2 className="font-display font-extrabold text-2xl text-halloween-white flex items-center gap-2">
                  <span className="text-halloween-orange">📅</span>
                  <span>Información del evento</span>
                </h2>
                <p className="text-xs text-halloween-muted mt-1 mb-6">
                  Detalles organizativos aprobados por la FMVZ:
                </p>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-raised/60 border border-halloween-border">
                    <Calendar className="w-5 h-5 text-halloween-orange flex-shrink-0" />
                    <div>
                      <span className="text-gray-400 block">Fecha oficial</span>
                      <strong className="text-halloween-white text-sm">3 de noviembre de 2026</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-raised/60 border border-halloween-border">
                    <MapPin className="w-5 h-5 text-halloween-purple flex-shrink-0" />
                    <div>
                      <span className="text-gray-400 block">Lugar</span>
                      <strong className="text-halloween-white text-sm">FMVZ, Ciudad Universitaria, CDMX</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-raised/60 border border-halloween-border">
                    <Users className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div>
                      <span className="text-gray-400 block">Participantes</span>
                      <strong className="text-halloween-white text-sm">Hasta 100 personas (57 registrados)</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-raised/60 border border-halloween-border">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div>
                      <span className="text-gray-400 block">Votación</span>
                      <strong className="text-halloween-white text-sm">Una sola vez por persona registrada</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-halloween-border/40">
                <Link
                  to="/preguntas-frecuentes"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-gray-300 hover:text-white bg-surface-raised hover:bg-surface-subtle transition-colors border border-halloween-border"
                >
                  <HelpCircle className="w-4 h-4 text-halloween-orange" />
                  <span>Preguntas frecuentes</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================== PARTICIPANTES DESTACADOS (GALERÍA TEASER) ===================== */}
      <section className="py-8 sm:py-12 border-t border-halloween-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-halloween-orange font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Galería oficial</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-halloween-white">
                Participantes destacados
              </h2>
            </div>
            <Link
              to="/participantes"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-halloween-orange hover:text-halloween-orange-light transition-colors"
            >
              <span>Ver todos ({settings?.total_registered || 57})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-2xl bg-surface-raised animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {featuredParticipants.map((participant) => (
                <ParticipantCard
                  key={participant.contest_number}
                  participant={participant}
                  isVotingOpen={isVotingOpen}
                />
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/participantes"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-halloween-white bg-surface-raised hover:bg-surface-card border border-halloween-purple/40 hover:shadow-glow-purple transition-all"
            >
              <span>Explorar todos los disfraces</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
