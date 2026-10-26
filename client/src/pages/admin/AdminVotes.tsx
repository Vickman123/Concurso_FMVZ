import React, { useState, useEffect } from 'react';
import { Heart, Search, Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminVotes: React.FC = () => {
  const { token } = useAuth();
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchVotes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/votes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVotes(data.votes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotes();
  }, [token]);

  const filteredVotes = votes.filter((v) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      v.confirmation_folio.toLowerCase().includes(s) ||
      v.costume_title.toLowerCase().includes(s) ||
      v.public_display_name.toLowerCase().includes(s) ||
      String(v.participant_number).includes(s)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Registro y Auditoría de Votos
          </h1>
          <p className="text-xs text-halloween-muted mt-1">
            Total de votos verificados y registrados: {votes.length}
          </p>
        </div>

        <button
          onClick={fetchVotes}
          className="p-2 rounded-xl bg-surface-card hover:bg-surface-raised text-gray-300 hover:text-white border border-halloween-border self-start sm:self-auto"
          title="Actualizar lista"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-surface-card border border-halloween-border flex items-center gap-3">
        <Search className="w-4 h-4 text-halloween-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por folio de confirmación o disfraz..."
          className="w-full bg-transparent text-xs text-white placeholder-halloween-muted focus:outline-none"
        />
      </div>

      {/* Votes Table */}
      <div className="rounded-3xl bg-surface-card border border-halloween-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-halloween-border bg-surface-raised/40 text-gray-400">
                <th className="py-3 px-4 font-semibold">Folio de Confirmación</th>
                <th className="py-3 px-4 font-semibold">Participante Votado</th>
                <th className="py-3 px-4 font-semibold">Tipo Votante</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-halloween-border/40">
              {filteredVotes.map((v) => (
                <tr key={v.id} className="hover:bg-surface-raised/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-halloween-lavender">
                    {v.confirmation_folio}
                  </td>
                  <td className="py-3 px-4">
                    <strong className="text-white block">{v.costume_title}</strong>
                    <span className="text-[10px] text-gray-400">
                      #{String(v.participant_number).padStart(2, '0')} · {v.public_display_name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-surface-raised border border-halloween-border">
                      {v.voter_type === 'student' ? 'Estudiante' : 'Trabajador'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Válido
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-right whitespace-nowrap">
                    {new Date(v.created_at).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-surface-card border border-halloween-border flex items-center gap-3 text-xs text-gray-400">
        <Shield className="w-4 h-4 text-halloween-purple flex-shrink-0" />
        <span>
          Protección de privacidad: El padrón no revela la correspondencia entre la persona votante y su selección ante usuarios públicos.
        </span>
      </div>
    </div>
  );
};
