import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ThumbsUp,
  XCircle,
  Radio,
  Flame,
  Award,
  AlertCircle,
  LogOut,
  User,
} from 'lucide-react';
import { EventLogo } from '../components/EventLogo';

interface StoredVoter {
  full_name: string;
  voter_type: 'student' | 'worker';
  institutional_identifier: string;
}

export const LiveVoter: React.FC = () => {
  // Voter identification in localStorage
  const [voter, setVoter] = useState<StoredVoter | null>(() => {
    try {
      const saved = localStorage.getItem('fmvz_voter');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Login form state if not identified
  const [fullName, setFullName] = useState('');
  const [voterType, setVoterType] = useState<'student' | 'worker'>('student');
  const [idNumber, setIdNumber] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Live Stage State
  const [isLiveActive, setIsLiveActive] = useState<boolean | null>(null);
  const [stageStatus, setStageStatus] = useState<string>('waiting');
  const [currentParticipant, setCurrentParticipant] = useState<any>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [hasVotedForCurrent, setHasVotedForCurrent] = useState<boolean>(false);
  const [currentVoteValue, setCurrentVoteValue] = useState<'yes' | 'no' | null>(null);
  const [votingLoading, setVotingLoading] = useState<boolean>(false);
  const [reactionFeedback, setReactionFeedback] = useState<string | null>(null);

  // Track votes recorded per participant during this session
  const votedParticipantsRef = useRef<Set<number>>(new Set());

  // SSE & Fallback
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/live/state');
        if (res.ok) {
          const data = await res.json();
          handleIncomingState(data);
        }
      } catch {}
    };

    fetchState();

    const eventSource = new EventSource('/api/live/stream');

    eventSource.addEventListener('INITIAL_STATE', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        handleIncomingState(data);
      } catch {}
    });

    eventSource.addEventListener('LIVE_STATE_CHANGED', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        handleIncomingState(data);
      } catch {}
    });

    const pollInterval = setInterval(fetchState, 3000);

    return () => {
      eventSource.close();
      clearInterval(pollInterval);
    };
  }, []);

  const handleIncomingState = (data: any) => {
    if (data.is_active !== undefined) {
      setIsLiveActive(Boolean(data.is_active));
    }
    setStageStatus(data.stage_status || 'waiting');
    setSecondsLeft(data.voting_seconds_left || 30);

    // If participant changed, reset voted state for the new one
    if (data.current_participant?.id !== currentParticipant?.id) {
      setCurrentParticipant(data.current_participant);
      const isAlreadyVoted = data.current_participant?.id
        ? votedParticipantsRef.current.has(data.current_participant.id)
        : false;
      setHasVotedForCurrent(isAlreadyVoted);
      if (!isAlreadyVoted) {
        setCurrentVoteValue(null);
      }
    }
  };

  // Voter registration / sign-in
  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanId = idNumber.replace(/\D/g, '');
    if (voterType === 'student' && cleanId.length !== 9) {
      setAuthError('El número de cuenta UNAM debe contener exactamente 9 dígitos.');
      return;
    }
    if (voterType === 'worker' && cleanId.length !== 6) {
      setAuthError('El número de trabajador/nómina debe contener exactamente 6 dígitos.');
      return;
    }
    if (!fullName.trim()) {
      setAuthError('Ingresa tu nombre para identificarte en el evento.');
      return;
    }

    const newVoter: StoredVoter = {
      full_name: fullName.trim(),
      voter_type: voterType,
      institutional_identifier: cleanId,
    };

    localStorage.setItem('fmvz_voter', JSON.stringify(newVoter));
    setVoter(newVoter);
  };

  const handleLogout = () => {
    localStorage.removeItem('fmvz_voter');
    setVoter(null);
  };

  // Cast vote for participant currently on stage
  const handleVote = async (value: 'yes' | 'no') => {
    if (!voter || !currentParticipant || votingLoading) return;

    setVotingLoading(true);
    try {
      const res = await fetch('/api/live/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voter_type: voter.voter_type,
          institutional_identifier: voter.institutional_identifier,
          full_name: voter.full_name,
          vote: value,
        }),
      });

      if (res.ok) {
        votedParticipantsRef.current.add(currentParticipant.id);
        setHasVotedForCurrent(true);
        setCurrentVoteValue(value);

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([40, 60, 40]);
        }
      }
    } catch {
      alert('Error de conexión al emitir tu voto.');
    } finally {
      setVotingLoading(false);
    }
  };

  // Send live reaction emoji to auditorium projector
  const handleSendReaction = async (emoji: string) => {
    setReactionFeedback(emoji);
    setTimeout(() => setReactionFeedback(null), 800);

    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    try {
      await fetch('/api/live/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
    } catch {}
  };

  // If stage is deactivated by admin
  if (isLiveActive === false) {
    return (
      <div className="min-h-screen bg-[#080A12] text-halloween-white p-4 flex flex-col justify-center items-center">
        <div className="w-full max-w-md space-y-6 text-center">
          <EventLogo size="md" className="mx-auto justify-center" />

          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-halloween-border shadow-2xl space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-halloween-orange/20 text-halloween-orange flex items-center justify-center mx-auto border border-halloween-orange/30">
              <Radio className="w-7 h-7" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                Escenario en Pausa
              </span>
              <h1 className="font-display font-black text-xl text-white mt-3">
                Votación en Vivo No Disponible Aún
              </h1>
              <p className="text-xs text-halloween-muted mt-2 leading-relaxed">
                El modo escenario y votación sincronizada en la pasarela será activado por los moderadores el día oficial del evento: <strong>3 de noviembre de 2026</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-raised border border-halloween-border text-xs text-gray-300">
              Puedes emitir tu voto formal y explorar todos los disfraces en la galería pública.
            </div>

            <div className="space-y-2 pt-2">
              <a
                href="/participantes"
                className="w-full block py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-halloween-orange to-amber-600 shadow-glow-orange hover:brightness-110 transition-all text-center"
              >
                Ver Galería y Votar
              </a>
              <a
                href="/"
                className="w-full block py-2.5 rounded-xl font-semibold text-xs text-gray-300 hover:text-white bg-surface-raised border border-halloween-border transition-colors text-center"
              >
                Volver al Inicio
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1. Identification Screen if user hasn't identified
  if (!voter) {
    return (
      <div className="min-h-screen bg-[#080A12] text-halloween-white p-4 flex flex-col justify-center items-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <EventLogo size="lg" className="mx-auto mb-3 justify-center" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-halloween-orange/20 border border-halloween-orange/40 text-halloween-orange text-xs font-bold uppercase tracking-wider mb-2">
              <Radio className="w-3.5 h-3.5" />
              <span>VOTACIÓN EN VIVO · KAHOOT MODE</span>
            </div>
            <h1 className="font-display font-black text-2xl text-white">
              Identifícate para Votar
            </h1>
            <p className="text-xs text-halloween-muted mt-1">
              Ingresa tus datos una sola vez para votar en tiempo real por cada disfraz en la pasarela.
            </p>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-halloween-purple/40 shadow-glow-purple space-y-5">
            {authError && (
              <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleIdentify} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Tu nombre completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sofía Hernández"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-white text-xs sm:text-sm focus:outline-none focus:border-halloween-purple"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Tipo de comunidad
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVoterType('student')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      voterType === 'student'
                        ? 'bg-halloween-orange/20 border-halloween-orange text-halloween-orange shadow-sm'
                        : 'bg-surface-raised border-halloween-border text-gray-400'
                    }`}
                  >
                    Estudiante (9 dígitos)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoterType('worker')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      voterType === 'worker'
                        ? 'bg-halloween-purple/20 border-halloween-purple text-halloween-lavender shadow-sm'
                        : 'bg-surface-raised border-halloween-border text-gray-400'
                    }`}
                  >
                    Trabajador (6 dígitos)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  {voterType === 'student' ? 'Número de cuenta (9 dígitos)' : 'Identificador de nómina (6 dígitos)'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={voterType === 'student' ? 9 : 6}
                  placeholder={voterType === 'student' ? '318294012' : '482019'}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-halloween-purple"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-halloween-orange to-amber-600 hover:from-halloween-orange-dark hover:to-halloween-orange shadow-glow-orange transition-all"
              >
                Entrar al Concurso en Vivo
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 2. Synchronized Live Voting Screen
  return (
    <div className="min-h-screen bg-[#080A12] text-halloween-white flex flex-col justify-between max-w-md mx-auto relative select-none">
      {/* Top Header */}
      <header className="p-4 border-b border-halloween-border/60 bg-[#0A0D1B]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <EventLogo size="sm" className="scale-85 origin-left" />

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full bg-surface-raised border border-halloween-border text-[11px] text-gray-300 flex items-center gap-1.5">
            <User className="w-3 h-3 text-halloween-orange" />
            <span className="truncate max-w-[100px]">{voter.full_name.split(' ')[0]}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-surface-raised border border-halloween-border text-gray-400 hover:text-white"
            title="Cambiar usuario"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 flex-1 flex flex-col justify-center space-y-4 z-20">
        {stageStatus === 'podium' ? (
          /* Podium Screen */
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/50 shadow-glow-orange text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center border-2 border-amber-400 text-3xl">
              👑
            </div>
            <h2 className="font-display font-black text-2xl text-white">
              ¡Concurso Finalizado!
            </h2>
            <p className="text-xs text-halloween-lavender">
              Observa la pantalla gigante del auditorio para ver los disfraces ganadores de los premios oficiales.
            </p>
          </div>
        ) : currentParticipant ? (
          /* Active Participant Card */
          <div className="space-y-4 animate-fade-in">
            {/* Participant Card */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-halloween-purple/50 bg-[#121528] shadow-glow-purple">
              <div className="aspect-[4/3] w-full relative">
                <img
                  src={currentParticipant.photo_original_key}
                  alt={currentParticipant.costume_title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080A12] via-transparent to-transparent opacity-80" />

                {/* Number & Type Badge */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-black/80 border border-halloween-orange/60 text-white font-mono font-black text-sm">
                  #{String(currentParticipant.contest_number).padStart(2, '0')}
                </div>

                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-lg bg-halloween-purple text-white text-[10px] font-bold uppercase">
                  {currentParticipant.participant_type === 'student' ? 'Estudiante' : 'Trabajador'}
                </div>

                <div className="absolute bottom-3 left-4 right-4">
                  <h2 className="font-display font-black text-xl text-white leading-tight">
                    {currentParticipant.costume_title}
                  </h2>
                  <p className="text-xs text-halloween-lavender">
                    {currentParticipant.public_display_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Voting Action Section */}
            {stageStatus === 'voting_open' ? (
              <div className="space-y-3">
                {hasVotedForCurrent ? (
                  <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500 text-center space-y-1 shadow-glow-orange animate-pulse">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <h3 className="font-display font-black text-lg text-emerald-200">
                      {currentVoteValue === 'yes' ? '¡Voto Emitido (SÍ)! 🎃' : 'Decidiste Pasar'}
                    </h3>
                    <p className="text-[11px] text-gray-300">
                      Tu voto fue registrado en tiempo real en la pantalla del escenario.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <button
                      onClick={() => handleVote('yes')}
                      disabled={votingLoading}
                      className="w-full py-4 px-6 rounded-2xl font-display font-black text-lg text-white bg-gradient-to-r from-halloween-orange via-amber-500 to-halloween-orange shadow-glow-orange hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 animate-bounce-subtle"
                    >
                      <ThumbsUp className="w-6 h-6" />
                      <span>¡VOTAR POR ESTE DISFRAZ!</span>
                    </button>

                    <button
                      onClick={() => handleVote('no')}
                      disabled={votingLoading}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-400 bg-surface-raised border border-halloween-border hover:text-white transition-colors"
                    >
                      No votar / Pasar al siguiente
                    </button>
                  </div>
                )}
              </div>
            ) : stageStatus === 'voting_closed' ? (
              <div className="p-4 rounded-2xl bg-surface-raised border border-halloween-border text-center space-y-1">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                  Votación Cerrada
                </span>
                <p className="text-xs text-halloween-muted">
                  El presentador está por llamar al siguiente participante...
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-surface-raised border border-halloween-border text-center space-y-1">
                <span className="text-xs font-bold text-halloween-lavender uppercase tracking-wider block">
                  En el Escenario
                </span>
                <p className="text-xs text-halloween-muted">
                  Mira la pasarela. La votación se abrirá en unos instantes.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Waiting for Host */
          <div className="glass-panel p-8 rounded-3xl border border-halloween-border text-center space-y-3">
            <Sparkles className="w-10 h-10 text-halloween-orange mx-auto animate-spin-slow" />
            <h2 className="font-display font-black text-xl text-white">
              Esperando al presentador...
            </h2>
            <p className="text-xs text-halloween-muted">
              En cuanto el moderador suba al primer concursante al escenario, aparecerá automáticamente aquí.
            </p>
          </div>
        )}
      </main>

      {/* Floating Reaction Animation Popup */}
      {reactionFeedback && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl animate-ping pointer-events-none z-50">
          {reactionFeedback}
        </div>
      )}

      {/* Bottom Audience Reaction Toolbar (Kahoot / Twitch style) */}
      <footer className="p-3 border-t border-halloween-border/60 bg-[#0A0D1B]/95 backdrop-blur-md sticky bottom-0 z-30">
        <span className="text-[10px] text-halloween-muted text-center block mb-2 font-semibold">
          ENVÍA REACCIONES A LA PANTALLA GIGANTE
        </span>
        <div className="grid grid-cols-5 gap-2">
          {[
            { emoji: '🎃', label: 'Calabaza' },
            { emoji: '🔥', label: 'Fuego' },
            { emoji: '👏', label: 'Bravo' },
            { emoji: '💀', label: 'Miedo' },
            { emoji: '⭐', label: 'Top' },
          ].map((item) => (
            <button
              key={item.emoji}
              onClick={() => handleSendReaction(item.emoji)}
              className="py-2.5 rounded-2xl bg-surface-raised border border-halloween-border hover:border-halloween-orange text-2xl active:scale-90 transition-all flex flex-col items-center justify-center shadow-sm"
              title={item.label}
            >
              <span>{item.emoji}</span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};
