import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles } from 'lucide-react';
import { Participant } from '../types';

interface ParticipantCardProps {
  participant: Participant;
  onVoteClick?: (participant: Participant) => void;
  isVotingOpen?: boolean;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  onVoteClick,
  isVotingOpen = true,
}) => {
  const navigate = useNavigate();
  const numStr = String(participant.contest_number).padStart(2, '0');

  const handleVote = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onVoteClick) {
      onVoteClick(participant);
    } else {
      navigate(`/votar/confirmar/${participant.contest_number}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/participantes/${participant.contest_number}`);
    }
  };

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`Ver disfraz de ${participant.public_display_name}: ${participant.costume_title}`}
      onClick={() => navigate(`/participantes/${participant.contest_number}`)}
      onKeyDown={handleKeyDown}
      className="group relative flex flex-col bg-[#15182A] hover:bg-[#1A1E34] rounded-2xl sm:rounded-3xl overflow-hidden border border-[#282B47] hover:border-halloween-orange/60 focus:border-halloween-orange focus:outline-none transition-all duration-300 hover:shadow-[0_8px_30px_rgba(255,116,23,0.18)] cursor-pointer transform hover:-translate-y-1.5"
    >
      {/* Photo Container 4:5 ratio with smooth zoom */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-b from-[#1E1B4B] to-[#080A12]">
        <img
          src={participant.photo_original_key}
          alt={`Disfraz #${numStr}: ${participant.costume_title}`}
          loading="lazy"
          className="w-full h-full object-cover object-top filter brightness-95 group-hover:brightness-105 group-hover:scale-108 transition-all duration-500 ease-out"
        />

        {/* Top-left Official Number Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-halloween-purple to-[#6D28D9] backdrop-blur-md flex items-center justify-center text-white font-display font-black text-xs sm:text-sm shadow-md border border-white/20">
            {numStr}
          </div>
        </div>

        {/* Type Badge top right (Estudiante / Trabajador) */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#080A12]/80 backdrop-blur-md text-halloween-lavender border border-white/10 shadow-sm">
            {participant.participant_type === 'student' ? 'Estudiante' : 'Trabajador'}
          </span>
        </div>

        {/* Ambient bottom gradient overlay for contrast */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#15182A] via-[#15182A]/70 to-transparent pointer-events-none" />
      </div>

      {/* Card Body */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold text-sm sm:text-base text-halloween-white truncate group-hover:text-halloween-orange transition-colors">
            {participant.costume_title}
          </h3>
          <p className="text-xs text-halloween-muted truncate mt-0.5 flex items-center gap-1">
            <span>{participant.public_display_name}</span>
          </p>
        </div>

        <div className="flex-shrink-0 text-xs font-semibold text-halloween-lavender group-hover:text-halloween-orange flex items-center gap-1 transition-colors">
          <span>Ver detalle</span>
          <span>→</span>
        </div>
      </div>
    </div>
  );
};
