import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
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

  return (
    <div
      onClick={() => navigate(`/participantes/${participant.contest_number}`)}
      className="group relative flex flex-col bg-surface-card hover:bg-surface-raised rounded-2xl sm:rounded-3xl overflow-hidden border border-halloween-border/90 hover:border-halloween-purple/50 transition-all duration-300 hover:shadow-glow-purple cursor-pointer transform hover:-translate-y-1"
    >
      {/* Photo Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-b from-[#1E1B4B] to-[#090B14]">
        <img
          src={participant.photo_original_key}
          alt={`Disfraz #${numStr}: ${participant.costume_title}`}
          loading="lazy"
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top-left Official Number Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-halloween-purple/90 backdrop-blur-md flex items-center justify-center text-white font-display font-extrabold text-xs sm:text-sm shadow-md border border-halloween-purple-light/40">
            {numStr}
          </div>
        </div>

        {/* Type Badge top right (if student/worker) */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-black/60 backdrop-blur-md text-halloween-lavender border border-white/10">
            {participant.participant_type === 'student' ? 'Estudiante' : 'Trabajador'}
          </span>
        </div>

        {/* Bottom gradient shadow overlay for contrast */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface-card via-surface-card/60 to-transparent pointer-events-none" />
      </div>

      {/* Card Body & Action */}
      <div className="p-3 sm:p-4 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold text-sm sm:text-base text-halloween-white truncate group-hover:text-halloween-orange transition-colors">
            {participant.costume_title}
          </h3>
          <p className="text-xs text-halloween-muted truncate mt-0.5">
            {participant.public_display_name}
          </p>
        </div>

        {/* Heart Vote Action Button */}
        {isVotingOpen && (
          <button
            onClick={handleVote}
            title={`Votar por ${participant.costume_title}`}
            aria-label={`Votar por participante ${numStr}`}
            className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1F223D] hover:bg-halloween-purple text-halloween-purple-light hover:text-white border border-halloween-purple/30 hover:border-transparent flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
          </button>
        )}
      </div>
    </div>
  );
};
