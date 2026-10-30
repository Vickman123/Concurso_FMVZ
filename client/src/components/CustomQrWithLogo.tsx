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

// Helper to draw clean rounded rectangles with cross-browser compatibility
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export const CustomQrWithLogo: React.FC<CustomQrWithLogoProps> = ({
  url,
  size = 320,
  showLogo = true,
  logoSrc = '/logos/qr-emblem-clean.png',
  showActions = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetUrl = url || window.location.origin;
  const [copied, setCopied] = useState(false);
  const [, setReady] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const renderQrWithLogo = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        // High-DPI buffer (minimum 1024px) for vector-crisp Retina rendering and high-res download
        const renderSize = Math.max(size * 4, 1024);

        // 1. Generate QR Code with High Error Correction ('H' = 30% redundancy)
        await QRCode.toCanvas(canvas, targetUrl, {
          width: renderSize,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#05070E',
            light: '#FFFFFF',
          },
        });

        // Ensure canvas display size in CSS matches the specified prop
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;

        if (isCancelled) return;

        // 2. Overlay center emblem badge if showLogo is true and size is large enough
        const shouldDrawLogo = showLogo && size >= 100;
        if (shouldDrawLogo) {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          logoImg.src = logoSrc;

          logoImg.onload = () => {
            if (isCancelled) return;

            const center = renderSize / 2;
            // Badge occupies ~28% of QR width (~7.8% of area), safely under 30% error correction budget
            const badgeSize = Math.round(renderSize * 0.28);
            const cornerRadius = Math.round(badgeSize * 0.16);
            const halfBadge = badgeSize / 2;
            const badgeX = center - halfBadge;
            const badgeY = center - halfBadge;

            ctx.save();
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // 1. Outer white buffer / quiet zone to isolate QR data modules
            drawRoundedRect(ctx, badgeX - 8, badgeY - 8, badgeSize + 16, badgeSize + 16, cornerRadius + 6);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
            ctx.shadowBlur = 12;
            ctx.fill();

            // 2. Dark badge container
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            drawRoundedRect(ctx, badgeX, badgeY, badgeSize, badgeSize, cornerRadius);
            ctx.fillStyle = '#05070E';
            ctx.fill();

            // 3. Halloween Neon Orange accent border
            ctx.lineWidth = Math.max(4, Math.round(renderSize * 0.005));
            ctx.strokeStyle = '#FF7417';
            ctx.stroke();

            // 4. Clip strictly to the rounded rectangle so no image edges spill
            ctx.save();
            drawRoundedRect(ctx, badgeX + 2, badgeY + 2, badgeSize - 4, badgeSize - 4, cornerRadius - 2);
            ctx.clip();
            ctx.drawImage(logoImg, badgeX, badgeY, badgeSize, badgeSize);
            ctx.restore();

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

  // Download raw QR with embedded logo in ultra high definition (1024x1024+ PNG)
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

  // Generate and download a full branded promotional poster in high resolution (1400x1800 PNG)
  const handleDownloadPoster = () => {
    const qrCanvas = canvasRef.current;
    if (!qrCanvas) return;

    const posterCanvas = document.createElement('canvas');
    const posterWidth = 1400;
    const posterHeight = 1800;
    posterCanvas.width = posterWidth;
    posterCanvas.height = posterHeight;
    const ctx = posterCanvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Deep Halloween atmospheric gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, posterHeight);
    bgGrad.addColorStop(0, '#05070E');
    bgGrad.addColorStop(0.4, '#101326');
    bgGrad.addColorStop(0.7, '#161226');
    bgGrad.addColorStop(1, '#05070E');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, posterWidth, posterHeight);

    // 2. Ambient radial glows
    const orangeGlow = ctx.createRadialGradient(posterWidth / 2, 280, 10, posterWidth / 2, 280, 520);
    orangeGlow.addColorStop(0, 'rgba(255, 116, 23, 0.25)');
    orangeGlow.addColorStop(1, 'rgba(255, 116, 23, 0)');
    ctx.fillStyle = orangeGlow;
    ctx.fillRect(0, 0, posterWidth, posterHeight);

    const purpleGlow = ctx.createRadialGradient(posterWidth / 2, 1400, 20, posterWidth / 2, 1400, 650);
    purpleGlow.addColorStop(0, 'rgba(139, 92, 246, 0.18)');
    purpleGlow.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = purpleGlow;
    ctx.fillRect(0, 0, posterWidth, posterHeight);

    // 3. Double decorative border frame
    drawRoundedRect(ctx, 36, 36, posterWidth - 72, posterHeight - 72, 36);
    ctx.strokeStyle = 'rgba(255, 116, 23, 0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();

    drawRoundedRect(ctx, 48, 48, posterWidth - 96, posterHeight - 96, 28);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. University & Faculty Header
    ctx.textAlign = 'center';

    ctx.font = 'bold 22px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#D4AF37';
    ctx.fillText('✦ UNIVERSIDAD NACIONAL AUTÓNOMA DE MÉXICO ✦', posterWidth / 2, 110);

    ctx.font = 'bold 28px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#F1F5F9';
    ctx.fillText('FACULTAD DE MEDICINA VETERINARIA Y ZOOTECNIA', posterWidth / 2, 155);

    // Event Pill Badge
    const pillW = 460;
    const pillH = 42;
    const pillX = (posterWidth - pillW) / 2;
    const pillY = 185;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 21);
    ctx.fillStyle = 'rgba(255, 116, 23, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#FF7417';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#FFA843';
    ctx.fillText('SEGUNDO CONCURSO DE DISFRACES 2026', posterWidth / 2, pillY + 27);

    // 5. Main Title with intense glowing effect
    ctx.save();
    ctx.font = '900 86px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FF7417';
    ctx.shadowBlur = 35;
    ctx.fillText('FMVZ HALLOWEEN', posterWidth / 2, 310);
    ctx.restore();

    // Subtitle
    ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#FF9A24';
    ctx.fillText('¡Escanea con tu celular y vota en vivo por tu favorito!', posterWidth / 2, 365);

    ctx.font = '19px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#B79AFF';
    ctx.fillText('Apoya a tus compañeros y elige al ganador de la pasarela universitaria', posterWidth / 2, 405);

    // 6. Draw Ultra-Crisp High-Res QR Card
    const qrCardSize = 740;
    const qrCardX = (posterWidth - qrCardSize) / 2;
    const qrCardY = 450;

    // Outer glow for the card
    ctx.save();
    drawRoundedRect(ctx, qrCardX, qrCardY, qrCardSize, qrCardSize, 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(255, 116, 23, 0.4)';
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.restore();

    // Card border
    drawRoundedRect(ctx, qrCardX, qrCardY, qrCardSize, qrCardSize, 44);
    ctx.strokeStyle = '#FF7417';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Inner QR Image drawn directly from the High-DPI buffer
    const qrInnerSize = 660;
    const qrInnerX = qrCardX + (qrCardSize - qrInnerSize) / 2;
    const qrInnerY = qrCardY + (qrCardSize - qrInnerSize) / 2;
    ctx.drawImage(qrCanvas, qrInnerX, qrInnerY, qrInnerSize, qrInnerSize);

    // 7. Badge tag under QR card
    const badgeTagW = 340;
    const badgeTagH = 46;
    const badgeTagX = (posterWidth - badgeTagW) / 2;
    const badgeTagY = qrCardY + qrCardSize - 23;

    drawRoundedRect(ctx, badgeTagX, badgeTagY, badgeTagW, badgeTagH, 23);
    ctx.fillStyle = '#080A12';
    ctx.fill();
    ctx.strokeStyle = '#FF7417';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#FF9A24';
    ctx.fillText('⚡ URNA ELECTRÓNICA ACTIVA ⚡', posterWidth / 2, badgeTagY + 29);

    // 8. Voting Steps
    ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText('¿Cómo votar desde el público?', posterWidth / 2, 1270);

    // 3 Step Pills
    const steps = [
      '1. Abre tu cámara',
      '2. Escanea el código',
      '3. Vota por tu favorito',
    ];
    const stepBoxW = 320;
    const stepBoxH = 50;
    const gap = 20;
    const totalStepsW = 3 * stepBoxW + 2 * gap;
    const startX = (posterWidth - totalStepsW) / 2;
    const stepY = 1305;

    steps.forEach((step, idx) => {
      const bx = startX + idx * (stepBoxW + gap);
      drawRoundedRect(ctx, bx, stepY, stepBoxW, stepBoxH, 16);
      ctx.fillStyle = 'rgba(21, 24, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(step, bx + stepBoxW / 2, stepY + 32);
    });

    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Acceso instantáneo desde cualquier celular iPhone o Android · No requiere descargar apps', posterWidth / 2, 1385);

    // 9. Event Venue & Direct URL Pill
    const venueBoxW = 920;
    const venueBoxH = 100;
    const venueBoxX = (posterWidth - venueBoxW) / 2;
    const venueBoxY = 1425;

    drawRoundedRect(ctx, venueBoxX, venueBoxY, venueBoxW, venueBoxH, 24);
    ctx.fillStyle = 'rgba(10, 13, 27, 0.95)';
    ctx.fill();
    ctx.strokeStyle = '#FF7417';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = 'bold 24px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#FF7417';
    ctx.fillText('3 DE NOVIEMBRE DE 2026  ·  SEDE AUDITORIO FMVZ UNAM', posterWidth / 2, venueBoxY + 44);

    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillStyle = '#C4B5FD';
    ctx.fillText(targetUrl, posterWidth / 2, venueBoxY + 78);

    // 10. Official Footer
    ctx.font = '15px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('Comité Organizador FMVZ UNAM · Plataforma Oficial de Votación en Tiempo Real', posterWidth / 2, 1590);

    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Todos los derechos reservados © 2026 UNAM', posterWidth / 2, 1620);

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
          style={{ width: `${size}px`, height: `${size}px` }}
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
            <span>Descargar QR con Logo (PNG Alta Definición)</span>
          </button>

          <button
            onClick={handleDownloadPoster}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-surface-raised border border-halloween-purple/50 hover:border-halloween-purple text-halloween-lavender hover:text-white transition-all"
          >
            <Download className="w-4 h-4 text-halloween-purple-light" />
            <span>Descargar Cartel Oficial para Imprimir</span>
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
