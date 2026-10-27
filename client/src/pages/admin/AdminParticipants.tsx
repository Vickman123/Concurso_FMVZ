import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Edit2,
  Eye,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  User,
  Sparkles,
  ShieldCheck,
  IdCard,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Participant } from '../../types';

export const AdminParticipants: React.FC = () => {
  const { token, admin } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Detailed Review Modal
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [newStatus, setNewStatus] = useState<string>('approved');
  const [statusReason, setStatusReason] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [copiedFolio, setCopiedFolio] = useState(false);

  // CSV Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/admin/participants?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [statusFilter, typeFilter, search, token]);

  const handleUpdateStatus = async (statusToSet?: string) => {
    if (!selectedParticipant) return;
    const finalStatus = statusToSet || newStatus;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/participants/${selectedParticipant.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: finalStatus, reason: statusReason }),
      });
      if (res.ok) {
        setSelectedParticipant(null);
        setStatusReason('');
        fetchParticipants();
      } else {
        const d = await res.json();
        alert(d.error || 'Error al actualizar estado');
      }
    } catch (err: any) {
      alert('Error al conectar con el servidor');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const res = await fetch('/api/admin/participants/import-csv', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      setImportResult(data);
      if (data.success) {
        fetchParticipants();
      }
    } catch (err: any) {
      setImportResult({ error: 'Error al subir archivo CSV' });
    } finally {
      setImporting(false);
    }
  };

  const handleExportCsv = () => {
    window.open(`/api/admin/participants/export-csv?auth=${token}`, '_blank');
  };

  const copyFolio = (folio: string) => {
    navigator.clipboard.writeText(folio);
    setCopiedFolio(true);
    setTimeout(() => setCopiedFolio(false), 2000);
  };

  // Status counts for quick stats
  const pendingCount = participants.filter((p) => p.status === 'pending').length;
  const approvedCount = participants.filter((p) => p.status === 'approved').length;
  const correctionCount = participants.filter((p) => p.status === 'needs_correction').length;
  const rejectedCount = participants.filter((p) => p.status === 'rejected').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Aprobado</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
            <Clock className="w-3 h-3" />
            <span>Pendiente</span>
          </span>
        );
      case 'needs_correction':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>Corrección</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
            <XCircle className="w-3 h-3" />
            <span>Rechazado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">
            <span>Inactivo</span>
          </span>
        );
    }
  };

  const openReviewModal = (p: Participant) => {
    setSelectedParticipant(p);
    setNewStatus(p.status);
    setStatusReason('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Participantes Registrados
          </h1>
          <p className="text-xs text-halloween-muted mt-1">
            Administración, moderación y validación institucional de concursantes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchParticipants}
            className="p-2 rounded-xl text-gray-300 bg-surface-raised hover:bg-surface-subtle border border-halloween-border transition-colors"
            title="Recargar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {admin?.role === 'admin' && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-halloween-lavender bg-surface-raised hover:bg-surface-subtle border border-halloween-border flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar CSV</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-200 bg-surface-raised hover:bg-surface-subtle border border-halloween-border flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Status Bar & Priority Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Pending Priority Card */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'pending'
              ? 'bg-amber-500/15 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
              : 'bg-surface-card border-halloween-border hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Pendientes</span>
            </span>
            {pendingCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{pendingCount}</span>
            <span className="text-[10px] text-amber-300/80 font-medium">requieren revisión</span>
          </div>
        </button>

        {/* Approved Card */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'approved'
              ? 'bg-emerald-500/15 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
              : 'bg-surface-card border-halloween-border hover:border-emerald-500/40'
          }`}
        >
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aprobados</span>
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{approvedCount}</span>
            <span className="text-[10px] text-gray-400 font-medium">en galería</span>
          </div>
        </button>

        {/* Correction Card */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'needs_correction' ? 'all' : 'needs_correction')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'needs_correction'
              ? 'bg-orange-500/15 border-orange-500/60 shadow-[0_0_20px_rgba(255,116,23,0.2)]'
              : 'bg-surface-card border-halloween-border hover:border-orange-500/40'
          }`}
        >
          <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Corrección</span>
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{correctionCount}</span>
            <span className="text-[10px] text-gray-400 font-medium">por corregir</span>
          </div>
        </button>

        {/* Total Card */}
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'all' && !search
              ? 'bg-surface-raised border-halloween-purple/50'
              : 'bg-surface-card border-halloween-border hover:border-halloween-purple/30'
          }`}
        >
          <span className="text-[11px] font-bold text-halloween-lavender uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>Total</span>
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{participants.length}</span>
            <span className="text-[10px] text-gray-400 font-medium">postulaciones</span>
          </div>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-surface-card border border-halloween-border flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-halloween-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre real, nombre público, título, # de cuenta o folio..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-raised border border-halloween-border text-xs text-white placeholder-halloween-muted focus:outline-none focus:border-halloween-purple"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-surface-raised border border-halloween-border text-xs text-white focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">⏳ Solo Pendientes (Prioridad)</option>
            <option value="approved">✅ Aprobados</option>
            <option value="needs_correction">⚠️ Requiere corrección</option>
            <option value="rejected">❌ Rechazados</option>
            <option value="inactive">Inactivos</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-surface-raised border border-halloween-border text-xs text-white focus:outline-none"
          >
            <option value="all">Estudiantes y trabajadores</option>
            <option value="student">🎓 Solo Estudiantes</option>
            <option value="worker">💼 Solo Trabajadores</option>
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <div className="rounded-3xl bg-surface-card border border-halloween-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-halloween-border bg-surface-raised/40 text-gray-400">
                <th className="py-3.5 px-4 font-semibold">#</th>
                <th className="py-3.5 px-4 font-semibold">Foto</th>
                <th className="py-3.5 px-4 font-semibold">Disfraz</th>
                <th className="py-3.5 px-4 font-semibold">Nombre Público</th>
                <th className="py-3.5 px-4 font-semibold">Nombre Real (Privado)</th>
                <th className="py-3.5 px-4 font-semibold">Identificador</th>
                <th className="py-3.5 px-4 font-semibold">Estado</th>
                <th className="py-3.5 px-4 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-halloween-border/40">
              {participants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <User className="w-8 h-8 text-halloween-muted mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-white">No hay participantes registrados</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Las nuevas postulaciones de los alumnos aparecerán aquí automáticamente.
                    </p>
                  </td>
                </tr>
              ) : (
                participants.map((p) => {
                  const isPending = p.status === 'pending';
                  return (
                    <tr
                      key={p.contest_number}
                      onClick={() => openReviewModal(p)}
                      className={`cursor-pointer transition-colors ${
                        isPending
                          ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.09] border-l-4 border-l-amber-500'
                          : 'hover:bg-surface-raised/40'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-halloween-orange">
                        #{String(p.contest_number).padStart(2, '0')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="relative w-11 h-13 rounded-lg overflow-hidden border border-halloween-border bg-surface-raised">
                          <img
                            src={p.photo_original_key}
                            alt=""
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/costume_default.svg';
                            }}
                            className="w-full h-full object-cover"
                          />
                          {isPending && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-[#15182A]" />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <strong className="text-white block text-sm font-bold">
                          {p.costume_title}
                        </strong>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              p.participant_type === 'student'
                                ? 'bg-halloween-purple/20 text-[#B79AFF]'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {p.participant_type === 'student' ? '🎓 Estudiante' : '💼 Trabajador'}
                          </span>
                          {isPending && (
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                              • Requiere revisión
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-halloween-lavender">
                        {p.public_display_name}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 font-medium">
                        {p.full_name || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-400">
                        {p.institutional_identifier || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openReviewModal(p)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-halloween-purple/20 hover:bg-halloween-purple/40 border border-halloween-purple/40 transition-colors inline-flex items-center gap-1.5"
                          title="Revisar y moderar"
                        >
                          <Eye className="w-3.5 h-3.5 text-halloween-purple-light" />
                          <span>Revisar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== POPUP DETALLADO DE REVISIÓN Y MODERACIÓN ===================== */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-surface-card border border-halloween-purple/40 p-6 sm:p-7 shadow-2xl relative text-left">
            {/* Close Button */}
            <button
              onClick={() => setSelectedParticipant(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-surface-raised hover:bg-surface-subtle text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-wrap items-center gap-3 pr-10 pb-4 border-b border-halloween-border">
              <span className="px-3 py-1 rounded-xl bg-halloween-orange/20 text-halloween-orange font-mono font-black text-sm border border-halloween-orange/30">
                #{String(selectedParticipant.contest_number).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-white">
                  {selectedParticipant.costume_title}
                </h3>
                <p className="text-xs text-halloween-muted mt-0.5">
                  Revisión de solicitud de inscripción al certamen
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {getStatusBadge(selectedParticipant.status)}
              </div>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5">
              {/* Left Column: Full Photo */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="relative w-full aspect-[3/4] max-h-[380px] rounded-2xl overflow-hidden border-2 border-halloween-purple/40 bg-black/60 shadow-inner group">
                  <img
                    src={selectedParticipant.photo_original_key}
                    alt={selectedParticipant.costume_title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/costume_default.svg';
                    }}
                    className="w-full h-full object-contain"
                  />
                  <a
                    href={selectedParticipant.photo_original_key}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-sm transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver original</span>
                  </a>
                </div>
                <span className="text-[11px] text-gray-400 mt-2 text-center">
                  Fotografía enviada por el concursante
                </span>
              </div>

              {/* Right Column: Participant Details */}
              <div className="md:col-span-7 space-y-4">
                {/* Costume description */}
                <div className="p-3.5 rounded-2xl bg-surface-raised border border-halloween-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-halloween-orange block mb-1">
                    Concepto / Descripción del disfraz
                  </span>
                  <p className="text-xs text-gray-200 leading-relaxed italic">
                    "{selectedParticipant.description || 'Sin descripción detallada proporcionada.'}"
                  </p>
                </div>

                {/* Structured Student / Worker Info Card */}
                <div className="space-y-3 p-4 rounded-2xl bg-surface-raised/60 border border-halloween-border text-xs">
                  {/* Real Name */}
                  <div className="flex items-start justify-between pb-2 border-b border-halloween-border/40">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-halloween-purple-light" />
                      <span>Nombre Real (Privado):</span>
                    </span>
                    <strong className="text-white text-right font-bold">
                      {selectedParticipant.full_name || 'No especificado'}
                    </strong>
                  </div>

                  {/* Public Display Name */}
                  <div className="flex items-start justify-between pb-2 border-b border-halloween-border/40">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-halloween-orange" />
                      <span>Nombre Público (Concurso):</span>
                    </span>
                    <strong className="text-halloween-lavender text-right font-bold">
                      {selectedParticipant.public_display_name}
                    </strong>
                  </div>

                  {/* Participant Type */}
                  <div className="flex items-center justify-between pb-2 border-b border-halloween-border/40">
                    <span className="text-gray-400">Tipo de Comunidad:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        selectedParticipant.participant_type === 'student'
                          ? 'bg-halloween-purple/20 text-[#B79AFF] border border-halloween-purple/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {selectedParticipant.participant_type === 'student'
                        ? '🎓 Estudiante UNAM'
                        : '💼 Trabajador / Académico'}
                    </span>
                  </div>

                  {/* Institutional Identifier */}
                  <div className="flex items-center justify-between pb-2 border-b border-halloween-border/40">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {selectedParticipant.participant_type === 'student'
                          ? 'Número de Cuenta UNAM:'
                          : 'Número de Trabajador:'}
                      </span>
                    </span>
                    <code className="font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800">
                      {selectedParticipant.institutional_identifier}
                    </code>
                  </div>

                  {/* Folio */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Folio de Registro:</span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-gray-300">
                        {selectedParticipant.registration_folio}
                      </code>
                      <button
                        onClick={() => copyFolio(selectedParticipant.registration_folio || '')}
                        className="p-1 rounded hover:bg-surface-subtle text-gray-400 hover:text-white"
                        title="Copiar folio"
                      >
                        {copiedFolio ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Moderation note */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Motivo / Observaciones de la moderación (Bitácora oficial):
                  </label>
                  <textarea
                    rows={2}
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Ej. Fotografía de excelente calidad validada según bases oficiales."
                    className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-halloween-border text-xs text-white placeholder-halloween-muted resize-none focus:outline-none focus:border-halloween-purple"
                  />
                  {/* Preset Quick Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setStatusReason('Fotografía nítida y caracterización válida según bases.')}
                      className="px-2 py-1 rounded-lg bg-surface-raised hover:bg-surface-subtle text-[10px] text-gray-300 border border-halloween-border"
                    >
                      ✓ Fotografía nítida y válida
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusReason('La fotografía no es clara. Por favor vuelve a subir una foto frontal y nítida.')}
                      className="px-2 py-1 rounded-lg bg-surface-raised hover:bg-surface-subtle text-[10px] text-gray-300 border border-halloween-border"
                    >
                      ⚠ Foto no clara / pedir frontal
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusReason('No cumple con las bases del certamen de disfraces.')}
                      className="px-2 py-1 rounded-lg bg-surface-raised hover:bg-surface-subtle text-[10px] text-gray-300 border border-halloween-border"
                    >
                      ✕ No cumple bases
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Intuitive Action Buttons Bar */}
            <div className="mt-6 pt-5 border-t border-halloween-border">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">
                Acción directa de moderación:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Approve */}
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus('approved')}
                  className="py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 shadow-[0_4px_15px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aprobar (Publicar en galería)</span>
                </button>

                {/* 2. Needs Correction */}
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus('needs_correction')}
                  className="py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-amber-600 to-orange-500 hover:brightness-110 shadow-[0_4px_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Solicitar Corrección de Foto</span>
                </button>

                {/* 3. Reject */}
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus('rejected')}
                  className="py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-600 to-red-500 hover:brightness-110 shadow-[0_4px_15px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Rechazar Solicitud</span>
                </button>
              </div>

              <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                <button
                  type="button"
                  onClick={() => setSelectedParticipant(null)}
                  className="hover:text-white"
                >
                  Cerrar sin guardar cambios
                </button>
                {selectedParticipant.status !== 'pending' && (
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus('pending')}
                    className="text-amber-400/80 hover:text-amber-300 font-semibold text-[11px]"
                  >
                    Restablecer a Pendiente
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-surface-card border border-halloween-border p-6 space-y-4 shadow-2xl text-left">
            <h3 className="font-display font-bold text-lg text-white">
              Importar Participantes mediante CSV
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Sube un archivo CSV con las columnas: <code>nombre_completo, titulo_disfraz, tipo_participante, identificador_institucional</code>. El sistema detectará y omitirá automáticamente registros con identificadores duplicados.
            </p>

            <form onSubmit={handleImportCsv} className="space-y-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-halloween-purple file:text-white"
              />

              {importResult && (
                <div
                  className={`p-3 rounded-xl text-xs ${
                    importResult.success
                      ? 'bg-emerald-950/40 text-emerald-200 border border-emerald-800'
                      : 'bg-red-950/40 text-red-200 border border-red-800'
                  }`}
                >
                  {importResult.message || importResult.error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportResult(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-300 bg-surface-raised"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-halloween-orange hover:bg-halloween-orange-dark disabled:opacity-50"
                >
                  {importing ? 'Procesando...' : 'Iniciar Importación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
