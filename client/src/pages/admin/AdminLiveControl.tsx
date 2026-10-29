import React, { useState, useEffect } from 'react';
import {
  Radio,
  Play,
  Square,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Users,
  Flame,
  Award,
  Sparkles,
  RotateCcw,
  Clock,
  ThumbsUp,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LiveParticipant {
  id: number;
  contest_number: number;
  public_display_name: string;
  costume_title: string;
  photo_thumbnail_key?: string;
  photo_original_key: string;
  live_yes_votes?: number;
  web_votes?: number;
  total_votes?: number;
}

interface LiveState {
  is_active?: boolean;
  stage_status: 'waiting' | 'presenting' | 'voting_open' | 'voting_closed' | 'podium';
  current_participant_id: number | null;
  current_participant: any;
  voting_seconds_left: number;
  total_cheers: number;
  current_votes: { yes_count: number; no_count: number; total: number };
  participants: LiveParticipant[];
  connected_clients: number;
}

export const AdminLiveControl: React.FC = () => {
  const { token } = useAuth();
  const [state, setState] = useState<LiveState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [votingDuration, setVotingDuration] = useState<number>(30);

  // Fetch current live state
  const fetchState = async () => {
    try {
      const res = await fetch('/api/live/state');
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();

    const eventSource = new EventSource('/api/live/stream');

    eventSource.addEventListener('LIVE_STATE_CHANGED', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setState(data);
      } catch {}
    });

    eventSource.addEventListener('LIVE_VOTE_UPDATED', (e: MessageEvent) => {
      try {
        const tally = JSON.parse(e.data);
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            current_votes: {
              yes_count: tally.yes_count,
              no_count: tally.no_count,
              total: tally.total,
            },
          };
        });
      } catch {}
    });

    const interval = setInterval(fetchState, 3000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, []);

  // Send stage control action
  const sendControlAction = async (payload: any) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/live/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setState(data.state);
      }
    } catch {
      alert('Error al enviar instrucción al escenario');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !state) {
    return (
      <div className="flex items-center justify-center p-12 text-halloween-muted">
        Cargando consola del escenario...
      </div>
    );
  }

  const current = state.current_participant;
  const filteredParticipants = state.participants.filter(
    (p) =>
      p.costume_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.public_display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.contest_number).includes(searchTerm)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-black uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5" />
            <span>Consola de Transmisión en Vivo</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Control del Escenario y Votación Sincrónica
          </h1>
          <p className="text-xs text-halloween-muted mt-1">
            Mueve los participantes en tiempo real, abre periodos de votación sincronizados y proyecta los resultados en vivo.
          </p>
        </div>

        {/* Projector Open Button */}
        <a
          href="/en-vivo"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-halloween-purple to-purple-800 hover:from-halloween-purple-dark hover:to-halloween-purple shadow-glow-purple transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Abrir Pantalla de Proyección (Visor)</span>
        </a>
      </div>

      {/* Master Public Visibility & Activation Control */}
      <div
        className={`p-5 rounded-3xl border transition-all ${
          state.is_active
            ? 'bg-emerald-950/30 border-emerald-500/50 shadow-glow-orange'
            : 'bg-[#15182A] border-halloween-border/90'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-3 rounded-2xl flex-shrink-0 ${
                state.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}
            >
              <Radio className={`w-6 h-6 ${state.is_active ? 'animate-pulse' : ''}`} />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display font-bold text-base text-white">
                  Visibilidad Pública del Escenario:
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                    state.is_active
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
                >
                  {state.is_active ? '🟢 ACTIVO Y VISIBLE AL PÚBLICO' : '🔴 INACTIVO (OCULTO AL PÚBLICO)'}
                </span>
              </div>
              <p className="text-xs text-halloween-muted max-w-2xl leading-relaxed">
                {state.is_active
                  ? 'El Escenario en Vivo se encuentra activo y visible en la barra de navegación. Los asistentes pueden votar en tiempo real.'
                  : 'El Escenario en Vivo está reservado para el 3 de noviembre de 2026. Permanece oculto en el menú principal y formularios hasta que lo actives aquí.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => sendControlAction({ action: 'TOGGLE_LIVE_ACTIVE', is_active: !state.is_active })}
            disabled={actionLoading}
            className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 flex-shrink-0 ${
              state.is_active
                ? 'bg-red-600 hover:bg-red-700 shadow-glow-orange'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 shadow-glow-purple'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{state.is_active ? 'Desactivar Escenario (Ocultar)' : 'Activar Escenario en Vivo'}</span>
          </button>
        </div>
      </div>

      {/* Live Stage Status Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Stage Card */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-6 border border-halloween-purple/50 shadow-glow-purple space-y-6">
          <div className="flex items-center justify-between border-b border-halloween-border/60 pb-4">
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full animate-ping ${
                  state.stage_status === 'voting_open'
                    ? 'bg-emerald-400'
                    : state.stage_status === 'presenting'
                    ? 'bg-halloween-orange'
                    : 'bg-gray-400'
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Estado del Escenario:{' '}
                <span
                  className={
                    state.stage_status === 'voting_open'
                      ? 'text-emerald-400 font-mono font-black'
                      : state.stage_status === 'presenting'
                      ? 'text-halloween-orange'
                      : state.stage_status === 'podium'
                      ? 'text-amber-400'
                      : 'text-gray-400'
                  }
                >
                  {state.stage_status === 'voting_open'
                    ? '⚡ VOTACIÓN ABIERTA'
                    : state.stage_status === 'presenting'
                    ? '👤 PARTICIPANTE PRESENTÁNDOSE'
                    : state.stage_status === 'voting_closed'
                    ? '⛔ VOTACIÓN CERRADA'
                    : state.stage_status === 'podium'
                    ? '👑 PODIO DE GANADORES'
                    : '⏳ EN ESPERA'}
                </span>
              </span>
            </div>

            {/* Stage Audience Stats */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-gray-300">
                <Users className="w-4 h-4 text-halloween-purple-light" />
                <span>{state.connected_clients} en pantalla</span>
              </div>
              <div className="flex items-center gap-1.5 text-halloween-orange">
                <Flame className="w-4 h-4" />
                <span>{state.total_cheers} reacciones</span>
              </div>
            </div>
          </div>

          {/* Current Participant on Stage */}
          {current ? (
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#0B0D1A] p-5 rounded-2xl border border-halloween-border">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-halloween-orange/60 bg-[#080A12] flex items-center justify-center flex-shrink-0 shadow-md">
                <img
                  src={current.photo_thumbnail_key || current.photo_original_key}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40 pointer-events-none"
                />
                <img
                  src={current.photo_original_key}
                  alt={current.costume_title}
                  className="relative z-10 max-h-full max-w-full object-contain p-1 drop-shadow"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="px-3 py-0.5 rounded-lg bg-halloween-orange text-black font-mono font-black text-xs">
                    #{String(current.contest_number).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-halloween-lavender font-semibold">
                    {current.participant_type === 'student' ? 'Estudiante FMVZ' : 'Trabajador FMVZ'}
                  </span>
                </div>

                <h2 className="font-display font-black text-2xl text-white">
                  {current.costume_title}
                </h2>
                <p className="text-xs text-gray-300">
                  Participante: <strong>{current.public_display_name}</strong>
                </p>

                {/* Live votes tally for current */}
                <div className="pt-2 flex items-center justify-center sm:justify-start gap-4">
                  <div className="px-4 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-600 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{state.current_votes.yes_count} Votos SÍ</span>
                  </div>
                  <div className="px-4 py-1.5 rounded-xl bg-surface-raised border border-halloween-border text-gray-400 text-xs font-mono">
                    {state.current_votes.no_count} Pasaron
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#0B0D1A] rounded-2xl border border-dashed border-halloween-border text-halloween-muted text-xs">
              Ningún participante en el escenario actualmente. Selecciona uno abajo o pulsa "Siguiente".
            </div>
          )}

          {/* Duration Selector & Voting Controls */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0B0D1A] border border-halloween-border">
              <div>
                <span className="text-xs font-bold text-white block">
                  ⏱️ Duración de la Votación:
                </span>
                <span className="text-[11px] text-halloween-muted">
                  Selecciona cuántos segundos tendrá el público para votar por cada participante
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[15, 30, 45, 60, 90].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setVotingDuration(sec)}
                    disabled={state.stage_status === 'voting_open'}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      votingDuration === sec
                        ? 'bg-halloween-orange text-black shadow-glow-orange'
                        : 'bg-surface-raised text-gray-400 hover:text-white border border-halloween-border'
                    } disabled:opacity-50`}
                  >
                    {sec}s
                  </button>
                ))}
                <div className="flex items-center gap-1 pl-1">
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={votingDuration}
                    onChange={(e) => setVotingDuration(Math.max(5, Number(e.target.value)))}
                    disabled={state.stage_status === 'voting_open'}
                    className="w-16 px-2 py-1 rounded-xl bg-black border border-halloween-border text-center text-xs font-mono font-bold text-white focus:outline-none focus:border-halloween-orange"
                  />
                  <span className="text-xs text-gray-400">seg</span>
                </div>
              </div>
            </div>

            {/* In-flight Active Timer Controller (if voting is running) */}
            {state.stage_status === 'voting_open' && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/70 shadow-glow-orange flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono font-black text-lg border border-amber-400/50">
                    <Clock className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                      Votación en Curso
                    </span>
                    <span className="text-xs text-white">
                      Puedes aumentar o reducir el tiempo en vivo para este participante:
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => sendControlAction({ action: 'ADJUST_TIMER', delta: 10 })}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <span>+10s</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => sendControlAction({ action: 'ADJUST_TIMER', delta: -10 })}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <span>-10s</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => sendControlAction({ action: 'CLOSE_VOTING' })}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Cerrar Ahora</span>
                  </button>
                </div>
              </div>
            )}

            {/* Big Action Controls */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Navegación del Escenario
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => sendControlAction({ action: 'PREV_PARTICIPANT' })}
                  disabled={actionLoading}
                  className="py-3 px-4 rounded-xl text-xs font-bold bg-surface-raised border border-halloween-border hover:border-halloween-purple text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <button
                  onClick={() => sendControlAction({ action: 'NEXT_PARTICIPANT' })}
                  disabled={actionLoading}
                  className="py-3 px-4 rounded-xl text-xs font-bold bg-surface-raised border border-halloween-border hover:border-halloween-purple text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => sendControlAction({ action: 'OPEN_VOTING', seconds: votingDuration })}
                  disabled={actionLoading || !current || state.stage_status === 'voting_open'}
                  className="py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-halloween-orange to-amber-600 hover:from-halloween-orange-dark hover:to-halloween-orange text-white shadow-glow-orange flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Abrir Voto ({votingDuration}s)</span>
                </button>

                <button
                  onClick={() => sendControlAction({ action: 'CLOSE_VOTING' })}
                  disabled={actionLoading || state.stage_status !== 'voting_open'}
                  className="py-3 px-4 rounded-xl text-xs font-bold bg-red-600/20 border border-red-500/50 hover:bg-red-600/30 text-red-300 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Square className="w-4 h-4" />
                  <span>Cerrar Voto</span>
                </button>
              </div>
            </div>

            {/* Special Stage Modes */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => sendControlAction({ action: 'SHOW_PODIUM' })}
                disabled={actionLoading}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500/20 border border-amber-400/50 hover:bg-amber-500/30 text-amber-300 flex items-center justify-center gap-2 transition-all"
              >
                <Award className="w-4 h-4" />
                <span>Mostrar Podio de Ganadores en Pantalla Gigante</span>
              </button>

              <button
                onClick={() => sendControlAction({ action: 'RESET_STAGE' })}
                disabled={actionLoading}
                className="py-2.5 px-4 rounded-xl text-xs font-medium bg-surface-raised border border-halloween-border hover:text-white text-gray-400 flex items-center justify-center gap-2 transition-all"
                title="Poner pantalla en espera"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Pausar Escenario</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Podium Standings Preview */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-6 border border-halloween-border space-y-4">
          <div className="flex items-center justify-between border-b border-halloween-border/60 pb-3">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Top Votados en Vivo</span>
            </h3>
            <span className="text-[11px] text-halloween-lavender">Público</span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {[...state.participants]
              .sort((a, b) => {
                const aCount = Number(a.total_votes ?? a.live_yes_votes ?? 0);
                const bCount = Number(b.total_votes ?? b.live_yes_votes ?? 0);
                const diff = bCount - aCount;
                if (diff !== 0) return diff;
                return (a.contest_number || 0) - (b.contest_number || 0);
              })
              .slice(0, 10)
              .map((p, idx) => (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    p.id === current?.id
                      ? 'bg-halloween-orange/20 border-halloween-orange text-white'
                      : 'bg-surface-raised border-halloween-border text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="font-mono font-bold text-gray-400 w-4 text-center">
                      {idx + 1}
                    </span>
                    <img
                      src={p.photo_original_key || p.photo_thumbnail_key}
                      alt={p.costume_title}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0 bg-black/40"
                      onError={(e) => {
                        if (p.photo_original_key && e.currentTarget.src !== p.photo_original_key) {
                          e.currentTarget.src = p.photo_original_key;
                        }
                      }}
                    />
                    <div className="truncate">
                      <strong className="block truncate text-white">{p.costume_title}</strong>
                      <span className="text-[10px] text-halloween-muted">#{p.contest_number}</span>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-halloween-orange flex-shrink-0 ml-2">
                    {p.total_votes ?? p.live_yes_votes ?? 0} pts
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Quick Participant Selector List */}
      <div className="glass-panel rounded-3xl p-6 border border-halloween-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              Todos los Participantes ({state.participants.length})
            </h3>
            <p className="text-xs text-halloween-muted">
              Haz clic en "Subir al Escenario" para poner a cualquier concursante en el proyector de inmediato.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-halloween-muted" />
            <input
              type="text"
              placeholder="Buscar por disfraz o número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-raised border border-halloween-border text-xs text-white placeholder-halloween-muted focus:outline-none focus:border-halloween-purple"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[460px] overflow-y-auto p-1">
          {filteredParticipants.map((p) => {
            const isCurrent = p.id === current?.id;
            return (
              <div
                key={p.id}
                className={`p-2.5 rounded-2xl border text-center flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-halloween-orange/20 border-halloween-orange shadow-glow-orange'
                    : 'bg-surface-raised border-halloween-border hover:border-halloween-purple/60'
                }`}
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
                    <img
                      src={p.photo_original_key || p.photo_thumbnail_key}
                      alt={p.costume_title}
                      className="w-full h-full object-cover bg-black/40"
                      onError={(e) => {
                        if (p.photo_original_key && e.currentTarget.src !== p.photo_original_key) {
                          e.currentTarget.src = p.photo_original_key;
                        }
                      }}
                    />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/80 font-mono font-bold text-[10px] text-white">
                      #{p.contest_number}
                    </span>
                  </div>
                  <strong className="block text-xs text-white truncate">{p.costume_title}</strong>
                  <span className="text-[10px] text-halloween-muted block truncate">
                    {p.public_display_name}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => sendControlAction({ action: 'SET_PARTICIPANT', participant_id: p.id })}
                    disabled={isCurrent || actionLoading}
                    className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      isCurrent
                        ? 'bg-halloween-orange text-black'
                        : 'bg-[#15182A] border border-halloween-border text-gray-300 hover:text-white hover:border-halloween-orange'
                    }`}
                  >
                    {isCurrent ? 'En Escenario' : 'Subir'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
