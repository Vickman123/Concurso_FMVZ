import React, { useEffect, useState, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
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
  Tv,
  ArrowRight,
  Smile,
  ChevronLeft,
  ChevronRight,
  Grid,
  Heart,
  RotateCcw,
  Check,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { EventLogo } from '../components/EventLogo';
import { getApiUrl, getEventSourceUrl } from '../services/api';

interface StoredVoter {
  full_name: string;
  voter_type: 'student' | 'worker';
  institutional_identifier: string;
}

interface LiveParticipant {
  id: number;
  contest_number: number;
  public_display_name: string;
  costume_title: string;
  description?: string;
  participant_type?: string;
  category?: string;
  status?: string;
  photo_original_key: string;
  photo_thumbnail_key?: string;
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

  // Login form state if not identified (only community type and account number)
  const [voterType, setVoterType] = useState<'student' | 'worker'>('student');
  const [idNumber, setIdNumber] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Live Stage State (1-a-1 Stage)
  const [isLiveActive, setIsLiveActive] = useState<boolean | null>(null);
  const [stageStatus, setStageStatus] = useState<string>('waiting');
  const [currentParticipant, setCurrentParticipant] = useState<any>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [liveVotes, setLiveVotes] = useState<number>(0);
  const [currentVoteValue, setCurrentVoteValue] = useState<'yes' | 'no' | null>(null);
  const [votingLoading, setVotingLoading] = useState<boolean>(false);
  const [reactionFeedback, setReactionFeedback] = useState<string | null>(null);
  const [justJoined, setJustJoined] = useState<boolean>(false);

  // Massive Live Voting State (Tinder-style for all participants)
  const [isMassiveActive, setIsMassiveActive] = useState<boolean>(false);
  const [allParticipants, setAllParticipants] = useState<LiveParticipant[]>([]);
  const [massiveVotes, setMassiveVotes] = useState<Record<number, 'yes' | 'no'>>({});
  const [massiveIndex, setMassiveIndex] = useState<number>(0);
  const [massiveLoading, setMassiveLoading] = useState<boolean>(false);
  const [showQuickGrid, setShowQuickGrid] = useState<boolean>(false);
  const [massiveSuccessFeedback, setMassiveSuccessFeedback] = useState<string | null>(null);

  // Approved participants list for massive voting
  const massiveList = useMemo(() => {
    const approved = allParticipants.filter((p) => p.status === 'approved');
    if (approved.length > 0) return approved;
    return allParticipants;
  }, [allParticipants]);

  // Fetch state snapshot & SSE stream
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch(getApiUrl('/api/live/state'));
        if (res.ok) {
          const data = await res.json();
          handleIncomingState(data);
        }
      } catch {}
    };

    fetchState();

    const eventSource = new EventSource(getEventSourceUrl('/api/live/stream'));

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

    eventSource.addEventListener('LIVE_VOTE_UPDATED', (e: MessageEvent) => {
      try {
        const tally = JSON.parse(e.data);
        if (tally.yes_count !== undefined) {
          setLiveVotes(tally.yes_count);
        }
      } catch {}
    });

    // Fallback poll every 2s
    const pollInterval = setInterval(fetchState, 2000);

    return () => {
      eventSource.close();
      clearInterval(pollInterval);
    };
  }, []);

  // Fetch user's massive votes when identified or when massive voting becomes active
  useEffect(() => {
    if (!voter) return;

    const fetchMassiveVotes = async () => {
      try {
        const params = new URLSearchParams({
          voter_type: voter.voter_type,
          institutional_identifier: voter.institutional_identifier,
        });
        const res = await fetch(getApiUrl(`/api/live/massive-user-votes?${params.toString()}`));
        if (res.ok) {
          const data = await res.json();
          if (data.votes) {
            setMassiveVotes(data.votes);
          }
        }
      } catch {}
    };

    fetchMassiveVotes();
  }, [voter, isMassiveActive]);

  const handleIncomingState = (data: any) => {
    if (data.is_active !== undefined) {
      setIsLiveActive(Boolean(data.is_active));
    }
    if (data.is_massive_active !== undefined) {
      setIsMassiveActive(Boolean(data.is_massive_active));
    }
    setStageStatus(data.stage_status || 'waiting');
    setSecondsLeft(data.voting_seconds_left || 30);

    if (data.current_votes?.yes_count !== undefined) {
      setLiveVotes(data.current_votes.yes_count);
    }

    if (Array.isArray(data.participants)) {
      setAllParticipants(data.participants);
    }

    // If stage participant changed, reset counts for the new participant
    if (data.current_participant?.id !== currentParticipant?.id) {
      setCurrentParticipant(data.current_participant);
      setCurrentVoteValue(null);
    }
  };

  // Voter registration / sign-in with join animation
  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanId = idNumber.replace(/\D/g, '');
    if (voterType === 'student' && cleanId.length !== 9) {
      setAuthError('El número de cuenta UNAM de alumno debe contener exactamente 9 dígitos.');
      return;
    }
    if (voterType === 'worker' && (cleanId.length < 6 || cleanId.length > 9)) {
      setAuthError('El identificador o cuenta de profesor debe contener entre 6 y 9 dígitos.');
      return;
    }

    const resolvedName = voterType === 'student' ? `Alumno (${cleanId})` : `Profesor (${cleanId})`;

    const newVoter: StoredVoter = {
      full_name: resolvedName,
      voter_type: voterType,
      institutional_identifier: cleanId,
    };

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF7417', '#8B5CF6', '#FFA439', '#FFFFFF'],
      });
    } catch {}

    setJustJoined(true);
    setTimeout(() => {
      localStorage.setItem('fmvz_voter', JSON.stringify(newVoter));
      setVoter(newVoter);
      setJustJoined(false);
    }, 400);
  };

  const handleLogout = () => {
    localStorage.removeItem('fmvz_voter');
    setVoter(null);
  };

  // Cast 1 vote for participant currently on stage (1-on-1 mode)
  const handleVote = async (value: 'yes' | 'no') => {
    if (!voter || !currentParticipant || votingLoading) return;

    setVotingLoading(true);
    setCurrentVoteValue(value);

    if (value === 'yes') {
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
      try {
        confetti({
          particleCount: 40,
          spread: 65,
          origin: { y: 0.7 },
          colors: ['#10B981', '#FF7417', '#8B5CF6'],
        });
      } catch {}
    }

    try {
      await fetch(getApiUrl('/api/live/vote'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voter_type: voter.voter_type,
          institutional_identifier: voter.institutional_identifier,
          full_name: voter.full_name,
          vote: value,
        }),
      });
    } catch {
      // silent fallback
    } finally {
      setVotingLoading(false);
    }
  };

  // Cast vote in Massive Voting Mode (Tinder-style)
  const handleMassiveVote = async (participantId: number, value: 'yes' | 'no') => {
    if (!voter || massiveLoading) return;

    setMassiveLoading(true);

    // Optimistic state update
    setMassiveVotes((prev) => ({ ...prev, [participantId]: value }));

    if (value === 'yes') {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10B981', '#FF7417', '#8B5CF6'],
        });
      } catch {}
      setMassiveSuccessFeedback('💚 ¡Voto a favor registrado!');
    } else {
      setMassiveSuccessFeedback('⚪ Disfraz pasado (sin voto)');
    }

    setTimeout(() => {
      setMassiveSuccessFeedback(null);
    }, 1200);

    try {
      await fetch(getApiUrl('/api/live/massive-vote'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voter_type: voter.voter_type,
          institutional_identifier: voter.institutional_identifier,
          full_name: voter.full_name,
          participant_id: participantId,
          vote: value,
        }),
      });
    } catch {
      // silent fallback
    } finally {
      setMassiveLoading(false);
      // Auto advance to next card after decision
      setTimeout(() => {
        setMassiveIndex((prev) => Math.min(massiveList.length - 1, prev + 1));
      }, 250);
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
      await fetch(getApiUrl('/api/live/reaction'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
    } catch {}
  };

  // 1. Identification Screen if user hasn't identified
  if (!voter) {
    return (
      <div className="min-h-screen bg-[#080A12] text-halloween-white p-4 flex flex-col justify-center items-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <EventLogo size="lg" className="mx-auto mb-3 justify-center" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-halloween-orange/20 border border-halloween-orange/40 text-halloween-orange text-xs font-bold uppercase tracking-wider mb-2">
              <Radio className="w-3.5 h-3.5" />
              <span>VOTACIÓN EN VIVO · FMVZ UNAM</span>
            </div>
            <h1 className="font-display font-black text-2xl text-white">
              Identifícate para Votar
            </h1>
            <p className="text-xs text-halloween-muted mt-1">
              Selecciona si eres Alumno o Profesor e ingresa tu número de cuenta para calificar en tiempo real en la pasarela.
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
                <label className="block text-gray-300 font-semibold mb-1.5">
                  ¿Eres Alumno o Profesor?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setVoterType('student'); setAuthError(null); }}
                    className={`py-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      voterType === 'student'
                        ? 'bg-halloween-orange/20 border-halloween-orange text-halloween-orange shadow-glow-orange scale-[1.02]'
                        : 'bg-surface-raised border-halloween-border text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-base">🎓</span>
                    <span>Alumno FMVZ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setVoterType('worker'); setAuthError(null); }}
                    className={`py-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      voterType === 'worker'
                        ? 'bg-halloween-purple/20 border-halloween-purple text-halloween-lavender shadow-glow-purple scale-[1.02]'
                        : 'bg-surface-raised border-halloween-border text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-base">👨‍🏫</span>
                    <span>Profesor / Personal</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  {voterType === 'student' ? 'Número de cuenta UNAM (9 dígitos)' : 'Número de cuenta o nómina (6 a 9 dígitos)'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={9}
                  placeholder={voterType === 'student' ? 'Ej. 318294012' : 'Ej. 482019'}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3.5 rounded-xl bg-surface-raised border border-halloween-border text-white font-mono text-sm focus:outline-none focus:border-halloween-orange text-center tracking-wider"
                />
                <span className="text-[11px] text-halloween-muted block mt-1 text-center">
                  {voterType === 'student'
                    ? 'Ingresa tu número de cuenta de 9 dígitos sin guiones ni espacios'
                    : 'Ingresa tu número de nómina o cuenta UNAM'}
                </span>
              </div>

              <button
                type="submit"
                disabled={justJoined}
                className="w-full py-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-halloween-orange to-amber-600 hover:from-halloween-orange-dark hover:to-halloween-orange shadow-glow-orange transition-all flex items-center justify-center gap-2 active:scale-95 mt-2 cursor-pointer"
              >
                <span>{justJoined ? '¡Conectando al auditorio...!' : '🎃 Entrar al Concurso en Vivo'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. MASSIVE VOTING MODE (Tinder-Style Experience)
  // -------------------------------------------------------------
  if (isMassiveActive) {
    const currentCard = massiveList[massiveIndex];
    const totalMassive = massiveList.length;

    // Calculate user progress
    let yesCount = 0;
    let noCount = 0;
    for (const p of massiveList) {
      if (massiveVotes[p.id] === 'yes') yesCount++;
      else if (massiveVotes[p.id] === 'no') noCount++;
    }
    const reviewedCount = yesCount + noCount;
    const progressPercent = totalMassive > 0 ? Math.round((reviewedCount / totalMassive) * 100) : 0;
    const currentCardVote = currentCard ? massiveVotes[currentCard.id] : null;

    return (
      <div className="min-h-screen bg-[#080A12] text-halloween-white flex flex-col justify-between max-w-md mx-auto relative select-none">
        {/* Top Header */}
        <header className="p-3.5 border-b border-emerald-500/40 bg-[#0A0D1B]/95 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <EventLogo size="sm" className="scale-85 origin-left" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickGrid(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 hover:text-white flex items-center gap-1.5 text-[11px] font-bold cursor-pointer"
              title="Ver cuadrícula de todos los disfraces"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Lista ({reviewedCount}/{totalMassive})</span>
            </button>

            <div className="px-2.5 py-1 rounded-full bg-surface-raised border border-halloween-border text-[11px] text-gray-300 flex items-center gap-1.5 font-mono">
              <User className="w-3 h-3 text-halloween-orange" />
              <span className="truncate max-w-[100px]">
                {voter.voter_type === 'student' ? '🎓 ' : '👨‍🏫 '}
                {voter.institutional_identifier}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg bg-surface-raised border border-halloween-border text-gray-400 hover:text-white cursor-pointer"
              title="Cambiar usuario"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Massive Mode Glowing Alert Banner */}
        <div className="px-4 pt-3 pb-1">
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-emerald-950/80 border border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold text-xs animate-pulse">
                ⚡
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-emerald-300 tracking-wider block">
                  Votación Masiva Abierta
                </span>
                <span className="text-[10px] text-emerald-200/80">
                  Vota libremente a favor de los que más te gusten.
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-black text-emerald-300">
                💚 {yesCount} votos SÍ
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span>Progreso: {reviewedCount} de {totalMassive} revisados ({progressPercent}%)</span>
              <span className="text-emerald-400 font-bold">Disfraz #{currentCard?.contest_number || massiveIndex + 1}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-raised overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tinder Card Arena */}
        <main className="p-4 flex-1 flex flex-col justify-center space-y-3 z-20">
          {currentCard ? (
            <div className="space-y-3 animate-fade-in">
              {/* Costume Card with Dual Layer Display */}
              <div className={`relative rounded-3xl overflow-hidden border-2 transition-all ${
                currentCardVote === 'yes'
                  ? 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
                  : currentCardVote === 'no'
                  ? 'border-gray-700 opacity-90'
                  : 'border-halloween-purple/60 shadow-glow-purple'
              } bg-[#080A12]`}>
                <div className="relative w-full h-72 sm:h-80 flex items-center justify-center overflow-hidden">
                  {/* Ambient Blurred Backdrop */}
                  <img
                    src={currentCard.photo_thumbnail_key || currentCard.photo_original_key}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                  />

                  {/* Complete Uncropped Image */}
                  <img
                    src={currentCard.photo_original_key}
                    alt={currentCard.costume_title}
                    className="relative z-10 max-h-full max-w-full object-contain p-2 drop-shadow-2xl"
                    onError={(e) => {
                      if (currentCard.photo_thumbnail_key && e.currentTarget.src !== currentCard.photo_thumbnail_key) {
                        e.currentTarget.src = currentCard.photo_thumbnail_key;
                      }
                    }}
                  />

                  {/* Soft Bottom Vignette */}
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#080A12]/95 via-[#080A12]/60 to-transparent z-15 pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 z-20 px-3 py-1 rounded-xl bg-black/85 border border-halloween-orange/60 text-white font-mono font-black text-sm backdrop-blur-md">
                    #{String(currentCard.contest_number).padStart(2, '0')}
                  </div>

                  <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-black/80 border border-halloween-border text-white text-[10px] font-bold uppercase backdrop-blur-md">
                    {massiveIndex + 1} de {totalMassive}
                  </div>

                  {/* Costume Title & Name */}
                  <div className="absolute bottom-3 left-4 right-4 z-20 space-y-0.5">
                    <h2 className="font-display font-black text-xl text-white leading-tight drop-shadow truncate">
                      {currentCard.costume_title}
                    </h2>
                    <p className="text-xs text-halloween-lavender drop-shadow truncate">
                      Por {currentCard.public_display_name}
                    </p>
                    {currentCard.description && (
                      <p className="text-[11px] text-gray-300 line-clamp-1 italic">
                        "{currentCard.description}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Indicator inside Card */}
                <div className="px-4 py-2 border-t border-halloween-border/40 bg-[#0B0E1E] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-gray-400">Tu decisión actual:</span>
                  {currentCardVote === 'yes' ? (
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ¡Votaste a Favor!
                    </span>
                  ) : currentCardVote === 'no' ? (
                    <span className="font-bold text-gray-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      Pasaste este disfraz
                    </span>
                  ) : (
                    <span className="text-amber-400/90 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Aún sin calificar
                    </span>
                  )}
                </div>
              </div>

              {/* Success Feedback Flash */}
              {massiveSuccessFeedback && (
                <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-500 text-center text-xs font-bold text-emerald-300 animate-bounce">
                  {massiveSuccessFeedback}
                </div>
              )}

              {/* Tinder Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleMassiveVote(currentCard.id, 'no')}
                  disabled={massiveLoading}
                  className={`py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    currentCardVote === 'no'
                      ? 'bg-gray-800 text-white border-gray-600 scale-[0.98]'
                      : 'bg-surface-raised border-halloween-border hover:border-red-500/50 text-gray-300 hover:text-red-300'
                  }`}
                >
                  <XCircle className="w-5 h-5 text-gray-400" />
                  <span>Pasar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMassiveVote(currentCard.id, 'yes')}
                  disabled={massiveLoading}
                  className={`py-3.5 px-4 rounded-2xl font-display font-black text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    currentCardVote === 'yes'
                      ? 'bg-emerald-600 border border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-[1.02]'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span>{currentCardVote === 'yes' ? '¡VOTADO SÍ! ✓' : '¡VOTAR A FAVOR!'}</span>
                </button>
              </div>

              {/* Carousel Navigation Bottom Controls */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMassiveIndex((prev) => Math.max(0, prev - 1))}
                  disabled={massiveIndex === 0}
                  className="px-3 py-2 rounded-xl bg-surface-raised border border-halloween-border hover:text-white text-gray-400 disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQuickGrid(true)}
                  className="px-3 py-2 rounded-xl bg-surface-raised border border-halloween-border text-halloween-lavender hover:text-white flex items-center gap-1.5 cursor-pointer text-[11px]"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Ver todos ({totalMassive})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMassiveIndex((prev) => Math.min(totalMassive - 1, prev + 1))}
                  disabled={massiveIndex >= totalMassive - 1}
                  className="px-3 py-2 rounded-xl bg-surface-raised border border-halloween-border hover:text-white text-gray-400 disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Finish Summary Box if reviewed all */}
              {reviewedCount === totalMassive && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 via-emerald-950/50 to-purple-950/70 border border-emerald-500/50 text-center space-y-1.5 animate-fade-in mt-2">
                  <span className="text-xs font-bold text-emerald-300 block">
                    🎉 ¡Has revisado todos los disfraces!
                  </span>
                  <p className="text-[11px] text-gray-300">
                    Has emitido <strong>{yesCount} votos a favor</strong>. Puedes cambiar cualquier decisión volviendo a los disfraces mientras la votación masiva siga abierta.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl border border-halloween-border text-center space-y-3">
              <Sparkles className="w-10 h-10 text-halloween-orange mx-auto animate-spin-slow" />
              <h2 className="font-display font-black text-lg text-white">
                Cargando participantes...
              </h2>
            </div>
          )}
        </main>

        {/* Quick Grid Modal / Bottom Sheet */}
        {showQuickGrid && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-[#0A0D1B] rounded-t-3xl sm:rounded-3xl border border-halloween-border p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between border-b border-halloween-border/60 pb-3">
                <div>
                  <h3 className="font-display font-black text-base text-white">
                    Todos los Disfraces ({totalMassive})
                  </h3>
                  <span className="text-[11px] text-halloween-muted">
                    Toca cualquier número para calificarlo o modificar tu voto
                  </span>
                </div>
                <button
                  onClick={() => setShowQuickGrid(false)}
                  className="p-1.5 rounded-lg bg-surface-raised border border-halloween-border text-gray-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Grid of participants */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto pr-1 flex-1">
                {massiveList.map((p, idx) => {
                  const vote = massiveVotes[p.id];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setMassiveIndex(idx);
                        setShowQuickGrid(false);
                      }}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        vote === 'yes'
                          ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-200'
                          : vote === 'no'
                          ? 'bg-surface-raised border-halloween-border text-gray-400'
                          : 'bg-purple-950/30 border-purple-800/40 text-gray-300'
                      }`}
                    >
                      <img
                        src={p.photo_thumbnail_key || p.photo_original_key}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-black/50"
                      />
                      <div className="truncate flex-1">
                        <span className="font-mono font-bold text-xs block text-white">
                          #{String(p.contest_number).padStart(2, '0')}
                        </span>
                        <strong className="text-[11px] truncate block text-gray-200">
                          {p.costume_title}
                        </strong>
                        <span className="text-[9px] block">
                          {vote === 'yes' ? '💚 Votado Sí' : vote === 'no' ? '⚪ Pasado' : '⏳ Pendiente'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-halloween-border/60 flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  Total: <strong className="text-emerald-400">{yesCount} SÍ</strong> / {totalMassive}
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickGrid(false)}
                  className="px-4 py-2 rounded-xl bg-halloween-orange text-black font-bold cursor-pointer"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reaction Bar Footer */}
        <footer className="p-3 border-t border-halloween-border/60 bg-[#0A0D1B]/95 backdrop-blur-md sticky bottom-0 z-30">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] text-halloween-muted font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-halloween-orange" />
              <span>REACCIONES EN VIVO A LA PANTALLA GIGANTE</span>
            </span>
            <span className="text-[10px] text-halloween-orange font-bold">¡Toca un emoji!</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {[
              { emoji: '🎃', label: 'Calabaza' },
              { emoji: '👻', label: 'Fantasma' },
              { emoji: '💀', label: 'Calavera' },
              { emoji: '🔥', label: 'Fuego' },
              { emoji: '👏', label: 'Aplausos' },
              { emoji: '😻', label: 'Gatito' },
              { emoji: '⭐', label: 'Top' },
            ].map((item) => (
              <button
                key={item.emoji}
                onClick={() => handleSendReaction(item.emoji)}
                className="py-3 rounded-2xl bg-surface-raised border border-halloween-border hover:border-halloween-orange text-2xl sm:text-3xl active:scale-75 hover:scale-110 transition-all flex items-center justify-center shadow-sm cursor-pointer hover:bg-halloween-orange/10"
                title={item.label}
                type="button"
              >
                <span>{item.emoji}</span>
              </button>
            ))}
          </div>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. SYNCHRONIZED 1-ON-1 STAGE MODE (When Massive Voting is Closed)
  // -------------------------------------------------------------

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
                Votación en Vivo en Espera
              </h1>
              <p className="text-xs text-halloween-muted mt-2 leading-relaxed">
                El modo escenario y votación sincronizada en el auditorio será activado en cuanto el comité organizador dé inicio a la pasarela oficial.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-raised border border-halloween-border text-xs text-gray-300">
              Puedes explorar todos los disfraces inscritos en la galería oficial.
            </div>

            <div className="space-y-2 pt-2">
              <a
                href="/participantes"
                className="w-full block py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-halloween-orange to-amber-600 shadow-glow-orange hover:brightness-110 transition-all text-center"
              >
                Ver Galería de Disfraces
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

  return (
    <div className="min-h-screen bg-[#080A12] text-halloween-white flex flex-col justify-between max-w-md mx-auto relative select-none">
      {/* Top Header with User Info & Big Screen Toggle */}
      <header className="p-3.5 border-b border-halloween-border/60 bg-[#0A0D1B]/95 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <EventLogo size="sm" className="scale-85 origin-left" />

        <div className="flex items-center gap-2">
          <a
            href="/en-vivo"
            className="p-1.5 rounded-lg bg-surface-raised border border-halloween-border text-gray-300 hover:text-white flex items-center gap-1 text-[11px]"
            title="Ver pantalla de proyección"
          >
            <Tv className="w-3.5 h-3.5 text-halloween-lavender" />
            <span className="hidden sm:inline">Pantalla</span>
          </a>

          <div className="px-2.5 py-1 rounded-full bg-surface-raised border border-halloween-border text-[11px] text-gray-300 flex items-center gap-1.5 font-mono">
            <User className="w-3 h-3 text-halloween-orange" />
            <span className="truncate max-w-[120px]">
              {voter.voter_type === 'student' ? '🎓 ' : '👨‍🏫 '}
              {voter.institutional_identifier}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-surface-raised border border-halloween-border text-gray-400 hover:text-white cursor-pointer"
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
              Observa la pantalla gigante del auditorio para ver a los concursantes y disfraces ganadores de la FMVZ.
            </p>
          </div>
        ) : currentParticipant ? (
          /* Active Participant Card - Dual Layer Smart Display */
          <div className="space-y-4 animate-fade-in">
            <div className="relative rounded-3xl overflow-hidden border-2 border-halloween-purple/50 bg-[#080A12] shadow-glow-purple">
              <div className="relative w-full h-72 sm:h-80 flex items-center justify-center overflow-hidden">
                {/* Ambient Blurred Background */}
                <img
                  src={currentParticipant.photo_thumbnail_key || currentParticipant.photo_original_key}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                />

                {/* Complete Uncropped Costume Photo */}
                <img
                  src={currentParticipant.photo_original_key}
                  alt={currentParticipant.costume_title}
                  className="relative z-10 max-h-full max-w-full object-contain p-2 drop-shadow-2xl"
                />

                {/* Soft Bottom Vignette */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#080A12]/95 via-[#080A12]/50 to-transparent z-15 pointer-events-none" />

                {/* Number & Type Badge */}
                <div className="absolute top-3 left-3 z-20 px-3 py-1 rounded-xl bg-black/85 border border-halloween-orange/60 text-white font-mono font-black text-sm backdrop-blur-md">
                  #{String(currentParticipant.contest_number).padStart(2, '0')}
                </div>

                <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-halloween-purple/90 border border-purple-400/30 text-white text-[10px] font-bold uppercase backdrop-blur-md">
                  {currentParticipant.participant_type === 'student' ? 'Estudiante' : 'Trabajador'}
                </div>

                {/* Title */}
                <div className="absolute bottom-3 left-4 right-4 z-20">
                  <h2 className="font-display font-black text-xl text-white leading-tight drop-shadow truncate">
                    {currentParticipant.costume_title}
                  </h2>
                  <p className="text-xs text-halloween-lavender drop-shadow truncate">
                    Por {currentParticipant.public_display_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Voting Action Section */}
            {stageStatus === 'voting_open' ? (
              <div className="space-y-3.5">
                {currentVoteValue === 'yes' ? (
                  /* Confirmed Voted YES Card */
                  <div className="p-5 rounded-3xl bg-gradient-to-b from-emerald-950/60 to-surface-card border-2 border-emerald-500/70 shadow-glow-orange text-center space-y-2 animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-400/50">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="font-display font-black text-lg text-emerald-300">
                      ¡Tu voto a favor fue registrado!
                    </h3>
                    <p className="text-xs text-gray-300 leading-relaxed max-w-xs mx-auto">
                      Tu voto está guardado en la urna electrónica. Los resultados se mantendrán en secreto hasta la premiación oficial.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleVote('no')}
                        disabled={votingLoading}
                        className="text-xs text-gray-400 hover:text-white underline font-semibold transition-colors cursor-pointer"
                      >
                        ¿Cambiaste de opinión? Cambiar a Pasar (No votar)
                      </button>
                    </div>
                  </div>
                ) : currentVoteValue === 'no' ? (
                  /* Confirmed PASSED Card */
                  <div className="p-5 rounded-3xl bg-surface-raised border border-halloween-border text-center space-y-2 animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-gray-700/40 text-gray-400 flex items-center justify-center mx-auto">
                      <XCircle className="w-6 h-6" />
                    </div>
                    <h3 className="font-display font-bold text-base text-gray-200">
                      Has decidido no votar por este concursante
                    </h3>
                    <p className="text-xs text-halloween-muted">
                      No se registrará voto de tu cuenta para este disfraz. Esperando al siguiente participante...
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleVote('yes')}
                        disabled={votingLoading}
                        className="text-xs text-halloween-orange hover:text-amber-300 font-bold underline transition-colors cursor-pointer"
                      >
                        Cambiar de opinión y votar a favor
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Initial Decision Buttons (Vote YES or PASS) */
                  <div className="space-y-3">
                    <div className="text-center">
                      <span className="text-xs font-bold text-halloween-orange uppercase tracking-wider block">
                        ⚡ Votación en Curso
                      </span>
                      <p className="text-[11px] text-halloween-muted mt-0.5">
                        Elige si deseas darle tu voto a este participante:
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleVote('yes')}
                      disabled={votingLoading}
                      className="w-full py-4 px-6 rounded-2xl font-display font-black text-lg sm:text-xl text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-110 active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.45)] transition-all flex items-center justify-center gap-3 border border-emerald-300/40 cursor-pointer disabled:opacity-50"
                    >
                      <ThumbsUp className="w-6 h-6" />
                      <span>¡VOTAR A FAVOR DE ESTE DISFRAZ!</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVote('no')}
                      disabled={votingLoading}
                      className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-surface-raised/70 border border-halloween-border hover:border-gray-500 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-gray-500" />
                      <span>Pasar (No votar por este participante)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : stageStatus === 'voting_closed' ? (
              <div className="p-5 rounded-3xl bg-surface-raised border border-halloween-border text-center space-y-2">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                  🔒 Se finalizó el tiempo de votar
                </span>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {currentVoteValue === 'yes' ? (
                    <strong className="text-emerald-400 font-bold block">
                      ✅ Tu voto a favor fue registrado con éxito.
                    </strong>
                  ) : currentVoteValue === 'no' ? (
                    <span className="text-gray-400 block">
                      Decidiste pasar a este concursante.
                    </span>
                  ) : (
                    <span className="text-halloween-muted block">
                      Se han juntado los votos de la comunidad universitaria.
                    </span>
                  )}
                  Los resultados se mantendrán en secreto hasta la ceremonia de premiación.
                </p>
                <p className="text-[11px] text-halloween-muted pt-1">
                  El moderador pasará al siguiente participante en unos momentos...
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-surface-raised border border-halloween-border text-center space-y-1">
                <span className="text-xs font-bold text-halloween-lavender uppercase tracking-wider block">
                  🎭 Concursante en Pasarela
                </span>
                <p className="text-xs text-halloween-muted">
                  Observa la presentación. En cuanto el moderador active la votación, podrás emitir tu voto aquí.
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

      {/* Bottom Audience Reaction Toolbar */}
      <footer className="p-3 border-t border-halloween-border/60 bg-[#0A0D1B]/95 backdrop-blur-md sticky bottom-0 z-30">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] text-halloween-muted font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-halloween-orange" />
            <span>REACCIONES EN VIVO A LA PANTALLA GIGANTE</span>
          </span>
          <span className="text-[10px] text-halloween-orange font-bold">¡Toca un emoji!</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {[
            { emoji: '🎃', label: 'Calabaza' },
            { emoji: '👻', label: 'Fantasma' },
            { emoji: '💀', label: 'Calavera' },
            { emoji: '🔥', label: 'Fuego' },
            { emoji: '👏', label: 'Aplausos' },
            { emoji: '😻', label: 'Gatito' },
            { emoji: '⭐', label: 'Top' },
          ].map((item) => (
            <button
              key={item.emoji}
              onClick={() => handleSendReaction(item.emoji)}
              className="py-3 rounded-2xl bg-surface-raised border border-halloween-border hover:border-halloween-orange text-2xl sm:text-3xl active:scale-75 hover:scale-110 transition-all flex items-center justify-center shadow-sm cursor-pointer hover:bg-halloween-orange/10"
              title={item.label}
              type="button"
            >
              <span>{item.emoji}</span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};
