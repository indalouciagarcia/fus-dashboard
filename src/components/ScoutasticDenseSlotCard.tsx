import React from 'react';
import { Crown, Star, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export interface DenseSlotPlayerItem {
  raw: any;
  id: string;
  shortName: string;
  fullName: string;
  photoUrl?: string | null;
  initials: string;
  rating?: number | null;
  hasEvaluation?: boolean;
  isTrial?: boolean;
  clubOrTeam?: string | null;
}

interface ScoutasticDenseSlotCardProps {
  slotLabel: string;
  roleCode?: string;
  players: DenseSlotPlayerItem[];
  onSelectPlayer: (player: any) => void;
  className?: string;
}

export const ScoutasticDenseSlotCard: React.FC<ScoutasticDenseSlotCardProps> = ({
  slotLabel,
  roleCode,
  players,
  onSelectPlayer,
  className,
}) => {
  return (
    <div
      className={cn(
        "w-60 sm:w-68 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-slate-300 shadow-2xl overflow-hidden text-slate-900 transition-all hover:border-emerald-400 z-30 select-none",
        className
      )}
      style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.45))' }}
    >
      {/* ── CARD HEADER (Position Label + Count) ── */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white px-3 py-2 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-black uppercase tracking-wider text-white truncate">
            {slotLabel}
          </span>
          {roleCode && roleCode !== slotLabel && (
            <span className="text-[9px] text-slate-400 font-bold">({roleCode})</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
            {players.length} Joueurs
          </span>
        </div>
      </div>

      {/* ── VERTICAL STACKED LIST (Scoutastic Style) ── */}
      <div className="max-h-60 overflow-y-auto scrollbar-thin divide-y divide-slate-100 bg-white/95">
        {players.map((p, idx) => {
          const isTop = idx === 0 && p.rating !== undefined && p.rating !== null;
          const score = typeof p.rating === 'number' ? p.rating : null;

          return (
            <div
              key={p.id || idx}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPlayer(p.raw);
              }}
              className="px-2.5 py-1.5 flex items-center justify-between gap-2 hover:bg-emerald-50/80 cursor-pointer transition-colors group"
              title={`Cliquer pour inspecter ${p.fullName}`}
            >
              {/* Left: Avatar + Crown + Names */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Crown for #1 */}
                {isTop ? (
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0 drop-shadow-xs" />
                ) : (
                  <span className="w-3.5 text-center text-[9px] font-bold text-slate-400 shrink-0">
                    {idx + 1}
                  </span>
                )}

                {/* Avatar */}
                <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-900 text-white flex items-center justify-center text-[9px] font-black shadow-xs">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{p.initials}</span>
                  )}
                </div>

                {/* Name & Club */}
                <div className="min-w-0 flex-1">
                  <p className="font-black text-xs text-slate-900 group-hover:text-emerald-700 transition-colors truncate leading-tight">
                    {p.shortName}
                  </p>
                  <p className="text-[8.5px] text-slate-400 font-medium truncate max-w-[120px] leading-tight">
                    {p.clubOrTeam || 'FUS Club'}
                  </p>
                </div>
              </div>

              {/* Right: Score / Rating Badge */}
              <div className="flex items-center gap-1 shrink-0">
                {score !== null ? (
                  <div
                    className={cn(
                      "min-w-[26px] h-5 px-1.5 rounded-full text-[9.5px] font-black flex items-center justify-center gap-0.5 border shadow-xs",
                      score >= 8.0
                        ? "bg-amber-400 text-slate-950 border-amber-300"
                        : score >= 7.0
                        ? "bg-emerald-500 text-white border-emerald-400"
                        : "bg-slate-700 text-white border-slate-600"
                    )}
                  >
                    {p.hasEvaluation && <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-200 shrink-0" />}
                    <span>{score.toFixed(1)}</span>
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-400 font-bold">—</span>
                )}

                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScoutasticDenseSlotCard;
