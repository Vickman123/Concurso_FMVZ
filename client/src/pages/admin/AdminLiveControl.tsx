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
}

interface LiveState {
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
            <span>Consola de Transmisión en Vivo (Kahoot Mode)</span>
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
              <img
                src={current.photo_thumbnail_key || current.photo_original_key}
                alt={current.costume_title}
                className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-2xl border-2 border-halloween-orange/60 shadow-md flex-shrink-0"
              />
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

          {/* Big Action Controls */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Controles del Presentador
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => sendControlAction({ action: 'PREV_PARTICIPANT' })}
                disabled={actionLoading}
                className="py-3 px-4 rounded-xl text-xs font-bold bg-surface-raised border border-halloween-border hover:border-halloween-purple text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <button
                onClick={() => sendControlAction({ action: 'NEXT_PARTICIPANT' })}
                disabled={actionLoading}
                className="py-3 px-4 rounded-xl text-xs font-bold bg-surface-raised border border-halloween-border hover:border-halloween-purple text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => sendControlAction({ action: 'OPEN_VOTING', seconds: 30 })}
                disabled={actionLoading || !current}
                className="py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-halloween-orange to-amber-600 hover:from-halloween-orange-dark hover:to-halloween-orange text-white shadow-glow-orange flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>Abrir Voto (30s)</span>
              </button>

              <button
                onClick={() => sendControlAction({ action: 'CLOSE_VOTING' })}
                disabled={actionLoading}
                className="py-3 px-4 rounded-xl text-xs font-bold bg-red-600/20 border border-red-500/50 hover:bg-red-600/30 text-red-300 flex items-center justify-center gap-2 transition-all"
              >
                <Square className="w-4 h-4" />
                <span>Cerrar Voto</span>
              </button>
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
              .sort((a, b) => (b.live_yes_votes || 0) - (a.live_yes_votes || 0))
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
                      src={p.photo_thumbnail_key || p.photo_original_key}
                      alt={p.costume_title}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="truncate">
                      <strong className="block truncate text-white">{p.costume_title}</strong>
                      <span className="text-[10px] text-halloween-muted">#{p.contest_number}</span>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-halloween-orange flex-shrink-0 ml-2">
                    {p.live_yes_votes || 0} pts
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
                      src={p.photo_thumbnail_key || p.photo_original_key}
                      alt={p.costume_title}
                      className="w-full h-full object-cover"
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
