import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Award,
  BarChart3,
  RefreshCw,
  Download,
  Search,
  Flame,
  Radio,
  Users,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../services/api';

interface ParticipantResult {
  id: number;
  contest_number: number;
  full_name?: string;
  public_display_name: string;
  costume_title: string;
  description?: string;
  participant_type: 'student' | 'worker';
  photo_original_key: string;
  photo_thumbnail_key?: string;
  status: string;
  live_stage_votes: number;
  massive_votes: number;
  total_live_combined: number;
  web_votes: number;
  total_votes: number;
  passed_votes?: number;
}

export const AdminFinalComparison: React.FC = () => {
  const { token } = useAuth();
  const [results, setResults] = useState<ParticipantResult[]>([]);
  const [totalCheers, setTotalCheers] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'live_combined' | 'total_global' | 'massive' | 'live_stage' | 'web' | 'contest_number'>('live_combined');

  const fetchResults = async () => {
    try {
      const res = await fetch(getApiUrl('/api/admin/results'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        if (data.total_cheers !== undefined) {
          setTotalCheers(data.total_cheers);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 4000);
    return () => clearInterval(interval);
  }, [token]);

  // Sort and filter results
  const sortedResults = useMemo(() => {
    const list = [...results];

    list.sort((a, b) => {
      if (sortBy === 'live_combined') {
        const diff = b.total_live_combined - a.total_live_combined;
        if (diff !== 0) return diff;
        return (b.total_votes || 0) - (a.total_votes || 0);
      }
      if (sortBy === 'total_global') {
        const diff = b.total_votes - a.total_votes;
        if (diff !== 0) return diff;
        return b.total_live_combined - a.total_live_combined;
      }
      if (sortBy === 'massive') {
        const diff = b.massive_votes - a.massive_votes;
        if (diff !== 0) return diff;
        return b.total_live_combined - a.total_live_combined;
      }
      if (sortBy === 'live_stage') {
        const diff = b.live_stage_votes - a.live_stage_votes;
        if (diff !== 0) return diff;
        return b.total_live_combined - a.total_live_combined;
      }
      if (sortBy === 'web') {
        const diff = b.web_votes - a.web_votes;
        if (diff !== 0) return diff;
        return b.total_live_combined - a.total_live_combined;
      }
      // contest_number
      return a.contest_number - b.contest_number;
    });

    return list;
  }, [results, sortBy]);

  const filteredResults = useMemo(() => {
    if (!search.trim()) return sortedResults;
    const term = search.toLowerCase().trim();
    return sortedResults.filter(
      (r) =>
        r.costume_title.toLowerCase().includes(term) ||
        r.public_display_name.toLowerCase().includes(term) ||
        String(r.contest_number).includes(term) ||
        `#${r.contest_number}`.includes(term)
    );
  }, [sortedResults, search]);

  // Global counts
  const totalLiveVotesAll = useMemo(() => {
    return results.reduce((acc, r) => acc + (r.total_live_combined || 0), 0);
  }, [results]);

  const totalMassiveAll = useMemo(() => {
    return results.reduce((acc, r) => acc + (r.massive_votes || 0), 0);
  }, [results]);

  const totalStageAll = useMemo(() => {
    return results.reduce((acc, r) => acc + (r.live_stage_votes || 0), 0);
  }, [results]);

  // Export full official tally sheet as CSV
  const exportOfficialCSV = () => {
    if (results.length === 0) return;

    const headers = [
      'Posicion',
      'Clasificacion_Oficial',
      'Numero_Concurso',
      'Titulo_Disfraz',
      'Participante',
      'Categoria_Comunidad',
      'Votos_Pasarela_1a1',
      'Votos_Votacion_Masiva',
      'TOTAL_EN_VIVO_COMBINADO',
      'Votos_Web_Galeria',
      'GRAN_TOTAL_GLOBAL',
    ];

    const rows = sortedResults.map((r, idx) => {
      const rank = idx + 1;
      let clasificacion = 'Participante';
      if (rank === 1) clasificacion = '1er Lugar - Podio Oro';
      else if (rank === 2) clasificacion = '2do Lugar - Podio Plata';
      else if (rank === 3) clasificacion = '3er Lugar - Podio Bronce';
      else if (rank >= 4 && rank <= 23) clasificacion = 'Ganador Ronda (Puestos 4 al 23)';

      return [
        rank,
        `"${clasificacion}"`,
        `"${r.contest_number}"`,
        `"${(r.costume_title || '').replace(/"/g, '""')}"`,
        `"${(r.public_display_name || '').replace(/"/g, '""')}"`,
        `"${r.participant_type === 'student' ? 'Alumno' : 'Profesor'}"`,
        r.live_stage_votes || 0,
        r.massive_votes || 0,
        r.total_live_combined || 0,
        r.web_votes || 0,
        r.total_votes || 0,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `acta_computo_final_fmvz_2026_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-halloween-orange border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-display text-halloween-muted">
            Calculando comparativa final de votos en vivo y web...
          </span>
        </div>
      </div>
    );
  }

  // Top 3 for visual podium
  const top1 = sortedResults[0];
  const top2 = sortedResults[1];
  const top3 = sortedResults[2];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-halloween-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/40 font-bold text-xl">
              🏆
            </div>
            <div>
              <h1 className="font-display font-black text-2xl text-white tracking-wide">
                Comparativa y Cómputo Final del Concurso
              </h1>
              <p className="text-xs text-halloween-muted">
                Comparación directa entre Votos en Vivo (Pasarela 1 a 1), Votación Masiva y Web. Resaltado oficial para el Jurado.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchResults();
            }}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-surface-raised border border-halloween-border text-gray-300 hover:text-white transition-all cursor-pointer"
            title="Recalcular votos"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={exportOfficialCSV}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Acta Oficial (CSV)</span>
          </button>
        </div>
      </div>

      {/* Global Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#0B0D1A] border border-purple-500/40">
          <span className="text-[10px] font-bold uppercase text-purple-300 block">
            Total en Vivo Combinado
          </span>
          <span className="text-2xl font-mono font-black text-purple-200 mt-0.5 block">
            {totalLiveVotesAll}
          </span>
          <span className="text-[10px] text-purple-300/70">Pasarela + Votación Masiva</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B0D1A] border border-emerald-500/40">
          <span className="text-[10px] font-bold uppercase text-emerald-400 block">
            Votos Votación Masiva
          </span>
          <span className="text-2xl font-mono font-black text-emerald-300 mt-0.5 block">
            {totalMassiveAll}
          </span>
          <span className="text-[10px] text-emerald-200/70">Votos libres en celulares</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B0D1A] border border-orange-500/40">
          <span className="text-[10px] font-bold uppercase text-halloween-orange block">
            Votos Pasarela 1-a-1
          </span>
          <span className="text-2xl font-mono font-black text-halloween-orange mt-0.5 block">
            {totalStageAll}
          </span>
          <span className="text-[10px] text-halloween-muted">Votos en rondas de escenario</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B0D1A] border border-halloween-border">
          <span className="text-[10px] font-bold uppercase text-amber-400 block">
            Reacciones del Auditorio
          </span>
          <span className="text-2xl font-mono font-black text-amber-300 mt-0.5 block flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-halloween-orange inline" />
            {totalCheers}
          </span>
          <span className="text-[10px] text-gray-400">{results.length} disfraces evaluados</span>
        </div>
      </div>

      {/* Visual Podium for Top 3 */}
      {top1 && (
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/50 shadow-glow-orange space-y-4">
          <div className="flex items-center justify-between border-b border-halloween-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="font-display font-black text-lg text-white">
                Podio de Honor Oficial (1º, 2º y 3er Lugar)
              </h2>
            </div>
            <span className="text-xs text-amber-300 font-mono font-bold">
              Máximos Ganadores
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 items-end">
            {/* 2nd Place */}
            {top2 && (
              <div className="p-4 rounded-2xl border-2 border-slate-300/80 bg-gradient-to-b from-slate-900/60 to-[#0A0D1B] shadow-[0_0_20px_rgba(203,213,225,0.25)] flex flex-col justify-between text-center space-y-3 order-2 md:order-1">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-400/20 text-slate-200 font-black text-lg flex items-center justify-center border border-slate-300">
                  🥈 2º
                </div>
                <div className="relative aspect-square w-32 mx-auto rounded-xl overflow-hidden bg-black/60 border border-slate-400/50">
                  <img
                    src={top2.photo_original_key || top2.photo_thumbnail_key}
                    alt={top2.costume_title}
                    className="w-full h-full object-contain p-1"
                  />
                  <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/80 font-mono text-[10px] text-white">
                    #{top2.contest_number}
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-black text-base text-white truncate">
                    {top2.costume_title}
                  </h3>
                  <span className="text-xs text-slate-300 block truncate">
                    {top2.public_display_name}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-black/50 border border-slate-400/30 text-xs">
                  <span className="text-slate-300 font-mono font-black text-base block">
                    {top2.total_live_combined} pts en Vivo
                  </span>
                  <span className="text-[10px] text-gray-400 block font-mono">
                    Pasarela: {top2.live_stage_votes} · Masiva: {top2.massive_votes} · Web: {top2.web_votes}
                  </span>
                </div>
              </div>
            )}

            {/* 1st Place (Center / Champion) */}
            {top1 && (
              <div className="p-5 rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-950/70 via-surface-card to-[#0A0D1B] shadow-[0_0_35px_rgba(251,191,36,0.4)] flex flex-col justify-between text-center space-y-3 order-1 md:order-2 scale-[1.03]">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/30 text-amber-300 font-black text-2xl flex items-center justify-center border-2 border-amber-400 shadow-glow-orange animate-bounce">
                  🥇 1º
                </div>
                <div className="relative aspect-square w-40 mx-auto rounded-2xl overflow-hidden bg-black/70 border-2 border-amber-400/70 shadow-lg">
                  <img
                    src={top1.photo_original_key || top1.photo_thumbnail_key}
                    alt={top1.costume_title}
                    className="w-full h-full object-contain p-1.5"
                  />
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-black/85 font-mono font-black text-xs text-amber-400 border border-amber-400/60">
                    #{top1.contest_number}
                  </span>
                </div>
                <div>
                  <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 text-[10px] font-black uppercase tracking-wider">
                    👑 Campeón Absoluto
                  </span>
                  <h3 className="font-display font-black text-lg text-white mt-1 truncate">
                    {top1.costume_title}
                  </h3>
                  <span className="text-xs text-halloween-lavender block truncate">
                    {top1.public_display_name}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-400/50 text-xs">
                  <span className="text-amber-300 font-mono font-black text-lg block">
                    {top1.total_live_combined} pts en Vivo
                  </span>
                  <span className="text-[10px] text-amber-200/80 block font-mono">
                    Pasarela: {top1.live_stage_votes} · Masiva: {top1.massive_votes} · Web: {top1.web_votes}
                  </span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div className="p-4 rounded-2xl border-2 border-amber-700/80 bg-gradient-to-b from-amber-950/50 to-[#0A0D1B] shadow-[0_0_20px_rgba(180,83,9,0.25)] flex flex-col justify-between text-center space-y-3 order-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-amber-800/30 text-amber-300 font-black text-lg flex items-center justify-center border border-amber-700">
                  🥉 3º
                </div>
                <div className="relative aspect-square w-32 mx-auto rounded-xl overflow-hidden bg-black/60 border border-amber-700/50">
                  <img
                    src={top3.photo_original_key || top3.photo_thumbnail_key}
                    alt={top3.costume_title}
                    className="w-full h-full object-contain p-1"
                  />
                  <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/80 font-mono text-[10px] text-white">
                    #{top3.contest_number}
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-black text-base text-white truncate">
                    {top3.costume_title}
                  </h3>
                  <span className="text-xs text-amber-200/80 block truncate">
                    {top3.public_display_name}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-black/50 border border-amber-700/40 text-xs">
                  <span className="text-amber-400 font-mono font-black text-base block">
                    {top3.total_live_combined} pts en Vivo
                  </span>
                  <span className="text-[10px] text-gray-400 block font-mono">
                    Pasarela: {top3.live_stage_votes} · Masiva: {top3.massive_votes} · Web: {top3.web_votes}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official Color Legend Banner */}
      <div className="p-4 rounded-2xl bg-[#0B0D1A] border border-halloween-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-halloween-lavender" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            Código de Colores de Clasificación Oficial:
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-300 shadow-sm" />
            <span className="text-amber-300 font-bold">1º al 3er Lugar (Podio)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500 border border-purple-300 shadow-sm" />
            <span className="text-purple-300 font-bold">Puestos 4º al 23º (Ganadores de Ronda)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-500" />
            <span className="text-gray-400">Puestos 24+ (Participación)</span>
          </div>
        </div>
      </div>

      {/* Main Comparison Table with Filters */}
      <div className="glass-panel p-6 rounded-3xl border border-halloween-border space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-gray-400 font-semibold mr-1">Ordenar por:</span>
            <button
              onClick={() => setSortBy('live_combined')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                sortBy === 'live_combined'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-surface-raised border border-halloween-border text-gray-400 hover:text-white'
              }`}
            >
              Total en Vivo (Pasarela + Masiva)
            </button>

            <button
              onClick={() => setSortBy('massive')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                sortBy === 'massive'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-surface-raised border border-halloween-border text-gray-400 hover:text-white'
              }`}
            >
              Votación Masiva
            </button>

            <button
              onClick={() => setSortBy('live_stage')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                sortBy === 'live_stage'
                  ? 'bg-halloween-orange text-black shadow-md'
                  : 'bg-surface-raised border border-halloween-border text-gray-400 hover:text-white'
              }`}
            >
              Pasarela 1-a-1
            </button>

            <button
              onClick={() => setSortBy('total_global')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                sortBy === 'total_global'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-surface-raised border border-halloween-border text-gray-400 hover:text-white'
              }`}
            >
              Gran Total
            </button>

            <button
              onClick={() => setSortBy('contest_number')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                sortBy === 'contest_number'
                  ? 'bg-gray-700 text-white shadow-md'
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
              placeholder="Buscar por disfraz o número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-raised border border-halloween-border text-xs text-white placeholder-halloween-muted focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-2xl border border-halloween-border/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0D1A] text-gray-400 font-mono text-[11px] uppercase tracking-wider border-b border-halloween-border">
              <tr>
                <th className="py-3.5 px-3.5 text-center">Posición</th>
                <th className="py-3.5 px-3"># Concurso</th>
                <th className="py-3.5 px-3">Disfraz & Concursante</th>
                <th className="py-3.5 px-3">Tipo</th>
                <th className="py-3.5 px-3 text-center">Pasarela 1-a-1</th>
                <th className="py-3.5 px-3 text-center">Votación Masiva</th>
                <th className="py-3.5 px-3 text-center bg-purple-950/20">TOTAL EN VIVO</th>
                <th className="py-3.5 px-3 text-center">Web (Galería)</th>
                <th className="py-3.5 px-3 text-center">GRAN TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-halloween-border/40 font-mono">
              {filteredResults.map((r, idx) => {
                const rank = idx + 1;
                const isTop1 = rank === 1;
                const isTop2 = rank === 2;
                const isTop3 = rank === 3;
                const isPodium = isTop1 || isTop2 || isTop3;
                const isWinnersGroup = rank >= 4 && rank <= 23;

                // Color classes according to user rules:
                // Top 3 in special celebratory gold/silver/bronze
                // Top 4 to 23 highlighted in electric purple/indigo
                // 24+ standard neutral
                const rowClasses = isTop1
                  ? 'bg-amber-500/15 border-l-4 border-l-amber-400 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.15)] font-semibold'
                  : isTop2
                  ? 'bg-slate-400/15 border-l-4 border-l-slate-300 text-slate-200 shadow-[0_0_15px_rgba(203,213,225,0.15)]'
                  : isTop3
                  ? 'bg-amber-800/15 border-l-4 border-l-amber-700 text-amber-300 shadow-[0_0_15px_rgba(180,83,9,0.15)]'
                  : isWinnersGroup
                  ? 'bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-purple-950/40 border-l-4 border-l-purple-500 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.1)]'
                  : 'bg-surface-card/40 text-gray-300 hover:bg-surface-raised/40';

                return (
                  <tr key={r.id} className={`transition-colors ${rowClasses}`}>
                    {/* Rank / Badge */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      {isTop1 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-400/30 border border-amber-400 text-amber-300 font-display font-black text-xs inline-flex items-center gap-1 shadow-sm">
                          🥇 1º Lugar
                        </span>
                      ) : isTop2 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-400/30 border border-slate-300 text-slate-200 font-display font-black text-xs inline-flex items-center gap-1 shadow-sm">
                          🥈 2º Lugar
                        </span>
                      ) : isTop3 ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-800/40 border border-amber-600 text-amber-300 font-display font-black text-xs inline-flex items-center gap-1 shadow-sm">
                          🥉 3º Lugar
                        </span>
                      ) : isWinnersGroup ? (
                        <div className="inline-flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-lg bg-purple-900/60 border border-purple-400/60 text-purple-200 font-display font-black text-xs">
                            #{rank}
                          </span>
                          <span className="hidden sm:inline text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            Top 4-23
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-bold">#{rank}</span>
                      )}
                    </td>

                    {/* Contest # */}
                    <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 border border-halloween-border text-halloween-orange">
                        #{String(r.contest_number).padStart(2, '0')}
                      </span>
                    </td>

                    {/* Costume & Name */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5 font-sans">
                        <img
                          src={r.photo_original_key || r.photo_thumbnail_key}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-black/40"
                          onError={(e) => {
                            if (r.photo_thumbnail_key && e.currentTarget.src !== r.photo_thumbnail_key) {
                              e.currentTarget.src = r.photo_thumbnail_key;
                            }
                          }}
                        />
                        <div className="truncate max-w-[220px] sm:max-w-xs">
                          <strong className="block text-white truncate text-xs">
                            {r.costume_title}
                          </strong>
                          <span className="text-[10px] text-halloween-muted block truncate">
                            {r.public_display_name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 whitespace-nowrap font-sans">
                      <span className="text-[11px] text-gray-400">
                        {r.participant_type === 'student' ? '🎓 Alumno' : '👨‍🏫 Profesor'}
                      </span>
                    </td>

                    {/* Live Stage 1-a-1 */}
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-orange-950/40 border border-orange-500/40 text-halloween-orange font-bold text-xs inline-block min-w-[34px]">
                        {r.live_stage_votes || 0}
                      </span>
                    </td>

                    {/* Massive Votes */}
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 font-bold text-xs inline-block min-w-[34px]">
                        {r.massive_votes || 0}
                      </span>
                    </td>

                    {/* TOTAL EN VIVO COMBINADO */}
                    <td className="py-3 px-3 text-center bg-purple-950/20">
                      <span className={`px-3 py-1 rounded-xl font-black text-xs inline-block min-w-[42px] shadow-sm ${
                        isPodium
                          ? 'bg-amber-400 text-black shadow-glow-orange scale-105'
                          : isWinnersGroup
                          ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                          : 'bg-purple-900/40 border border-purple-400/40 text-purple-200'
                      }`}>
                        {r.total_live_combined || 0}
                      </span>
                    </td>

                    {/* Web Votes */}
                    <td className="py-3 px-3 text-center text-gray-400">
                      <span className="text-xs">{r.web_votes || 0}</span>
                    </td>

                    {/* GRAN TOTAL */}
                    <td className="py-3 px-3 text-center">
                      <span className={`font-black text-xs ${isPodium ? 'text-amber-400 text-sm' : 'text-white'}`}>
                        {r.total_votes || 0}
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
