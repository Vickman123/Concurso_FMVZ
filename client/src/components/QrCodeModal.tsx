import React from 'react';
import { X, QrCode } from 'lucide-react';
import { CustomQrWithLogo } from './CustomQrWithLogo';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0E1122] border border-halloween-purple/50 p-6 sm:p-7 text-center shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-halloween-muted hover:text-white rounded-full bg-surface-raised hover:bg-surface-subtle transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 mx-auto rounded-2xl bg-halloween-purple/20 text-halloween-lavender flex items-center justify-center border border-halloween-purple/40 shadow-glow-purple">
          <QrCode className="w-6 h-6 text-halloween-orange" />
        </div>

        <div>
          <h3 className="font-display font-bold text-xl text-halloween-white">
            Código QR Oficial FMVZ Halloween
          </h3>
          <p className="text-xs text-halloween-muted mt-1">
            Escanea con la cámara de cualquier teléfono para ingresar a la votación en tiempo real.
          </p>
        </div>

        {/* Custom QR Code with centered Pumpkin Logo */}
        <CustomQrWithLogo
          size={260}
          showLogo={true}
          logoSrc="/logos/qr-emblem-clean.png"
          showActions={true}
        />
      </div>
    </div>
  );
};
