import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Tv,
  XCircle,
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
  web_votes?: number;
  total_votes?: number;
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
  const [joinNotification, setJoinNotification] = useState<{ id: string; count: number } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previousClientsCountRef = useRef<number>(1);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forceProjector = searchParams.get('view') === 'projector';

  // Smart mobile routing: if a mobile user visits /en-vivo (the auditorium projector screen),
  // automatically redirect them to /votar/en-vivo so they see the voting and login interface.
  useEffect(() => {
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    if (isMobile && !forceProjector) {
      navigate('/votar/en-vivo', { replace: true });
    }
  }, [forceProjector, navigate]);

  const voterUrl = `${window.location.origin}/votar/en-vivo`;

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

  // Trigger floating join notification
  const triggerJoinNotification = (count: number) => {
    setJoinNotification({ id: `${Date.now()}`, count });
    setTimeout(() => {
      setJoinNotification(null);
    }, 3500);
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
        if (data.connected_clients && data.connected_clients > previousClientsCountRef.current) {
          triggerJoinNotification(data.connected_clients);
        }
        if (data.connected_clients) {
          previousClientsCountRef.current = data.connected_clients;
        }
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
        if (data.connected_clients) {
          previousClientsCountRef.current = data.connected_clients;
        }
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

    eventSource.addEventListener('VIEWER_JOINED', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.connected_clients) {
          setState((prev) => ({ ...prev, connected_clients: data.connected_clients }));
          triggerJoinNotification(data.connected_clients);
          previousClientsCountRef.current = data.connected_clients;
        }
      } catch (err) {}
    });

    eventSource.addEventListener('VIEWER_LEFT', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.connected_clients) {
          setState((prev) => ({ ...prev, connected_clients: data.connected_clients }));
          previousClientsCountRef.current = data.connected_clients;
        }
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

    // Fallback polling every 2.5s for unstable auditorium networks
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
  const topParticipants = [...state.participants]
    .sort((a, b) => {
      const aCount = Number(a.total_votes ?? a.live_yes_votes ?? 0);
      const bCount = Number(b.total_votes ?? b.live_yes_votes ?? 0);
      const voteDiff = bCount - aCount;
      if (voteDiff !== 0) return voteDiff;
      // Criterio secundario de desempate automático: número de participante menor (orden de registro)
      return (a.contest_number || 0) - (b.contest_number || 0);
    })
    .slice(0, 3);

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
              La proyección y votación sincronizada en el auditorio de la FMVZ se activará en cuanto el moderador dé inicio a la pasarela en el panel de administración.
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

        <footer className="text-center text-xs text-halloween-muted">
          Facultad de Medicina Veterinaria y Zootecnia — UNAM
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080A12] text-halloween-white flex flex-col justify-between overflow-hidden relative select-none">
      {/* Floating Join Notification Banner (Toast) */}
      {joinNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce-subtle pointer-events-none">
          <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-halloween-purple via-indigo-600 to-halloween-orange border border-amber-300/60 text-white font-display font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(255,116,23,0.6)] flex items-center gap-2">
            <span className="text-lg">👻</span>
            <span>¡Nuevo espectador unido desde el auditorio!</span>
            <span className="px-2 py-0.5 rounded-full bg-black/40 text-amber-300 font-mono text-xs">
              Total: {joinNotification.count}
            </span>
          </div>
        </div>
      )}

      {/* Mobile Voter Hint Banner (If opened on a phone) */}
      <div className="md:hidden bg-gradient-to-r from-halloween-orange to-purple-700 px-4 py-2 flex items-center justify-between z-40 text-xs font-bold text-white shadow-md">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 animate-bounce" />
          <span>¿Quieres votar desde tu celular?</span>
        </div>
        <a
          href="/votar/en-vivo"
          className="px-3 py-1 bg-black/60 rounded-lg text-[11px] font-bold text-amber-300 border border-amber-400 flex items-center gap-1"
        >
          <span>Abrir Control</span>
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>

      {/* Floating Reaction Emojis Container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-16 text-5xl sm:text-6xl animate-float-up"
            style={{ left: `${r.x}%` }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Stage Top Bar Header */}
      <header className="px-6 py-4 border-b border-halloween-border/60 bg-[#0A0D1B]/90 backdrop-blur-md flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <EventLogo size="md" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <Radio className="w-3.5 h-3.5" />
            <span>Escenario en Vivo · Auditorio</span>
          </div>
        </div>

        {/* Live Audience & Controls Stats */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-surface-raised border border-halloween-border text-xs">
            <Users className="w-4 h-4 text-halloween-purple-light" />
            <span className="font-mono font-bold text-white">{state.connected_clients}</span>
            <span className="hidden sm:inline text-halloween-muted">espectadores</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-surface-raised border border-halloween-border text-xs">
            <Flame className="w-4 h-4 text-halloween-orange" />
            <span className="font-mono font-bold text-halloween-orange">{state.total_cheers}</span>
            <span className="hidden sm:inline text-halloween-muted">reacciones</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-surface-raised border border-halloween-border text-gray-400 hover:text-white transition-colors"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Auditorium Projection Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-20 relative">
        {state.stage_status === 'podium' ? (
          /* Podium Winners View */
          <div className="w-full max-w-6xl space-y-8 animate-fade-in text-center">
            <div className="space-y-2">
              <span className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Veredicto del Público FMVZ</span>
              </span>
              <h1 className="font-display font-black text-4xl sm:text-6xl text-white">
                👑 Podio de Ganadores en Vivo
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6">
              {/* 2nd Place */}
              {topParticipants[1] && (
                <div className="glass-panel p-6 rounded-3xl border border-gray-400/40 text-center space-y-4 order-2 md:order-1 h-[420px] flex flex-col justify-between">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gray-400/20 text-gray-200 font-black text-xl flex items-center justify-center border border-gray-400">
                    2º
                  </div>
                  <div className="relative w-40 h-40 mx-auto rounded-2xl overflow-hidden border-2 border-gray-400/50 bg-[#080A12] flex items-center justify-center shadow-lg">
                    <img
                      src={topParticipants[1].photo_thumbnail_key || topParticipants[1].photo_original_key}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-md opacity-40"
                    />
                    <img
                      src={topParticipants[1].photo_original_key}
                      alt={topParticipants[1].costume_title}
                      className="relative z-10 max-h-full max-w-full object-contain p-1"
                    />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-white truncate">
                      {topParticipants[1].costume_title}
                    </h3>
                    <p className="text-xs text-halloween-muted">{topParticipants[1].public_display_name}</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-surface-raised border border-halloween-border font-mono text-sm text-halloween-lavender">
                    {topParticipants[1].total_votes ?? topParticipants[1].live_yes_votes ?? 0} Votos
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topParticipants[0] && (
                <div className="glass-panel p-8 rounded-3xl border-2 border-amber-500/60 shadow-[0_0_50px_rgba(245,158,11,0.4)] text-center space-y-4 order-1 md:order-2 h-[500px] flex flex-col justify-between bg-gradient-to-b from-[#1F1910] to-[#121528]">
                  <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/30 text-amber-300 font-black text-2xl flex items-center justify-center border-2 border-amber-400 shadow-glow-orange animate-bounce">
                    👑 1º
                  </div>
                  <div className="relative w-52 h-52 mx-auto rounded-2xl overflow-hidden border-4 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)] bg-[#080A12] flex items-center justify-center">
                    <img
                      src={topParticipants[0].photo_thumbnail_key || topParticipants[0].photo_original_key}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-md opacity-40"
                    />
                    <img
                      src={topParticipants[0].photo_original_key}
                      alt={topParticipants[0].costume_title}
                      className="relative z-10 max-h-full max-w-full object-contain p-2"
                    />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-2xl text-amber-200">
                      {topParticipants[0].costume_title}
                    </h3>
                    <p className="text-sm text-halloween-white">{topParticipants[0].public_display_name}</p>
                  </div>
                  <div className="px-6 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/50 font-mono text-lg text-amber-300 font-bold">
                    {topParticipants[0].total_votes ?? topParticipants[0].live_yes_votes ?? 0} Votos de la Comunidad
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topParticipants[2] && (
                <div className="glass-panel p-6 rounded-3xl border border-amber-700/40 text-center space-y-4 order-3 h-[400px] flex flex-col justify-between">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-800/20 text-amber-400 font-black text-xl flex items-center justify-center border border-amber-700/50">
                    3º
                  </div>
                  <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-amber-700/50 bg-[#080A12] flex items-center justify-center shadow-md">
                    <img
                      src={topParticipants[2].photo_thumbnail_key || topParticipants[2].photo_original_key}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-md opacity-40"
                    />
                    <img
                      src={topParticipants[2].photo_original_key}
                      alt={topParticipants[2].costume_title}
                      className="relative z-10 max-h-full max-w-full object-contain p-1"
                    />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-white truncate">
                      {topParticipants[2].costume_title}
                    </h3>
                    <p className="text-xs text-halloween-muted">{topParticipants[2].public_display_name}</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-surface-raised border border-halloween-border font-mono text-sm text-halloween-lavender">
                    {topParticipants[2].total_votes ?? topParticipants[2].live_yes_votes ?? 0} Votos
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : participant ? (
          /* Stage Active Participant View - Dual-layer Smart Image Display */
          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Costume Photo - 100% Uncropped Dual Layer */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-lg h-[460px] sm:h-[540px] rounded-3xl overflow-hidden border-2 border-halloween-purple/60 shadow-[0_0_50px_rgba(139,92,246,0.35)] bg-[#080A12] flex items-center justify-center group">
                {/* Ambient Blurred Background (Matches costume palette) */}
                <img
                  src={participant.photo_thumbnail_key || participant.photo_original_key}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none select-none transition-all duration-700"
                />

                {/* Foreground: Complete Uncropped Costume Photo */}
                <img
                  src={participant.photo_original_key}
                  alt={participant.costume_title}
                  className="relative z-10 max-h-full max-w-full object-contain p-3 drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)] transition-transform duration-500 group-hover:scale-[1.02]"
                />

                {/* Soft Bottom Vignette */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#080A12]/95 via-[#080A12]/60 to-transparent z-15 pointer-events-none" />

                {/* Participant Number Badge */}
                <div className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-2xl bg-[#080A12]/90 border border-halloween-orange/60 text-white font-mono font-black text-lg shadow-lg flex items-center gap-2 backdrop-blur-md">
                  <span className="text-halloween-orange">#</span>
                  <span>{String(participant.contest_number).padStart(2, '0')}</span>
                </div>

                {/* Category Pill */}
                <div className="absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-xl bg-halloween-purple/90 border border-purple-400/40 text-white text-xs font-bold uppercase tracking-wider shadow-md backdrop-blur-md">
                  {participant.participant_type === 'student' ? 'Estudiante FMVZ' : 'Trabajador FMVZ'}
                </div>

                {/* Bottom title overlay */}
                <div className="absolute bottom-4 left-5 right-5 z-20">
                  <h2 className="font-display font-black text-2xl sm:text-3xl text-white drop-shadow-md truncate">
                    {participant.costume_title}
                  </h2>
                  <p className="text-sm text-halloween-lavender drop-shadow truncate mt-0.5">
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
                <div className="glass-panel p-6 sm:p-8 rounded-3xl border-2 border-halloween-orange shadow-glow-orange space-y-5 bg-gradient-to-br from-[#1C130D] to-[#121528] animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-halloween-orange/20 border border-halloween-orange text-halloween-orange flex items-center justify-center animate-spin-slow">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs text-halloween-orange font-bold uppercase tracking-wider block">
                          ¡Votación Abierta!
                        </span>
                        <strong className="text-xl sm:text-2xl text-white font-display">
                          ¡Vota Ahora!
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

                  {/* Audience Call to Action during Voting */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-halloween-orange/20 via-black/60 to-purple-900/30 border border-halloween-orange/60 shadow-glow-orange flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-halloween-orange font-bold text-xs uppercase tracking-wider animate-pulse">
                        <Radio className="w-4 h-4 text-halloween-orange" />
                        <span>Urna Electrónica Abierta</span>
                      </div>
                      <span className="text-xs text-gray-200 block">
                        Vota en secreto desde tu celular escaneando el código QR
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold text-xs">
                        Recibiendo votos...
                      </span>
                    </div>
                  </div>
                </div>
              ) : state.stage_status === 'voting_closed' ? (
                <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-halloween-purple/50 shadow-glow-purple space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-red-400 font-bold uppercase tracking-wider block">
                        Votación Concluida
                      </span>
                      <strong className="text-2xl sm:text-3xl text-white font-display">
                        Se finalizó el tiempo de votar
                      </strong>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono font-bold text-sm flex items-center gap-2">
                      <span>🔒 Votos Registrados</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-200">
                    Se han juntado los votos de la comunidad universitaria con éxito. Los resultados oficiales se mantendrán en secreto hasta la ceremonia de premiación.
                  </p>
                  <p className="text-xs text-halloween-muted">
                    El moderador pasará al siguiente participante en unos momentos...
                  </p>
                </div>
              ) : (
                <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-halloween-border text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-halloween-purple/20 text-halloween-lavender flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-halloween-orange" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-white">
                      Participante en Pasarela
                    </h3>
                    <p className="text-xs text-halloween-muted mt-1 max-w-md mx-auto">
                      El jurado y el público observan el disfraz. En unos momentos el moderador abrirá el botón de votación en sus celulares.
                    </p>
                  </div>
                </div>
              )}

              {/* Side Live QR Card for Audience Scanning in Auditorium */}
              <div className="p-4 rounded-2xl bg-[#0B0E1E] border border-halloween-border flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-halloween-orange uppercase tracking-wider block">
                    ¿Estás en el público?
                  </span>
                  <p className="text-xs text-white font-medium">
                    Escanea para votar por este disfraz en tiempo real
                  </p>
                  <span className="font-mono text-[11px] text-halloween-lavender block">
                    {voterUrl}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-xl shadow-lg border-2 border-halloween-orange flex-shrink-0">
                  <CustomQrWithLogo
                    size={110}
                    showLogo={false}
                    showActions={false}
                    url={voterUrl}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Waiting Stage / Contest Opening - Big High Contrast Auditorium QR Showcase */
          <div className="text-center space-y-8 max-w-3xl animate-fade-in py-6">
            <div className="w-20 h-20 rounded-3xl bg-halloween-purple/20 text-halloween-lavender flex items-center justify-center mx-auto border border-halloween-purple/40 shadow-glow-purple">
              <Sparkles className="w-10 h-10 text-halloween-orange animate-spin-slow" />
            </div>

            <div className="space-y-3">
              <span className="px-4 py-1 rounded-full bg-halloween-orange/20 border border-halloween-orange/40 text-halloween-orange text-xs font-bold uppercase tracking-wider inline-block">
                FMVZ UNAM · Segundo Concurso de Disfraces
              </span>
              <h1 className="font-display font-black text-4xl sm:text-6xl text-white">
                ¡Prepara tu Celular para Votar!
              </h1>
              <p className="text-base sm:text-lg text-halloween-lavender max-w-xl mx-auto">
                Escanea el código QR en pantalla para ingresar a la votación en tiempo real. Calificarás a cada participante en cuanto suba a la pasarela.
              </p>
            </div>

            {/* Giant Crisp White QR Card for Instant Audience Scanning */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border-2 border-halloween-orange shadow-[0_0_60px_rgba(255,116,23,0.45)] max-w-md mx-auto space-y-4 bg-gradient-to-b from-[#18122B] to-[#0A0D1B]">
              <div className="p-3 bg-white rounded-2xl shadow-2xl mx-auto inline-block border-4 border-amber-400">
                <CustomQrWithLogo
                  size={240}
                  showLogo={true}
                  showActions={false}
                  url={voterUrl}
                />
              </div>

              <div className="space-y-1">
                <strong className="text-sm font-mono text-halloween-orange block">
                  {voterUrl}
                </strong>
                <span className="text-xs text-halloween-muted block">
                  Abre la cámara de tu celular y apunta hacia este código
                </span>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/40">
                <Users className="w-4 h-4" />
                <span>{state.connected_clients} espectadores conectados listos para votar</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Footer */}
      <footer className="px-6 py-3 border-t border-halloween-border/60 bg-[#0A0D1B]/95 backdrop-blur-md flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping hidden sm:block" />
          <div>
            <span className="font-display font-bold text-xs sm:text-sm text-white block">
              Votación en Vivo · FMVZ UNAM
            </span>
            <span className="text-[11px] text-halloween-muted">
              Auditorio de la Facultad de Medicina Veterinaria y Zootecnia
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-halloween-muted">
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">
            <strong className="text-emerald-400 font-mono">{state.connected_clients}</strong> conectados
          </span>
        </div>
      </footer>
    </div>
  );
};
