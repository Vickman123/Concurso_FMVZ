import React, { useState, useEffect } from 'react';
import { Trophy, Eye, EyeOff, BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminResults: React.FC = () => {
  const { token, admin } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [pubStatus, setPubStatus] = useState<string>('hidden');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/results', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setPubStatus(data.results_publication_status || 'hidden');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [token]);

  const handleTogglePublication = async () => {
    const nextStatus = pubStatus === 'published' ? 'hidden' : 'published';
    const msg = nextStatus === 'published'
      ? '¿Estás seguro de PUBLICAR los resultados oficiales para toda la comunidad FMVZ?'
      : '¿Deseas OCULTAR los resultados públicos del portal?';

    if (!confirm(msg)) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ results_publication_status: nextStatus }),
      });
      if (res.ok) {
        setPubStatus(nextStatus);
      }
    } catch (e) {
      alert('Error al modificar visibilidad de resultados');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Conteo y Resultados en Tiempo Real
          </h1>
          <p className="text-xs text-halloween-muted mt-1">
            Cómputo verificado de votos emitidos para cada disfraz registrado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchResults}
            className="p-2 rounded-xl bg-surface-card hover:bg-surface-raised text-gray-300 hover:text-white border border-halloween-border"
            title="Recalcular"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {admin?.role === 'admin' && (
            <button
              onClick={handleTogglePublication}
              disabled={updating}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                pubStatus === 'published'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              }`}
            >
              {pubStatus === 'published' ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Ocultar resultados del portal</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Publicar resultados oficialmente</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Visibility Status Banner */}
      <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
        pubStatus === 'published'
          ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
          : 'bg-amber-950/30 border-amber-800 text-amber-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${pubStatus === 'published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <strong>Visibilidad pública:</strong>
          <span>
            {pubStatus === 'published'
              ? 'Los resultados son visibles públicamente para toda la comunidad.'
              : 'Los resultados se encuentran ocultos al público hasta la validación oficial del jurado.'}
          </span>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-3xl bg-surface-card border border-halloween-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-halloween-border bg-surface-raised/40 text-gray-400">
                <th className="py-3 px-4 font-semibold">Posición</th>
                <th className="py-3 px-4 font-semibold">Disfraz</th>
                <th className="py-3 px-4 font-semibold">Nombre Público</th>
                <th className="py-3 px-4 font-semibold">Tipo</th>
                <th className="py-3 px-4 font-semibold text-right">Votos Válidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-halloween-border/40">
              {results.map((r, idx) => {
                const rank = idx + 1;
                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-surface-raised/40 transition-colors ${
                      rank === 1
                        ? 'bg-amber-500/10'
                        : rank === 2
                        ? 'bg-slate-400/10'
                        : rank === 3
                        ? 'bg-amber-700/10'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-display font-bold">
                      {rank === 1 && <span className="text-amber-400 text-sm">🥇 1er Lugar</span>}
                      {rank === 2 && <span className="text-slate-300 text-sm">🥈 2do Lugar</span>}
                      {rank === 3 && <span className="text-amber-500 text-sm">🥉 3er Lugar</span>}
                      {rank > 3 && <span className="text-gray-400">#{rank}</span>}
                    </td>
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={r.photo_original_key}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover border border-halloween-border"
                      />
                      <div>
                        <strong className="text-white block">{r.costume_title}</strong>
                        <span className="text-[10px] text-halloween-muted">
                          #{String(r.contest_number).padStart(2, '0')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-halloween-lavender font-semibold">
                      {r.public_display_name}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {r.participant_type === 'student' ? 'Estudiante' : 'Trabajador'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-display font-bold text-base text-halloween-orange">
                        {r.total_votes}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
