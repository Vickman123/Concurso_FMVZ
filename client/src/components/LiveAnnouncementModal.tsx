import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Radio,
  X,
  Sparkles,
  Smartphone,
  Tv,
  ArrowRight,
  Flame,
  ThumbsUp,
  Clock,
} from 'lucide-react';
import { useContest } from '../context/ContestContext';

interface LiveStageInfo {
  stage_status: string;
  current_participant: {
    id: number;
    contest_number: number;
    costume_title: string;
    public_display_name: string;
    photo_thumbnail_key?: string;
    photo_original_key: string;
  } | null;
  voting_seconds_left: number;
  connected_clients: number;
}

export const LiveAnnouncementModal: React.FC = () => {
  const { isLiveActive } = useContest();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('fmvz_live_popup_dismissed') === 'true';
  });
  const [stageInfo, setStageInfo] = useState<LiveStageInfo | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Do not show on live stage pages or admin panel
  const isAlreadyOnLivePage =
    location.pathname.startsWith('/en-vivo') ||
    location.pathname.startsWith('/proyector') ||
    location.pathname.startsWith('/votar/en-vivo') ||
    location.pathname.startsWith('/admin');

  // Fetch live stage snapshot when active
  useEffect(() => {
    if (!isLiveActive) {
      setIsOpen(false);
      return;
    }

    const fetchLiveInfo = async () => {
      try {
        const res = await fetch('/api/live/state');
        if (res.ok) {
          const data = await res.json();
          setStageInfo({
            stage_status: data.stage_status || 'waiting',
            current_participant: data.current_participant || null,
            voting_seconds_left: data.voting_seconds_left || 30,
            connected_clients: data.connected_clients || 1,
          });
        }
      } catch {
        // silent fallback
      }
    };

    fetchLiveInfo();
    const interval = setInterval(fetchLiveInfo, 8000);

    return () => clearInterval(interval);
  }, [isLiveActive]);

  // Trigger modal when live becomes active and user hasn't dismissed it in this session
  useEffect(() => {
    if (isLiveActive && !isDismissed && !isAlreadyOnLivePage) {
      // Small delay so entrance animation feels natural after page loads
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [isLiveActive, isDismissed, isAlreadyOnLivePage]);

  const isMobile =
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

  const handleDismiss = () => {
    setIsOpen(false);
    setIsDismissed(true);
    sessionStorage.setItem('fmvz_live_popup_dismissed', 'true');
  };

  const handleJoin = (targetRoute: string) => {
    setIsJoining(true);

    // Launch celebratory join confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF7417', '#8B5CF6', '#FFA439', '#FFFFFF'],
      });
    } catch {}

    setTimeout(() => {
      setIsOpen(false);
      setIsJoining(false);
      navigate(targetRoute);
    }, 450);
  };

  const handlePrimaryJoin = () => {
    handleJoin(isMobile ? '/votar/en-vivo' : '/en-vivo');
  };

  if (!isLiveActive || isAlreadyOnLivePage) {
    return null;
  }

  return (
    <>
      {/* 1. Full Screen Announcement Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border-2 border-halloween-orange shadow-[0_0_50px_rgba(255,116,23,0.4)] bg-gradient-to-b from-[#181126] via-[#101322] to-[#0A0D18] text-white overflow-hidden animate-scale-up">
            
            {/* Glowing background aura */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-halloween-orange/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-halloween-purple/30 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-xl bg-surface text-gray-400 hover:text-white hover:bg-surface-raised transition-colors border border-halloween-border z-10"
              title="Cerrar y continuar navegando"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header: Live Badge */}
            <div className="space-y-3 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/25 border border-red-500/50 text-red-400 text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
                <Radio className="w-3.5 h-3.5" />
                <span>¡EN VIVO EN EL AUDITORIO FMVZ!</span>
              </div>

              <h2 className="font-display font-black text-2xl sm:text-3xl text-white leading-tight">
                ¡Estamos en vivo en el evento!
              </h2>

              <p className="text-sm text-halloween-lavender leading-relaxed">
                Únete ahora para participar en el <strong>Segundo Concurso de Disfraces</strong> y calificar a cada participante en tiempo real directamente desde tu teléfono.
              </p>
            </div>

            {/* Currently on Stage Showcase Card */}
            {stageInfo?.current_participant ? (
              <div className="my-5 p-3.5 sm:p-4 rounded-2xl bg-[#090C19]/90 border border-halloween-purple/50 shadow-md flex items-center gap-3.5 relative z-10">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-halloween-orange/60 bg-[#080A12] flex items-center justify-center flex-shrink-0 shadow-inner">
                  {/* Backdrop blur */}
                  <img
                    src={stageInfo.current_participant.photo_thumbnail_key || stageInfo.current_participant.photo_original_key}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40"
                  />
                  {/* Foreground full costume */}
                  <img
                    src={stageInfo.current_participant.photo_original_key}
                    alt={stageInfo.current_participant.costume_title}
                    className="relative z-10 max-h-full max-w-full object-contain p-0.5"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-halloween-orange text-black font-mono font-black text-[10px]">
                      #{String(stageInfo.current_participant.contest_number).padStart(2, '0')}
                    </span>
                    <span className="text-[11px] font-bold text-halloween-orange uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      En la pasarela ahora
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-white truncate">
                    {stageInfo.current_participant.costume_title}
                  </h3>
                  <p className="text-xs text-halloween-muted truncate">
                    Por {stageInfo.current_participant.public_display_name}
                  </p>

                  {stageInfo.stage_status === 'voting_open' && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold animate-pulse">
                      <Clock className="w-3 h-3" />
                      <span>¡Votación abierta ahora mismo!</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="my-5 p-4 rounded-2xl bg-[#090C19]/90 border border-halloween-border flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-halloween-purple/20 text-halloween-orange flex items-center justify-center flex-shrink-0 border border-halloween-purple/40">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="text-xs">
                  <strong className="block text-white font-semibold">
                    Pasarela en Vivo en Marcha
                  </strong>
                  <span className="text-halloween-muted">
                    Los concursantes están desfilando en el escenario del auditorio.
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons with Join Animation */}
            <div className="space-y-3 relative z-10">
              <button
                onClick={handlePrimaryJoin}
                disabled={isJoining}
                className="w-full py-4 px-6 rounded-2xl font-display font-black text-base text-white bg-gradient-to-r from-halloween-orange via-amber-500 to-halloween-orange hover:brightness-110 shadow-[0_0_30px_rgba(255,116,23,0.6)] active:scale-95 transition-all flex items-center justify-center gap-3 border border-amber-300/40 animate-bounce-subtle cursor-pointer"
              >
                {isMobile ? <Smartphone className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
                <span>
                  {isJoining
                    ? '¡Entrando a votar...!'
                    : isMobile
                    ? '📱 ¡ENTRAR A VOTAR EN VIVO!'
                    : '⭐ ¡UNIRME AL ESCENARIO EN VIVO!'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                {isMobile ? (
                  <button
                    onClick={() => handleJoin('/en-vivo?view=projector')}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-surface-raised border border-halloween-border hover:border-halloween-orange transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Tv className="w-4 h-4 text-halloween-orange" />
                    <span>Ver Proyector Auditorio</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoin('/votar/en-vivo')}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-surface-raised border border-halloween-border hover:border-halloween-orange transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-halloween-orange" />
                    <span>Control de Celular</span>
                  </button>
                )}

                <button
                  onClick={handleDismiss}
                  className="py-2.5 px-3 rounded-xl text-xs font-medium text-halloween-muted hover:text-white bg-surface-raised/60 border border-halloween-border transition-colors text-center cursor-pointer"
                >
                  Continuar navegando
                </button>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-4 pt-3 border-t border-halloween-border/60 text-center relative z-10">
              <span className="text-[11px] text-halloween-muted flex items-center justify-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-halloween-orange" />
                Votación abierta a estudiantes y personal de la comunidad FMVZ
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Persistent Mini Pill (When dismissed, so user can re-open or jump in at any time) */}
      {!isOpen && isDismissed && (
        <aside
          aria-label="Acceso rápido al evento en vivo"
          className="fixed bottom-20 md:bottom-6 right-4 z-40 animate-bounce-subtle"
        >
          <button
            onClick={handlePrimaryJoin}
            className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(239,68,68,0.6)] hover:brightness-110 active:scale-95 transition-all border border-amber-300/40 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <Radio className="w-3.5 h-3.5" />
            <span>{isMobile ? 'EN VIVO: Entrar a Votar' : 'EN VIVO: Entrar al Escenario'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </aside>
      )}
    </>
  );
};
