import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, Filter, RefreshCw, AlertCircle, Radio } from 'lucide-react';
import { Participant } from '../types';
import { ParticipantCard } from '../components/ParticipantCard';
import { useContest } from '../context/ContestContext';

export const Gallery: React.FC = () => {
  const { isLiveActive } = useContest();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'student' | 'worker'>('all');

  const fetchParticipants = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/participants?${params.toString()}`);
      if (!res.ok) throw new Error('Error al conectar con el servidor');
      const data = await res.json();
      setParticipants(data.participants || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los participantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchParticipants();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, typeFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 safe-bottom">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-halloween-orange uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Galería oficial de concursantes</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-4xl text-halloween-white">
            Participantes
          </h1>
          <p className="text-xs sm:text-sm text-halloween-muted mt-1">
            Explora los disfraces aprobados por el comité organizador para la edición 2026.
          </p>
        </div>

        {/* Live Kahoot Voting State or Exhibition Mode */}
        <div className="flex items-center gap-2">
          {isLiveActive ? (
            <Link
              to="/en-vivo"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse hover:brightness-110 transition-all"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Votación en vivo (Kahoot)</span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#15182A] text-halloween-muted border border-halloween-border">
              <span>🎭 Modo visualización</span>
            </span>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel rounded-2xl p-3 sm:p-4 mb-8 border border-halloween-border/90 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 shadow-sm">
        {/* Search input */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-halloween-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, disfraz o número..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-halloween-border text-sm text-halloween-white placeholder-halloween-muted focus:outline-none focus:border-halloween-purple focus:ring-1 focus:ring-halloween-purple transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-halloween-muted hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Type Filter Pills (matching screen 2 mockup) */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'student', label: 'Estudiantes' },
            { id: 'worker', label: 'Trabajadores' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                typeFilter === tab.id
                  ? 'bg-halloween-orange text-white shadow-glow-orange'
                  : 'bg-surface-raised text-halloween-muted hover:text-white hover:bg-surface-subtle'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-200 text-sm flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchParticipants}
            className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-xs font-semibold flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {/* Grid of participants: 2 columns on mobile, 3 on md, 4 on lg */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-3xl bg-surface-card animate-pulse border border-halloween-border/50" />
          ))}
        </div>
      ) : participants.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl glass-panel border border-halloween-border/80">
          <div className="w-16 h-16 rounded-full bg-halloween-purple/20 flex items-center justify-center text-3xl mx-auto mb-4">
            👻
          </div>
          <h3 className="font-display font-bold text-lg text-halloween-white">
            No se encontraron disfraces
          </h3>
          <p className="text-xs sm:text-sm text-halloween-muted max-w-sm mx-auto mt-1">
            No hay participantes que coincidan con la búsqueda "{search}". Intenta con otros términos o limpia el filtro.
          </p>
          <button
            onClick={() => { setSearch(''); setTypeFilter('all'); }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-halloween-orange bg-halloween-orange/15 hover:bg-halloween-orange/25 transition-colors"
          >
            Mostrar todos los participantes
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-halloween-muted mb-4 px-1">
            <span>Mostrando {participants.length} participantes aprobados</span>
            <span className="hidden sm:inline">Ordenados por número oficial</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {participants.map((participant) => (
              <ParticipantCard
                key={participant.contest_number}
                participant={participant}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
