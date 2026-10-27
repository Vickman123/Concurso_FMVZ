import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Maximize2,
  Minimize2,
  Users,
  Clock,
  ThumbsUp,
  Flame,
  Award,
  Radio,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CustomQrWithLogo } from '../components/CustomQrWithLogo';
import { EventLogo } from '../components/EventLogo';

interface LiveParticipant {
  id: number;
  contest_number: number;
  public_display_name: string;
  costume_title: string;
  description: string;
  participant_type: string;
  photo_original_key: string;
  photo_thumbnail_key?: string;
  category?: string;
  live_yes_votes?: number;
}

interface LiveState {
  is_active?: boolean;
  stage_status: 'waiting' | 'presenting' | 'voting_open' | 'voting_closed' | 'podium';
  current_participant_id: number | null;
  current_participant: LiveParticipant | null;
  voting_seconds_left: number;
  total_cheers: number;
  current_votes: { yes_count: number; no_count: number; total: number };
  total_voters_registered: number;
  participants: LiveParticipant[];
  connected_clients: number;
  updated_at: string;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

export const LiveProjector: React.FC = () => {
  const [state, setState] = useState<LiveState>({
    stage_status: 'waiting',
    current_participant_id: null,
    current_participant: null,
    voting_seconds_left: 30,
    total_cheers: 0,
    current_votes: { yes_count: 0, no_count: 0, total: 0 },
    total_voters_registered: 0,
    participants: [],
    connected_clients: 1,
    updated_at: new Date().toISOString(),
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [countdown, setCountdown] = useState<number>(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Add floating reaction
  const addReaction = (emoji: string) => {
    const newReaction: FloatingReaction = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      x: 10 + Math.random() * 80, // percentage from left
    };
    setReactions((prev) => [...prev.slice(-30), newReaction]);

    // Remove after 3 seconds
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 3000);
  };

  // Fetch state snapshot
  const fetchState = async () => {
    try {
      const res = await fetch('/api/live/state');
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch {
      // offline fallback
    }
  };

  // Connect SSE and Polling Fallback
  useEffect(() => {
    fetchState();

    const eventSource = new EventSource('/api/live/stream');

    eventSource.addEventListener('INITIAL_STATE', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setState(data);
      } catch (err) {}
    });

    eventSource.addEventListener('LIVE_STATE_CHANGED', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setState(data);
        if (data.stage_status === 'podium') {
          launchPodiumConfetti();
        }
      } catch (err) {}
    });

    eventSource.addEventListener('LIVE_VOTE_UPDATED', (e: MessageEvent) => {
      try {
        const tally = JSON.parse(e.data);
        setState((prev) => ({
          ...prev,
          current_votes: {
            yes_count: tally.yes_count,
            no_count: tally.no_count,
            total: tally.total,
          },
        }));
      } catch (err) {}
    });

    eventSource.addEventListener('REACTION', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.emoji) {
          addReaction(data.emoji);
          setState((prev) => ({ ...prev, total_cheers: prev.total_cheers + 1 }));
        }
      } catch (err) {}
    });

    // Fallback polling every 2.5s
    const pollInterval = setInterval(fetchState, 2500);

    return () => {
      eventSource.close();
      clearInterval(pollInterval);
    };
  }, []);

  // Handle countdown during 'voting_open'
  useEffect(() => {
    if (state.stage_status === 'voting_open') {
      setCountdown(state.voting_seconds_left || 30);
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.stage_status, state.voting_seconds_left]);

  const launchPodiumConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#FF7417', '#8B5CF6', '#FF9A24', '#FFFFFF'],
      });
    } catch {}
  };

  const participant = state.current_participant;
  const topParticipants = [...state.participants].sort((a, b) => (b.live_yes_votes || 0) - (a.live_yes_votes || 0)).slice(0, 3);

  // If stage is deactivated by admin
  if (state.is_active === false) {
    return (
      <div className="min-h-screen bg-[#080A12] text-halloween-white flex flex-col justify-between overflow-hidden relative select-none p-6">
        <header className="flex items-center justify-between">
          <EventLogo size="md" />
          <div className="px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider">
            Escenario Inactivo
          </div>
        </header>

        <div className="max-w-lg mx-auto text-center space-y-6 glass-panel rounded-3xl p-8 sm:p-10 border border-halloween-border/80 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-halloween-purple/20 text-halloween-lavender flex items-center justify-center mx-auto border border-halloween-purple/40">
            <Radio className="w-8 h-8 text-halloween-orange" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-halloween-orange/20 text-halloween-orange border border-halloween-orange/30">
              Certamen · 3 de Noviembre de 2026
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white pt-2">
              Escenario en Vivo en Espera
            </h1>
            <p className="text-xs sm:text-sm text-halloween-muted leading-relaxed">
              La proyección y votación sincronizada en el auditorio de la FMVZ se activará el día oficial del concurso una vez que el comité organizador dé inicio a la pasarela.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-raised border border-halloween-border text-xs text-gray-300">
            ⏳ Esta pantalla se actualizará automáticamente en cuanto el administrador active el escenario en vivo.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="/"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-surface-raised hover:bg-surface-subtle border border-halloween-border transition-colors text-center"
            >
              Volver al inicio
            </a>
            <a
              href="/participantes"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-halloween-orange hover:bg-halloween-orange-dark transition-colors text-center shadow-glow-orange"
            >
              Ver galería de disfraces
            </a>
          </div>
        </div>

        <footer className="text-center text-xs text-gray-500">
          FMVZ UNAM · Segundo Concurso de Disfraces
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080A12] text-halloween-white flex flex-col justify-between overflow-hidden relative select-none font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-halloween-orange/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[32rem] h-[32rem] bg-halloween-purple/20 rounded-full blur-[160px] pointer-events-none" />

      {/* Floating Reactions Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-10 text-4xl animate-float-up pointer-events-none select-none transition-all duration-1000 ease-out"
            style={{ left: `${r.x}%` }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Top Header Bar for Stage / Auditorium */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-halloween-border/60 bg-[#0A0D1B]/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <EventLogo size="md" className="scale-95 origin-left" />
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-black tracking-wider uppercase shadow-inner animate-pulse">
            <Radio className="w-3.5 h-3.5" />
            <span>EN VIVO · ESCENARIO FMVZ</span>
          </div>
        </div>

        {/* Audience and Stage Metrics */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-surface-raised border border-halloween-border text-xs">
            <Users className="w-4 h-4 text-halloween-purple-light" />
            <span className="text-gray-400">Espectadores en vivo:</span>
            <strong className="text-white font-mono text-sm">{Math.max(state.connected_clients, 1)}</strong>
          </div>

          <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-surface-raised border border-halloween-border text-xs">
            <Flame className="w-4 h-4 text-halloween-orange" />
            <span className="text-gray-400">Reacciones:</span>
            <strong className="text-halloween-orange font-mono text-sm">{state.total_cheers}</strong>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-2xl bg-surface-raised border border-halloween-border hover:border-halloween-orange text-gray-300 hover:text-white transition-all shadow-md"
            title="Pantalla completa para proyector"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Stage Presentation Area */}
      <main className="flex-1 p-6 md:p-10 flex items-center justify-center z-20">
        {state.stage_status === 'podium' ? (
          /* Podium / Winners Display */
          <div className="w-full max-w-6xl text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black tracking-widest uppercase text-sm shadow-glow-orange">
              <Award className="w-5 h-5" />
              <span>RESULTADOS EN VIVO DEL PÚBLICO</span>
            </div>

            <h1 className="font-display font-black text-4xl md:text-6xl text-white">
              Podio de Disfraces Más Votados
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 items-end">
              {/* 2nd Place */}
              {topParticipants[1] && (
                <div className="glass-panel p-6 rounded-3xl border border-gray-400/30 text-center space-y-4 order-2 md:order-1 h-[420px] flex flex-col justify-between">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gray-400/20 text-gray-200 font-black text-xl flex items-center justify-center border border-gray-400/40">
                    2º
                  </div>
                  <img
                    src={topParticipants[1].photo_thumbnail_key || topParticipants[1].photo_original_key}
                    alt={topParticipants[1].costume_title}
                    className="w-40 h-40 object-cover rounded-2xl mx-auto border-2 border-gray-400/40 shadow-md"
                  />
                  <div>
                    <h3 className="font-display font-bold text-xl text-white truncate">
                      {topParticipants[1].costume_title}
                    </h3>
                    <p className="text-xs text-halloween-muted">{topParticipants[1].public_display_name}</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-surface-raised border border-halloween-border font-mono text-sm text-halloween-lavender">
                    {topParticipants[1].live_yes_votes || 0} Votos
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topParticipants[0] && (
                <div className="glass-panel p-8 rounded-3xl border-2 border-amber-500/60 shadow-glow-orange text-center space-y-4 order-1 md:order-2 h-[480px] flex flex-col justify-between bg-gradient-to-b from-[#1F1910] to-[#121528]">
                  <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/30 text-amber-300 font-black text-2xl flex items-center justify-center border-2 border-amber-400 shadow-glow-orange animate-bounce">
                    👑 1º
                  </div>
                  <img
                    src={topParticipants[0].photo_thumbnail_key || topParticipants[0].photo_original_key}
                    alt={topParticipants[0].costume_title}
                    className="w-48 h-48 object-cover rounded-2xl mx-auto border-4 border-amber-400 shadow-glow-orange"
                  />
                  <div>
                    <h3 className="font-display font-black text-2xl text-amber-200">
                      {topParticipants[0].costume_title}
                    </h3>
                    <p className="text-sm text-halloween-white">{topParticipants[0].public_display_name}</p>
                  </div>
                  <div className="px-6 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/50 font-mono text-lg text-amber-300 font-bold">
                    {topParticipants[0].live_yes_votes || 0} Votos de la Comunidad
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topParticipants[2] && (
                <div className="glass-panel p-6 rounded-3xl border border-amber-700/40 text-center space-y-4 order-3 h-[380px] flex flex-col justify-between">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-800/20 text-amber-400 font-black text-xl flex items-center justify-center border border-amber-700/50">
                    3º
                  </div>
                  <img
                    src={topParticipants[2].photo_thumbnail_key || topParticipants[2].photo_original_key}
                    alt={topParticipants[2].costume_title}
                    className="w-36 h-36 object-cover rounded-2xl mx-auto border-2 border-amber-700/50 shadow-md"
                  />
                  <div>
                    <h3 className="font-display font-bold text-lg text-white truncate">
                      {topParticipants[2].costume_title}
                    </h3>
                    <p className="text-xs text-halloween-muted">{topParticipants[2].public_display_name}</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-surface-raised border border-halloween-border font-mono text-sm text-halloween-lavender">
                    {topParticipants[2].live_yes_votes || 0} Votos
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : participant ? (
          /* Stage Active Participant View */
          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Costume Photo */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden border-2 border-halloween-purple/50 shadow-glow-purple bg-[#121528] group">
                <img
                  src={participant.photo_original_key}
                  alt={participant.costume_title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080A12] via-transparent to-transparent opacity-80" />

                {/* Participant Number Badge */}
                <div className="absolute top-4 left-4 px-4 py-1.5 rounded-2xl bg-[#080A12]/90 border border-halloween-orange/60 text-white font-mono font-black text-lg shadow-lg flex items-center gap-2">
                  <span className="text-halloween-orange">#</span>
                  <span>{String(participant.contest_number).padStart(2, '0')}</span>
                </div>

                {/* Category Pill */}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-xl bg-halloween-purple/80 text-white text-xs font-bold uppercase tracking-wider shadow-md">
                  {participant.participant_type === 'student' ? 'Estudiante FMVZ' : 'Trabajador FMVZ'}
                </div>

                {/* Bottom title overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                    {participant.costume_title}
                  </h2>
                  <p className="text-sm text-halloween-lavender mt-1">
                    Por {participant.public_display_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Stage Status & Real-time Live Voting Box */}
            <div className="lg:col-span-7 space-y-6">
              {/* Status Header */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-halloween-purple/20 border border-halloween-purple/40 text-halloween-lavender text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-halloween-orange" />
                  <span>PARTICIPANTE EN EL ESCENARIO</span>
                </div>
                <h1 className="font-display font-black text-4xl sm:text-5xl text-white leading-tight">
                  {participant.costume_title}
                </h1>
                <p className="text-base text-gray-300 mt-2 line-clamp-3">
                  "{participant.description}"
                </p>
              </div>

              {/* Voting Box with Timer or Results */}
              {state.stage_status === 'voting_open' ? (
                <div className="glass-panel p-6 sm:p-8 rounded-3xl border-2 border-halloween-orange shadow-glow-orange space-y-6 bg-gradient-to-br from-[#1C130D] to-[#121528] animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-halloween-orange/20 border border-halloween-orange text-halloween-orange flex items-center justify-center animate-spin-slow">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs text-halloween-orange font-bold uppercase tracking-wider block">
                          ¡Votación Abierta!
                        </span>
                        <strong className="text-2xl text-white font-display">
                          Vota en tu celular ahora
                        </strong>
                      </div>
                    </div>

                    {/* Big Countdown Timer */}
                    <div className="text-right">
                      <span className="text-4xl sm:text-5xl font-mono font-black text-halloween-orange">
                        {countdown}s
                      </span>
                    </div>
                  </div>

                  {/* Progress timer bar */}
                  <div className="w-full h-3 bg-surface-raised rounded-full overflow-hidden border border-halloween-border">
                    <div
                      className="h-full bg-gradient-to-r from-halloween-orange to-amber-400 transition-all duration-1000 ease-linear"
                      style={{ width: `${Math.min(100, (countdown / (state.voting_seconds_left || 30)) * 100)}%` }}
                    />
                  </div>

                  {/* Real-time incoming vote counter */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-halloween-border">
                    <div className="flex items-center gap-2 text-halloween-white">
                      <ThumbsUp className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-semibold">Votos recibidos en vivo:</span>
                    </div>
                    <span className="font-mono font-black text-3xl text-emerald-400">
                      {state.current_votes.yes_count}
                    </span>
                  </div>
                </div>
              ) : state.stage_status === 'voting_closed' ? (
                <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-halloween-purple/50 shadow-glow-purple space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-red-400 font-bold uppercase tracking-wider block">
                        Votación Concluida
                      </span>
                      <strong className="text-2xl text-white font-display">
                        Total de Votos Obtenidos
                      </strong>
                    </div>
                    <div className="px-5 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-black text-3xl">
                      {state.current_votes.yes_count} Votos
                    </div>
                  </div>

                  <p className="text-xs text-halloween-muted">
                    El moderador pasará al siguiente concursante en unos momentos...
                  </p>
                </div>
              ) : (
                <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-halloween-border text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-halloween-purple/20 text-halloween-lavender flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-white">
                      Preparando al concursante
                    </h3>
                    <p className="text-xs text-halloween-muted mt-1">
                      El jurado y el público observan la pasarela. En breve se abrirá el botón de votación en sus teléfonos.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Waiting Stage / Contest Opening */
          <div className="text-center space-y-6 max-w-2xl animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-halloween-purple/20 text-halloween-lavender flex items-center justify-center mx-auto border border-halloween-purple/40 shadow-glow-purple">
              <Sparkles className="w-10 h-10 text-halloween-orange" />
            </div>
            <h1 className="font-display font-black text-4xl sm:text-6xl text-white">
              Segundo Concurso de Disfraces FMVZ
            </h1>
            <p className="text-lg text-halloween-lavender">
              El evento comenzará en unos momentos. ¡Prepara tu teléfono para votar por tus participantes favoritos!
            </p>
          </div>
        )}
      </main>

      {/* Floating Bottom QR Code Widget for Audience to Scan */}
      <footer className="px-6 py-4 border-t border-halloween-border/60 bg-[#0A0D1B]/90 backdrop-blur-md flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <span className="font-display font-bold text-sm text-white block">
              ¿Estás en el público?
            </span>
            <span className="text-xs text-halloween-muted">
              Escanea con tu cámara para ingresar a la votación sincronizada
            </span>
          </div>
        </div>

        {/* Mini QR Card for stage footer */}
        <div className="flex items-center gap-4">
          <div className="font-mono text-xs text-halloween-orange font-bold text-right hidden sm:block">
            {window.location.origin}/votar
          </div>
          <div className="p-1.5 bg-white rounded-xl shadow-md border-2 border-halloween-orange/60">
            <CustomQrWithLogo
              size={70}
              showLogo={true}
              showActions={false}
              url={`${window.location.origin}/votar`}
            />
          </div>
        </div>
      </footer>
    </div>
  );
};
