import React, { useState, useEffect } from 'react';
import { X, QrCode, Download, ExternalLink, Copy, Check } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://fmvz.unam.mx/halloween-2026';

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/admin/qr?url=${encodeURIComponent(currentUrl)}`)
        .then(res => res.json())
        .then(data => {
          if (data.qr_data_url) {
            setQrDataUrl(data.qr_data_url);
          }
        })
        .catch(() => {
          // fallback placeholder
        });
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-surface-card border border-halloween-purple/40 p-6 text-center shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-halloween-muted hover:text-white rounded-full bg-surface-raised hover:bg-surface-subtle"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 mx-auto rounded-2xl bg-halloween-purple/20 text-halloween-lavender flex items-center justify-center border border-halloween-purple/40">
          <QrCode className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-display font-bold text-xl text-halloween-white">
            Código QR del Evento
          </h3>
          <p className="text-xs text-halloween-muted mt-1">
            Escanea con la cámara de tu celular para ingresar al concurso desde cualquier lugar del campus.
          </p>
        </div>

        {/* QR Image */}
        <div className="p-4 bg-white rounded-2xl shadow-inner inline-block mx-auto border-4 border-halloween-orange/60">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Código QR del Concurso" className="w-48 h-48 mx-auto" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-gray-500 text-xs">
              Generando QR...
            </div>
          )}
        </div>

        <div className="bg-surface-raised rounded-xl p-2.5 flex items-center justify-between gap-2 border border-halloween-border text-xs">
          <span className="truncate text-halloween-lavender text-left font-mono">
            {currentUrl}
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-surface-card hover:bg-halloween-purple/20 text-halloween-white flex-shrink-0"
            title="Copiar enlace"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Download Button */}
        {qrDataUrl && (
          <a
            href={qrDataUrl}
            download="QR_Concurso_Disfraces_FMVZ_2026.png"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-halloween-purple to-indigo-600 hover:from-halloween-purple-dark hover:to-halloween-purple shadow-glow-purple transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Descargar imagen QR</span>
          </a>
        )}
      </div>
    </div>
  );
};
