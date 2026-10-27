import React, { useState, useEffect } from 'react';
import {
  Heart,
  Search,
  Shield,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  Radio,
  Globe,
  Users,
  Copy,
  Check,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface VoteRecord {
  vote_source: 'live' | 'web';
  id: number;
  confirmation_folio: string;
  vote_value: 'yes' | 'no';
  created_at: string;
  status: string;
  participant_number: number;
  costume_title: string;
  public_display_name: string;
  voter_type: 'student' | 'worker';
  normalized_identifier: string;
  voter_name: string;
}

interface VoteSummary {
  total: number;
  live_total: number;
  web_total: number;
  yes_total: number;
  no_total: number;
  student_total: number;
  worker_total: number;
}

export const AdminVotes: React.FC = () => {
  const { token } = useAuth();
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [summary, setSummary] = useState<VoteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'web' | 'yes' | 'no' | 'student' | 'worker'>('all');
  const [copiedFolio, setCopiedFolio] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchVotes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/votes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVotes(data.votes || []);
        setSummary(data.summary || null);
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

  // Export to CSV / Excel
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/votes/export-csv', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auditoria_votos_fmvz_halloween_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Client-side fallback generation if server route has issues
        generateClientCsvFallback();
      }
    } catch {
      generateClientCsvFallback();
    } finally {
      setExporting(false);
    }
  };

  // Client-side fallback generator with UTF-8 BOM
  const generateClientCsvFallback = () => {
    if (votes.length === 0) return;

    const headers = [
      '#',
      'Folio de Auditoría',
      'Modalidad',
      'Tipo de Votante',
      'Número de Cuenta / Identificador',
      'Nombre Registrado',
      'No. Participante',
      'Disfraz Votado',
      'Concursante',
      'Calificación / Voto',
      'Estado',
      'Fecha y Hora (CDMX)',
    ];

    const rows = votes.map((r, idx) => {
      const isLive = r.vote_source === 'live';
      const voterTypeLabel = r.voter_type === 'student' ? 'Alumno' : 'Profesor / Personal';
      const voteValueLabel = r.vote_value === 'yes' ? 'VOTO A FAVOR (SÍ)' : 'NO VOTÓ (PASÓ)';
      const dateStr = new Date(r.created_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

      return [
        idx + 1,
        `"${r.confirmation_folio}"`,
        `"${isLive ? 'En Vivo (Kahoot)' : 'Web Tradicional'}"`,
        `"${voterTypeLabel}"`,
        `"${r.normalized_identifier}"`,
        `"${r.voter_name || 'N/A'}"`,
        `"#${String(r.participant_number).padStart(2, '0')}"`,
        `"${r.costume_title.replace(/"/g, '""')}"`,
        `"${r.public_display_name.replace(/"/g, '""')}"`,
        `"${voteValueLabel}"`,
        `"${r.status === 'valid' ? 'Válido' : r.status}"`,
        `"${dateStr}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `auditoria_votos_fmvz_halloween_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyFolio = (folio: string) => {
    navigator.clipboard.writeText(folio);
    setCopiedFolio(folio);
    setTimeout(() => setCopiedFolio(null), 2000);
  };

  // Filter votes
  const filteredVotes = votes.filter((v) => {
    // Tab filter
    if (activeFilter === 'live' && v.vote_source !== 'live') return false;
    if (activeFilter === 'web' && v.vote_source !== 'web') return false;
    if (activeFilter === 'yes' && v.vote_value !== 'yes') return false;
    if (activeFilter === 'no' && v.vote_value !== 'no') return false;
    if (activeFilter === 'student' && v.voter_type !== 'student') return false;
    if (activeFilter === 'worker' && v.voter_type !== 'worker') return false;

    // Search query
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      v.confirmation_folio.toLowerCase().includes(s) ||
      v.costume_title.toLowerCase().includes(s) ||
      v.public_display_name.toLowerCase().includes(s) ||
      v.normalized_identifier.includes(s) ||
      (v.voter_name && v.voter_name.toLowerCase().includes(s)) ||
      String(v.participant_number).includes(s)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-halloween-purple/20 border border-halloween-purple/40 text-halloween-lavender text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5 text-halloween-orange" />
            <span>Auditoría Oficial y Padrón de Votos</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Registro y Auditoría de Votos
          </h1>
          <p className="text-xs text-halloween-muted mt-1">
            Cada voto registrado en vivo (Kahoot) y en la plataforma web cuenta con trazabilidad completa para validación del jurado.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchVotes}
            disabled={loading}
            className="p-2.5 rounded-xl bg-surface-card hover:bg-surface-raised text-gray-300 hover:text-white border border-halloween-border transition-colors"
            title="Actualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exporting || votes.length === 0}
            className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 shadow-md transition-all flex items-center gap-2 border border-emerald-400/40 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Generando Excel...' : 'Exportar Votos a Excel / CSV'}</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl glass-panel border border-halloween-border">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-bold block">
            Total de Votos
          </span>
          <span className="font-mono font-black text-2xl sm:text-3xl text-white">
            {votes.length}
          </span>
          <span className="text-[10px] text-halloween-muted block mt-0.5">
            Registrados en el sistema
          </span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-purple-500/40 bg-purple-950/20">
          <span className="text-[11px] text-purple-300 uppercase tracking-wider font-bold block flex items-center gap-1">
            <Radio className="w-3 h-3 text-red-400 animate-pulse" />
            En Vivo (Kahoot)
          </span>
          <span className="font-mono font-black text-2xl sm:text-3xl text-purple-200">
            {votes.filter((v) => v.vote_source === 'live').length}
          </span>
          <span className="text-[10px] text-purple-400/80 block mt-0.5">
            Emitidos en el auditorio
          </span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-emerald-500/40 bg-emerald-950/20">
          <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-bold block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Votos a Favor (SÍ)
          </span>
          <span className="font-mono font-black text-2xl sm:text-3xl text-emerald-200">
            {votes.filter((v) => v.vote_value === 'yes').length}
          </span>
          <span className="text-[10px] text-emerald-400/80 block mt-0.5">
            Calificaciones positivas
          </span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-amber-500/40 bg-amber-950/20">
          <span className="text-[11px] text-amber-300 uppercase tracking-wider font-bold block flex items-center gap-1">
            <Users className="w-3 h-3 text-amber-400" />
            Comunidad FMVZ
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-amber-200 font-mono font-bold">
              🎓 {votes.filter((v) => v.voter_type === 'student').length} Alumnos
            </span>
            <span className="text-gray-500">|</span>
            <span className="text-xs text-amber-200 font-mono font-bold">
              👨‍🏫 {votes.filter((v) => v.voter_type === 'worker').length} Profesores
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-surface-card border border-halloween-border flex items-center gap-3">
          <Search className="w-4 h-4 text-halloween-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por folio, número de cuenta, nombre del disfraz o participante..."
            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-halloween-muted focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-gray-400 hover:text-white"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-gray-400 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filtrar:
          </span>
          {[
            { id: 'all', label: `Todos (${votes.length})` },
            { id: 'live', label: `⚡ En Vivo (${votes.filter((v) => v.vote_source === 'live').length})` },
            { id: 'yes', label: `👍 Votó SÍ (${votes.filter((v) => v.vote_value === 'yes').length})` },
            { id: 'no', label: `⛔ Pasó (${votes.filter((v) => v.vote_value === 'no').length})` },
            { id: 'student', label: `🎓 Alumnos (${votes.filter((v) => v.voter_type === 'student').length})` },
            { id: 'worker', label: `👨‍🏫 Profesores (${votes.filter((v) => v.voter_type === 'worker').length})` },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
                activeFilter === pill.id
                  ? 'bg-halloween-orange text-white font-bold shadow-sm'
                  : 'bg-surface-card hover:bg-surface-raised text-gray-300 border border-halloween-border'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Votes Table */}
      <div className="rounded-3xl bg-surface-card border border-halloween-border overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-halloween-border bg-surface-raised/40 text-gray-400">
                <th className="py-3.5 px-4 font-semibold">Folio Auditoría</th>
                <th className="py-3.5 px-4 font-semibold">Votante Identificado</th>
                <th className="py-3.5 px-4 font-semibold">Disfraz Votado</th>
                <th className="py-3.5 px-4 font-semibold text-center">Voto Emitido</th>
                <th className="py-3.5 px-4 font-semibold">Modalidad</th>
                <th className="py-3.5 px-4 font-semibold text-right">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-halloween-border/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-halloween-muted">
                    Cargando auditoría de votos...
                  </td>
                </tr>
              ) : filteredVotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-halloween-muted">
                    No se encontraron votos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredVotes.map((v) => (
                  <tr key={`${v.vote_source}-${v.id}`} className="hover:bg-surface-raised/30 transition-colors">
                    {/* Folio */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-halloween-lavender">
                        <span>{v.confirmation_folio}</span>
                        <button
                          onClick={() => copyFolio(v.confirmation_folio)}
                          className="p-1 text-gray-500 hover:text-white"
                          title="Copiar folio"
                        >
                          {copiedFolio === v.confirmation_folio ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Voter Identification */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                              v.voter_type === 'student'
                                ? 'bg-halloween-orange/20 text-halloween-orange border border-halloween-orange/30'
                                : 'bg-purple-900/40 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {v.voter_type === 'student' ? '🎓 Alumno' : '👨‍🏫 Profesor'}
                          </span>
                          <span className="font-mono font-black text-white text-xs">
                            {v.normalized_identifier}
                          </span>
                        </div>
                        {v.voter_name && v.voter_name !== 'Miembro FMVZ' && (
                          <span className="text-[11px] text-gray-400 block truncate max-w-[180px]">
                            {v.voter_name}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Participant */}
                    <td className="py-3.5 px-4">
                      <strong className="text-white block text-sm">
                        {v.costume_title}
                      </strong>
                      <span className="text-[11px] text-gray-400">
                        #{String(v.participant_number).padStart(2, '0')} · {v.public_display_name}
                      </span>
                    </td>

                    {/* Vote Value */}
                    <td className="py-3.5 px-4 text-center">
                      {v.vote_value === 'yes' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-bold text-xs shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>VOTÓ SÍ (A Favor)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-raised border border-halloween-border text-gray-400 font-medium text-xs">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decidió Pasar</span>
                        </span>
                      )}
                    </td>

                    {/* Modality */}
                    <td className="py-3.5 px-4">
                      {v.vote_source === 'live' ? (
                        <span className="inline-flex items-center gap-1 text-purple-300 text-[11px] font-semibold bg-purple-950/40 px-2 py-0.5 rounded-lg border border-purple-500/30">
                          <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                          <span>En Vivo (Kahoot)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-300 text-[11px] font-semibold bg-blue-950/40 px-2 py-0.5 rounded-lg border border-blue-500/30">
                          <Globe className="w-3 h-3 text-blue-400" />
                          <span>Web Tradicional</span>
                        </span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-gray-300 text-right whitespace-nowrap font-mono text-[11px]">
                      {new Date(v.created_at).toLocaleString('es-MX', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                        timeZone: 'America/Mexico_City',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-surface-card border border-halloween-border flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-halloween-purple flex-shrink-0" />
          <span>
            Auditoría de integridad: Cada registro incluye marca de tiempo criptográfica y validación de identificador institucional único.
          </span>
        </div>

        <button
          onClick={handleExportCsv}
          className="text-emerald-400 hover:text-emerald-300 font-bold underline hidden sm:inline"
        >
          Descargar copia en Excel / CSV ➔
        </button>
      </div>
    </div>
  );
};
