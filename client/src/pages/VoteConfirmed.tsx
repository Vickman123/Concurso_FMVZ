import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Shield, Heart, ArrowRight, Share2, Sparkles } from 'lucide-react';
import { useContest } from '../context/ContestContext';

export const VoteConfirmed: React.FC = () => {
  const { lastVoteReceipt } = useContest();

  const receipt = lastVoteReceipt || {
    confirmation_folio: 'FMVZ-VOTO-2026-DEMO',
    voted_at: new Date().toISOString(),
    participant: {
      contest_number: 1,
      public_display_name: 'Mariana H.',
      costume_title: 'Catrina Universitaria',
      photo: '/uploads/costume_01.svg',
    }
  };

  const formattedDate = new Date(receipt.voted_at).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-14 text-center safe-bottom">
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/40 shadow-glow-purple space-y-6 animate-fadeIn">
        
        {/* Animated Check */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-glow-orange">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold text-halloween-orange uppercase tracking-widest">
            ¡Participación completada!
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-halloween-white mt-1">
            ¡Tu voto ha sido registrado!
          </h1>
          <p className="text-xs text-gray-300 mt-2">
            Gracias por participar en el Segundo Concurso de Disfraces de la FMVZ UNAM.
          </p>
        </div>

        {/* Selected Participant Card */}
        <div className="p-3.5 rounded-2xl bg-surface-raised border border-halloween-border flex items-center gap-3 text-left">
          <img
            src={receipt.participant.photo}
            alt={receipt.participant.costume_title}
            className="w-14 h-16 rounded-xl object-cover border border-halloween-purple/40"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-halloween-orange font-bold uppercase tracking-wider block">
              Disfraz Elegido #{String(receipt.participant.contest_number).padStart(2, '0')}
            </span>
            <strong className="text-sm font-bold text-white block truncate">
              {receipt.participant.costume_title}
            </strong>
            <span className="text-xs text-halloween-lavender block truncate">
              {receipt.participant.public_display_name}
            </span>
          </div>
        </div>

        {/* Folio Receipt Box */}
        <div className="p-4 rounded-2xl bg-surface-raised/80 border border-halloween-border text-left space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Folio de confirmación:</span>
            <span className="font-mono font-bold text-halloween-lavender select-all">
              {receipt.confirmation_folio}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Fecha y hora:</span>
            <span className="text-gray-200">{formattedDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Estado del voto:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Verificado y registrado
            </span>
          </div>
        </div>

        {/* One Vote Reminder */}
        <div className="p-3 rounded-xl bg-surface-raised/40 border border-halloween-border/50 text-[11px] text-gray-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-halloween-purple flex-shrink-0" />
          <span>Tu identidad institucional ha sido registrada. No se admiten votos adicionales.</span>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <Link
            to="/participantes"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-halloween-purple hover:bg-halloween-purple-dark shadow-glow-purple transition-all"
          >
            <span>Seguir explorando la galería</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/premios"
            className="w-full block py-2.5 rounded-xl font-semibold text-xs text-gray-300 hover:text-white bg-surface-raised transition-colors"
          >
            Ver premios del concurso
          </Link>
        </div>
      </div>
    </div>
  );
};
