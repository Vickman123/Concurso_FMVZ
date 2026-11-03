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
  Download,
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl, getEventSourceUrl } from '../../services/api';

interface LiveParticipant {
  id: number;
  contest_number: number;
  public_display_name: string;
  costume_title: string;
  description?: string;
  participant_type?: string;
  photo_thumbnail_key?: string;
  photo_original_key: string;
  live_yes_votes?: number;
  web_votes?: number;
  massive_yes_votes?: number;
  total_live_combined?: number;
  total_votes?: number;
}

interface LiveState {
  is_active?: boolean;
  is_massive_active?: boolean;
  stage_status: 'waiting' | 'presenting' | 'voting_open' | 'voting_closed' | 'podium';
  current_participant_id: number | null;
  current_participant: any;
  voting_seconds_left: number;
  total_cheers: number;
  current_votes: { yes_count: number; no_count: number; total: number };
  total_voters_registered: number;
  participants: LiveParticipant[];
  connected_clients: number;
  updated_at: string;
}

export const AdminLiveControl: React.FC = () => {
  const { token } = useAuth();
  const [state, setState] = useState<LiveState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableSort, setTableSort] = useState<'live_combined' | 'massive' | 'live_stage' | 'contest_number' | 'web'>('live_combined');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [votingDuration, setVotingDuration] = useState<number>(30);

  // Fetch current live state
  const fetchState = async () => {
    try {
      const res = await fetch(getApiUrl('/api/live/state'));
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

    const eventSource = new EventSource(getEventSourceUrl('/api/live/stream'));

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

    eventSource.addEventListener('MASSIVE_VOTE_UPDATED', () => {
      // Refresh state to update tallies across participants
      fetchState();
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
      const res = await fetch(getApiUrl('/api/live/control'), {
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

  // Export independent live votes table as CSV
  const exportBreakdownCSV = () => {
    if (!state?.participants) return;
    const headers = [
      'Numero_Concurso',
      'Titulo_Disfraz',
      'Participante',
      'Votos_Pasarela_1a1',
      'Votos_Votacion_Masiva',
      'Total_En_Vivo_Combinado',
      'Votos_Web_Galeria',
      'Gran_Total',
    ];
    const rows = state.participants.map((p) => [
      `"${p.contest_number}"`,
      `"${(p.costume_title || '').replace(/"/g, '""')}"`,
      `"${(p.public_display_name || '').replace(/"/g, '""')}"`,
      p.live_yes_votes || 0,
      p.massive_yes_votes || 0,
      p.total_live_combined || ((p.live_yes_votes || 0) + (p.massive_yes_votes || 0)),
      p.web_votes || 0,
      p.total_votes || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `concurso_fmvz_desglose_votos_en_vivo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !state) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-halloween-orange border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-display text-halloween-muted">
            Cargando centro de control de pasarela en vivo...
          </span>
        </div>
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

  // Sorted and filtered participants for the independent votes table
  const tableParticipants = state.participants
    .filter(
      (p) =>
        p.costume_title.toLowerCase().includes(tableSearch.toLowerCase()) ||
        p.public_display_name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        String(p.contest_number).includes(tableSearch)
    )
    .sort((a, b) => {
      if (tableSort === 'live_combined') {
        const aVal = a.total_live_combined ?? ((a.live_yes_votes || 0) + (a.massive_yes_votes || 0));
        const bVal = b.total_live_combined ?? ((b.live_yes_votes || 0) + (b.massive_yes_votes || 0));
        if (bVal !== aVal) return bVal - aVal;
        return a.contest_number - b.contest_number;
      }
      if (tableSort === 'massive') {
        const aVal = a.massive_yes_votes || 0;
        const bVal = b.massive_yes_votes || 0;
        if (bVal !== aVal) return bVal - aVal;
        return a.contest_number - b.contest_number;
      }
      if (tableSort === 'live_stage') {
        const aVal = a.live_yes_votes || 0;
        const bVal = b.live_yes_votes || 0;
        if (bVal !== aVal) return bVal - aVal;
        return a.contest_number - b.contest_number;
      }
      if (tableSort === 'web') {
        const aVal = a.web_votes || 0;
        const bVal = b.web_votes || 0;
        if (bVal !== aVal) return bVal - aVal;
        return a.contest_number - b.contest_number;
      }
      // contest_number
      return a.contest_number - b.contest_number;
    });

  // Calculate live totals
  const totalPasarelaVotes = state.participants.reduce((acc, p) => acc + (p.live_yes_votes || 0), 0);
  const totalMassiveVotes = state.participants.reduce((acc, p) => acc + (p.massive_yes_votes || 0), 0);
  const totalLiveCombinedVotes = totalPasarelaVotes + totalMassiveVotes;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-halloween-border">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-halloween-orange/20 text-halloween-orange flex items-center justify-center border border-halloween-orange/40">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl text-white tracking-wide">
                Control de Pasarela y Votación en Vivo
              </h1>
              <p className="text-xs text-halloween-muted">
                Auditorio FMVZ · Proyector de escenario y control de votos en tiempo real
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Master Stage Toggle */}
          <button
            onClick={() => sendControlAction({ action: 'TOGGLE_LIVE', is_active: !state.is_active })}
            disabled={actionLoading}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              state.is_active
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-600/30'
                : 'bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${state.is_active ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
            <span>{state.is_active ? 'Escenario: ACTIVO' : 'Escenario: PAUSADO'}</span>
          </button>

          {/* Link to Auditorio Projector Screen */}
          <a
            href="/en-vivo?view=projector"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-halloween-orange to-amber-600 hover:from-halloween-orange-dark hover:to-halloween-orange shadow-glow-orange flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Abrir Pantalla de Proyección</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Massive Voting Controller Card (Manual Open/Close) */}
      <div className={`p-6 rounded-3xl border transition-all ${
        state.is_massive_active
          ? 'bg-gradient-to-r from-emerald-950/70 via-purple-950/60 to-emerald-950/70 border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.35)] animate-pulse'
          : 'glass-panel border-halloween-purple/40 shadow-glow-purple'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 ${
              state.is_massive_active
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400'
                : 'bg-purple-900/30 text-purple-300 border border-purple-500/30'
            }`}>
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-black text-lg text-white">
                  Votación Masiva en Vivo (Todos los Disfraces)
                </h3>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  state.is_massive_active
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}>
                  {state.is_massive_active ? '● ABIERTA (Público votando en celulares)' : '○ CERRADA'}
                </span>
              </div>
              <p className="text-xs text-halloween-muted mt-1 max-w-xl">
                Al activar la votación masiva, el público en <span className="text-halloween-orange font-mono">/votar/en-vivo</span> podrá ver a <strong>todos los participantes</strong> tipo Tinder para dar voto o pasar por cada uno. Tú abres y cierras la votación manualmente aquí.
              </p>
            </div>
          </div>

          <button
            onClick={() => sendControlAction({ action: 'TOGGLE_MASSIVE_VOTING', is_massive_active: !state.is_massive_active })}
            disabled={actionLoading}
            className={`px-6 py-3.5 rounded-2xl font-display font-black text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 ${
              state.is_massive_active
                ? 'bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:brightness-110 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
            }`}
          >
            {state.is_massive_active ? (
              <>
                <Square className="w-5 h-5" />
                <span>CERRAR VOTACIÓN MASIVA</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>ABRIR VOTACIÓN MASIVA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Stage Status Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Stage Card */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-6 border border-halloween-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-halloween-border/60 pb-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  state.stage_status === 'voting_open'
                    ? 'bg-emerald-400 animate-ping'
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

            {/* In-flight Active Timer Controller */}
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
                    onClick={() => sendControlAction({ action: 'EXTEND_TIME', seconds: 15 })}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    +15s
                  </button>
                  <button
                    onClick={() => sendControlAction({ action: 'EXTEND_TIME', seconds: 30 })}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    +30s
                  </button>
                  <button
                    onClick={() => sendControlAction({ action: 'EXTEND_TIME', seconds: -10 })}
                    disabled={actionLoading}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-surface-raised border border-amber-500/50 text-amber-300 hover:text-white transition-colors cursor-pointer"
                  >
                    -10s
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions Buttons */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Acciones de Pasarela:
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
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500/20 border border-amber-400/50 hover:bg-amber-500/30 text-amber-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Mostrar Podio de Ganadores en Pantalla Gigante</span>
              </button>

              <button
                onClick={() => sendControlAction({ action: 'RESET_STAGE' })}
                disabled={actionLoading}
                className="py-2.5 px-4 rounded-xl text-xs font-medium bg-surface-raised border border-halloween-border hover:text-white text-gray-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
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
                const aVal = a.total_live_combined ?? ((a.live_yes_votes || 0) + (a.massive_yes_votes || 0));
                const bVal = b.total_live_combined ?? ((b.live_yes_votes || 0) + (b.massive_yes_votes || 0));
                const diff = bVal - aVal;
                if (diff !== 0) return diff;
                return (a.contest_number || 0) - (b.contest_number || 0);
              })
              .slice(0, 10)
              .map((p, idx) => {
                const liveTotal = p.total_live_combined ?? ((p.live_yes_votes || 0) + (p.massive_yes_votes || 0));
                return (
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
                        <span className="text-[10px] text-halloween-muted">
                          #{p.contest_number} · {p.public_display_name}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="font-mono font-black text-emerald-400 block text-xs">
                        {liveTotal} pts
                      </span>
                      <span className="text-[9px] text-gray-400 block font-mono">
                        P:{p.live_yes_votes || 0} | M:{p.massive_yes_votes || 0}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INDEPENDENT VOTES BREAKDOWN TABLE (STAFF & JURY AUDIT)         */}
      {/* ------------------------------------------------------------- */}
      <div className="glass-panel rounded-3xl p-6 border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-halloween-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-display font-black text-lg text-white">
                Tabla Oficial de Votaciones en Vivo (Desglose Pasarela vs Masiva)
              </h3>
            </div>
            <p className="text-xs text-halloween-muted mt-0.5">
              Conteo independiente en tiempo real para el Staff y Jurado. Valida votos de pasarela 1 a 1 y votos de votación masiva.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportBreakdownCSV}
              className="px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/50 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              title="Descargar tabla en formato CSV para Excel"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Global Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#0B0D1A] border border-halloween-border">
            <span className="text-[10px] uppercase font-bold text-halloween-muted block">
              Votos Pasarela 1-a-1
            </span>
            <span className="text-xl font-mono font-black text-halloween-orange mt-0.5 block">
              {totalPasarelaVotes}
            </span>
            <span className="text-[10px] text-gray-400">Emitidos durante rondas</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0B0D1A] border border-emerald-500/40">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">
              Votos Votación Masiva
            </span>
            <span className="text-xl font-mono font-black text-emerald-300 mt-0.5 block">
              {totalMassiveVotes}
            </span>
            <span className="text-[10px] text-emerald-200/70">Emitidos en modo masivo</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0B0D1A] border border-purple-500/40">
            <span className="text-[10px] uppercase font-bold text-purple-300 block">
              Total en Vivo Combinado
            </span>
            <span className="text-xl font-mono font-black text-purple-200 mt-0.5 block">
              {totalLiveCombinedVotes}
            </span>
            <span className="text-[10px] text-purple-300/70">Pasarela + Masiva</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0B0D1A] border border-halloween-border">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Participantes
            </span>
            <span className="text-xl font-mono font-black text-white mt-0.5 block">
              {state.participants.length}
            </span>
            <span className="text-[10px] text-gray-400">Total en competencia</span>
          </div>
        </div>

        {/* Filters and Sorting controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-gray-400 font-semibold mr-1">Ordenar por:</span>
            <button
              onClick={() => setTableSort('live_combined')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                tableSort === 'live_combined'
                  ? 'bg-purple-600 text-white'
                  : 'bg-surface-raised border border-halloween-border text-gray-400 hover:text-white'
              }`}
            >
              Total en Vivo
            </button>
            <button
              onClick={() => setTableSort('massive')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                tableSort === 'massive'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-surface-raised border border-halloween-border text-gray-400 hover:text-white'
              }`}
            >
              Votación Masiva
            </button>
            <button
              onClick={() => setTableSort('live_stage')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                tableSort === 'live_stage'
                  ? 'bg-halloween-orange text-black'
                  : 'bg-surface-raised border border-halloween-border text-gray-400 hover:text-white'
              }`}
            >
              Pasarela 1-a-1
            </button>
            <button
              onClick={() => setTableSort('contest_number')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                tableSort === 'contest_number'
                  ? 'bg-gray-700 text-white'
                  : 'bg-surface-raised border border-halloween-border text-gray-400 hover:text-white'
              }`}
            >
              # Concurso
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-halloween-muted" />
            <input
              type="text"
              placeholder="Filtrar por nombre o #..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-surface-raised border border-halloween-border text-xs text-white placeholder-halloween-muted focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto rounded-2xl border border-halloween-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0D1A] text-gray-400 font-mono text-[11px] uppercase tracking-wider border-b border-halloween-border">
              <tr>
                <th className="py-3 px-3"># Concurso</th>
                <th className="py-3 px-3">Disfraz & Concursante</th>
                <th className="py-3 px-3 text-center">Pasarela 1-a-1</th>
                <th className="py-3 px-3 text-center">Votación Masiva</th>
                <th className="py-3 px-3 text-center">Total en Vivo</th>
                <th className="py-3 px-3 text-center">Web (Galería)</th>
                <th className="py-3 px-3 text-center">Gran Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-halloween-border/40 font-mono">
              {tableParticipants.map((p) => {
                const combined = p.total_live_combined ?? ((p.live_yes_votes || 0) + (p.massive_yes_votes || 0));
                const isCurrent = p.id === current?.id;

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-[#12162A] transition-colors ${
                      isCurrent ? 'bg-halloween-orange/10' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 border border-halloween-border text-halloween-orange">
                        #{String(p.contest_number).padStart(2, '0')}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5 font-sans">
                        <img
                          src={p.photo_thumbnail_key || p.photo_original_key}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0 bg-black/40"
                          onError={(e) => {
                            if (p.photo_original_key && e.currentTarget.src !== p.photo_original_key) {
                              e.currentTarget.src = p.photo_original_key;
                            }
                          }}
                        />
                        <div className="truncate max-w-[200px] sm:max-w-xs">
                          <strong className="block text-white truncate text-xs">
                            {p.costume_title}
                          </strong>
                          <span className="text-[10px] text-halloween-muted block truncate">
                            {p.public_display_name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-orange-950/40 border border-orange-500/40 text-halloween-orange font-bold text-xs inline-block min-w-[36px]">
                        {p.live_yes_votes || 0}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 font-bold text-xs inline-block min-w-[36px]">
                        {p.massive_yes_votes || 0}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="px-3 py-1 rounded-xl bg-purple-900/40 border border-purple-400/50 text-purple-200 font-black text-xs inline-block min-w-[42px] shadow-sm">
                        {combined}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center text-gray-400">
                      <span className="text-xs">{p.web_votes || 0}</span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="font-black text-amber-400 text-xs">
                        {p.total_votes || 0}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Participant Selector List */}
      <div className="glass-panel rounded-3xl p-6 border border-halloween-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              Subir Concursante al Escenario ({state.participants.length})
            </h3>
            <p className="text-xs text-halloween-muted">
              Haz clic en "Subir" para poner a cualquier concursante en el proyector de inmediato.
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
                    className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
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
