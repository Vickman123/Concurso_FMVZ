import React, { useState, useEffect } from 'react';
import { Sliders, QrCode, Download, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminSettings: React.FC = () => {
  const { token, admin } = useAuth();

  const [votingStatus, setVotingStatus] = useState('open');
  const [regLimit, setRegLimit] = useState(100);
  const [additionalMethod, setAdditionalMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contest/settings');
      if (res.ok) {
        const data = await res.json();
        setVotingStatus(data.voting_status || 'open');
        setRegLimit(data.registration_limit || 100);
        setAdditionalMethod(data.additional_prizes_method || '');
      }

      // Generate QR
      const publicUrl = window.location.origin;
      const qrRes = await fetch(`/api/admin/qr?url=${encodeURIComponent(publicUrl)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        setQrDataUrl(qrData.qr_data_url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          voting_status: votingStatus,
          registration_limit: Number(regLimit),
          additional_prizes_method: additionalMethod,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert('Error al guardar configuración');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
          Configuración Global del Evento
        </h1>
        <p className="text-xs text-halloween-muted mt-1">
          Apertura/cierre de votación, cupos y generador de carteles con código QR.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Form */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 border border-halloween-border space-y-6">
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {savedSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Configuración guardada exitosamente en el servidor.</span>
              </div>
            )}

            {/* Voting Switch */}
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">
                Estado del Periodo de Votación
              </label>
              <select
                value={votingStatus}
                onChange={(e) => setVotingStatus(e.target.value)}
                disabled={admin?.role !== 'admin'}
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-white text-xs font-semibold focus:outline-none focus:border-halloween-purple disabled:opacity-50"
              >
                <option value="open">🟢 Abierta (Permite emitir votos a usuarios identificados)</option>
                <option value="paused">🟡 Pausada (Votación suspendida temporalmente)</option>
                <option value="closed">🔴 Cerrada (Votación finalizada para cómputo de resultados)</option>
                <option value="upcoming">⏳ Próxima (Previo a la apertura oficial)</option>
              </select>
            </div>

            {/* Capacity Limit */}
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">
                Límite de Capacidad de Participantes
              </label>
              <input
                type="number"
                min={57}
                max={150}
                value={regLimit}
                onChange={(e) => setRegLimit(Number(e.target.value))}
                disabled={admin?.role !== 'admin'}
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-white font-mono text-xs disabled:opacity-50"
              />
              <span className="text-[11px] text-halloween-muted mt-1 block">
                Objetivo institucional: 100 participantes (57 registros activos actualmente).
              </span>
            </div>

            {/* Additional prizes text */}
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">
                Nota Pública sobre Asignación de 20 Premios Adicionales
              </label>
              <textarea
                rows={3}
                value={additionalMethod}
                onChange={(e) => setAdditionalMethod(e.target.value)}
                disabled={admin?.role !== 'admin'}
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-halloween-border text-white text-xs resize-none disabled:opacity-50"
              />
            </div>

            {admin?.role === 'admin' && (
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-halloween-purple hover:bg-halloween-purple-dark shadow-glow-purple flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Parámetros del Concurso</span>
              </button>
            )}
          </form>
        </div>

        {/* QR Code Poster Generator */}
        <div className="glass-card rounded-3xl p-6 border border-halloween-purple/40 text-center space-y-4 shadow-glow-purple">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-halloween-purple/20 text-halloween-lavender flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              Código QR Oficial
            </h3>
            <p className="text-xs text-halloween-muted mt-1">
              Para mamparas, carteles y proyección en el auditorio de la FMVZ.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl inline-block mx-auto border-4 border-halloween-orange/60 shadow-inner">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Concurso" className="w-48 h-48 mx-auto" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-gray-500 text-xs">
                Cargando...
              </div>
            )}
          </div>

          <div className="font-mono text-[11px] text-halloween-lavender break-all px-2">
            {window.location.origin}
          </div>

          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download="QR_Concurso_Disfraces_FMVZ_2026.png"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-halloween-orange to-amber-600 hover:from-halloween-orange-dark hover:to-halloween-orange shadow-glow-orange transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PNG de Alta Resolución</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
