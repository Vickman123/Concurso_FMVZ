import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Share2, Copy, Check, Sparkles } from 'lucide-react';

interface CustomQrWithLogoProps {
  url?: string;
  size?: number;
  showLogo?: boolean;
  logoSrc?: string;
  showActions?: boolean;
  className?: string;
}

export const CustomQrWithLogo: React.FC<CustomQrWithLogoProps> = ({
  url,
  size = 320,
  showLogo = true,
  logoSrc = '/logos/concurso-fmvz-square.jpg',
  showActions = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetUrl = url || window.location.origin;
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const renderQrWithLogo = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        // 1. Generate QR Code with High Error Correction ('H' = 30% redundancy)
        await QRCode.toCanvas(canvas, targetUrl, {
          width: size,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#080A12',
            light: '#FFFFFF',
          },
        });

        if (isCancelled) return;

        // 2. Overlay center emblem badge if showLogo is true
        if (showLogo) {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          logoImg.src = logoSrc;

          logoImg.onload = () => {
            if (isCancelled) return;

            const center = size / 2;
            const badgeRadius = size * 0.16;

            // Save context
            ctx.save();

            // Draw white background circle for maximum contrast & scannability
            ctx.beginPath();
            ctx.arc(center, center, badgeRadius + 4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
            ctx.shadowBlur = 8;
            ctx.fill();

            // Draw orange/violet ring
            ctx.beginPath();
            ctx.arc(center, center, badgeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#0F1222';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#FF7417';
            ctx.stroke();

            // Draw pumpkin icon in center
            const iconSize = badgeRadius * 1.4;
            ctx.drawImage(
              logoImg,
              center - iconSize / 2,
              center - iconSize / 2,
              iconSize,
              iconSize
            );

            ctx.restore();
            setReady(true);
          };

          logoImg.onerror = () => {
            setReady(true);
          };
        } else {
          setReady(true);
        }
      } catch (err) {
        console.error('Error generating custom QR code:', err);
      }
    };

    renderQrWithLogo();

    return () => {
      isCancelled = true;
    };
  }, [targetUrl, size, showLogo, logoSrc]);

  // Download raw QR with embedded logo
  const handleDownloadQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `QR_Concurso_Disfraces_FMVZ_2026.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Generate and download a full branded promotional poster
  const handleDownloadPoster = () => {
    const qrCanvas = canvasRef.current;
    if (!qrCanvas) return;

    const posterCanvas = document.createElement('canvas');
    const posterWidth = 800;
    const posterHeight = 1100;
    posterCanvas.width = posterWidth;
    posterCanvas.height = posterHeight;
    const ctx = posterCanvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, posterHeight);
    bgGrad.addColorStop(0, '#080A12');
    bgGrad.addColorStop(0.5, '#121528');
    bgGrad.addColorStop(1, '#080A12');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, posterWidth, posterHeight);

    // Decorative orange & purple ambient glow
    const orangeGlow = ctx.createRadialGradient(posterWidth / 2, 220, 10, posterWidth / 2, 220, 300);
    orangeGlow.addColorStop(0, 'rgba(255, 116, 23, 0.2)');
    orangeGlow.addColorStop(1, 'rgba(255, 116, 23, 0)');
    ctx.fillStyle = orangeGlow;
    ctx.fillRect(0, 0, posterWidth, posterHeight);

    // Border frame
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, posterWidth - 60, posterHeight - 60);

    // Header badge
    ctx.font = 'bold 20px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#B79AFF';
    ctx.textAlign = 'center';
    ctx.fillText('✦ SEGUNDO CONCURSO DE DISFRACES ✦', posterWidth / 2, 110);

    // Main title
    ctx.font = '900 52px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('FMVZ HALLOWEEN', posterWidth / 2, 175);

    // Subtitle
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#FF9A24';
    ctx.fillText('¡Escanea para votar en vivo por tu favorito!', posterWidth / 2, 225);

    // Draw QR Code onto Poster with white rounded border
    const qrBoxSize = 460;
    const qrX = (posterWidth - qrBoxSize) / 2;
    const qrY = 280;

    // White card background behind QR
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrBoxSize, qrBoxSize, 28);
    ctx.fill();

    // Draw QR canvas inside
    ctx.drawImage(qrCanvas, qrX + 20, qrY + 20, qrBoxSize - 40, qrBoxSize - 40);

    // Instructions
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#F7F4F0';
    ctx.fillText('Apunta la cámara de tu celular y vota al instante', posterWidth / 2, 800);

    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#A7ABC0';
    ctx.fillText('1. Abre tu cámara  ·  2. Escanea el código  ·  3. Elige tu disfraz', posterWidth / 2, 835);

    // Event metadata pill
    ctx.font = 'bold 20px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#FF7417';
    ctx.fillText('3 DE NOVIEMBRE DE 2026  ·  SEDE FMVZ', posterWidth / 2, 940);

    ctx.font = '16px "JetBrains Mono", monospace';
    ctx.fillStyle = '#8B5CF6';
    ctx.fillText(targetUrl, posterWidth / 2, 980);

    // Download poster image
    const posterDataUrl = posterCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = posterDataUrl;
    a.download = `Poster_Oficial_Votacion_FMVZ_Halloween_2026.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Segundo Concurso de Disfraces FMVZ 2026',
          text: '¡Entra y vota en vivo por los mejores disfraces de FMVZ Halloween!',
          url: targetUrl,
        });
      } catch {
        // ignored
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Canvas QR Card */}
      <div className="relative p-3.5 bg-white rounded-3xl shadow-glow-orange border-4 border-halloween-orange/60 transition-transform hover:scale-[1.02]">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-2xl block mx-auto"
        />
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#080A12] border border-halloween-orange text-[10px] font-bold text-halloween-orange tracking-wider uppercase shadow-md flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>VOTACIÓN EN VIVO</span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <span className="font-mono text-[11px] text-halloween-lavender block break-all max-w-xs">
          {targetUrl}
        </span>
      </div>

      {showActions && (
        <div className="mt-5 w-full max-w-xs space-y-2">
          <button
            onClick={handleDownloadQr}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-halloween-orange to-amber-600 hover:from-halloween-orange-dark hover:to-halloween-orange shadow-glow-orange transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Descargar QR con Logo (PNG)</span>
          </button>

          <button
            onClick={handleDownloadPoster}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-surface-raised border border-halloween-purple/50 hover:border-halloween-purple text-halloween-lavender hover:text-white transition-all"
          >
            <Download className="w-4 h-4 text-halloween-purple-light" />
            <span>Descargar Cartel Completo para Imprimir</span>
          </button>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-[#15182A] border border-halloween-border text-gray-300 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar link'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-[#15182A] border border-halloween-border text-gray-300 hover:text-white transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
