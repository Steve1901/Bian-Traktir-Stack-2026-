import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Users,
  ChevronDown,
  ChevronUp,
  Award,
  AlertCircle,
} from 'lucide-react';
import type { Room, Member, VoteStatus, CandidateDate } from '../../types';
import { rankCandidateDates, formatDateDisplay } from '../../lib/rankingEngine';
import { storageService } from '../../services/storageService';

interface SharedCalendarViewProps {
  room: Room;
  activeUser: Member | null;
}

export const SharedCalendarView: React.FC<SharedCalendarViewProps> = ({ room, activeUser }) => {
  const [expandedDateId, setExpandedDateId] = useState<string | null>(null);

  const rankedResults = rankCandidateDates(room);
  const rankingMap = new Map(rankedResults.map((r) => [r.dateId, r]));

  const handleVote = (candidateDate: CandidateDate, status: VoteStatus) => {
    if (!activeUser) return;
    storageService.submitVote(room.token, activeUser.id, activeUser.name, candidateDate.id, status);
  };

  const toggleExpand = (dateId: string) => {
    setExpandedDateId((prev) => (prev === dateId ? null : dateId));
  };

  return (
    <div className="space-y-6">
      {/* Event Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-transparent -mr-20 -mt-20 rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100/70 text-blue-800 uppercase tracking-wide">
                Room Terbuka
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {room.members.length} Anggota Terdaftar
              </span>
              {room.criteria.targetTurnoutPercentage && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Target Venue: {room.criteria.targetTurnoutPercentage}%
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {room.name}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              {room.description || 'Pilih tanggal ketersediaan Anda di bawah ini untuk mencocokkan jadwal tim secara otomatis.'}
            </p>
          </div>

          {/* Active User Indicator */}
          {activeUser && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full ${activeUser.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-sm shadow-xs`}>
                {activeUser.name.charAt(0)}
              </div>
              <div className="text-xs">
                <p className="text-slate-400 font-medium">Voting sebagai:</p>
                <p className="font-bold text-slate-800 truncate max-w-[150px]">{activeUser.name}</p>
                {activeUser.isMustAttend && (
                  <span className="inline-block text-[10px] text-amber-700 bg-amber-50 px-1.5 rounded font-semibold mt-0.5">
                    ★ Anggota Wajib (VIP)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Candidate Dates List & Heatmap */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span>Pilihan Tanggal & Ketersediaan Anggota</span>
          </h2>
          <span className="text-xs text-slate-500">
            Ambang minimal kehadiran: <strong className="text-slate-700">{room.criteria.minTurnoutPercentage}%</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {room.candidateDates.map((candidate) => {
            const rankInfo = rankingMap.get(candidate.id);
            const votes = room.votes[candidate.id] || [];
            const userVote = activeUser ? votes.find((v) => v.memberId === activeUser.id) : null;
            const isExpanded = expandedDateId === candidate.id;

            // Heatmap color logic
            const pct = rankInfo?.availabilityPercentage || 0;
            const mustAttendOk = rankInfo?.mustAttendSatisfied ?? true;

            let heatBg = 'bg-slate-50 border-slate-200';
            let barColor = 'bg-slate-400';

            if (pct >= (room.criteria.minTurnoutPercentage || 50)) {
              heatBg = 'bg-emerald-50/50 border-emerald-200/80';
              barColor = 'bg-emerald-500';
            } else if (pct >= 25) {
              heatBg = 'bg-amber-50/40 border-amber-200/80';
              barColor = 'bg-amber-500';
            }

            return (
              <div
                key={candidate.id}
                className={`rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-md ${heatBg} ${
                  rankInfo?.isRecommended ? 'ring-2 ring-emerald-500/50' : ''
                }`}
              >
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Date details & Recommendation badge */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-base sm:text-lg text-slate-900">
                        {formatDateDisplay(candidate.date, candidate.timeSlot)}
                      </span>
                      {candidate.label && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-white/80 border border-slate-200 font-medium text-slate-600">
                          {candidate.label}
                        </span>
                      )}
                      {rankInfo?.isRecommended && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs animate-pulse">
                          <Award className="w-3 h-3" />
                          <span>Pilihan Terbaik</span>
                        </span>
                      )}
                    </div>

                    {/* Progress Bar & Heatmap Stats */}
                    <div className="mt-2.5 max-w-md">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">
                          {rankInfo?.availableCount || 0} dari {room.members.length} anggota dapat hadir
                        </span>
                        <span className="font-bold font-mono text-slate-900">{pct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Must-Attend Status Badges */}
                    {room.criteria.mustAttendMemberIds.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs">
                        {mustAttendOk ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Semua anggota wajib dapat hadir</span>
                          </span>
                        ) : (
                          <span className="text-rose-700 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span>
                              Wajib belum hadir: {rankInfo?.missingMustAttendMembers.map((m) => m.name).join(', ')}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Voting Buttons for Active User */}
                  <div className="flex items-center gap-2 self-start lg:self-center">
                    <span className="text-xs text-slate-500 mr-1 hidden sm:inline">Pilihan Anda:</span>
                    <button
                      onClick={() => handleVote(candidate, 'available')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                        userVote?.status === 'available'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-600 ring-offset-1'
                          : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Bisa</span>
                    </button>

                    <button
                      onClick={() => handleVote(candidate, 'tentative')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                        userVote?.status === 'tentative'
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-500 ring-offset-1'
                          : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Ragu</span>
                    </button>

                    <button
                      onClick={() => handleVote(candidate, 'unavailable')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                        userVote?.status === 'unavailable'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-600 ring-offset-1'
                          : 'bg-white hover:bg-rose-50 text-slate-700 border border-slate-200 hover:border-rose-300'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Tidak</span>
                    </button>

                    {/* Expand breakdown button */}
                    <button
                      onClick={() => toggleExpand(candidate.id)}
                      title="Lihat rincian siapa saja yang hadir"
                      className="ml-2 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 border border-transparent hover:border-slate-200 transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Member Votes Breakdown */}
                {isExpanded && (
                  <div className="border-t border-slate-200/60 p-4 bg-white/70 rounded-b-2xl animate-in fade-in duration-200">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                      <span>Rincian Suara Anggota ({votes.length} dari {room.members.length})</span>
                      <span className="text-[11px] font-mono text-slate-400">Skor Deterministic: {rankInfo?.compositeScore}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {room.members.map((member) => {
                        const mVote = votes.find((v) => v.memberId === member.id);
                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div className={`w-5 h-5 rounded-full ${member.avatarColor || 'bg-slate-400'} text-white text-[9px] flex items-center justify-center font-bold`}>
                                {member.name.charAt(0)}
                              </div>
                              <span className="truncate font-medium text-slate-800">
                                {member.name}
                                {member.isMustAttend && ' ★'}
                              </span>
                            </div>

                            <div>
                              {mVote?.status === 'available' && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Hadir
                                </span>
                              )}
                              {mVote?.status === 'tentative' && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                                  <HelpCircle className="w-3 h-3" />
                                  Ragu
                                </span>
                              )}
                              {mVote?.status === 'unavailable' && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                                  <XCircle className="w-3 h-3" />
                                  Tidak
                                </span>
                              )}
                              {!mVote && (
                                <span className="text-[11px] text-slate-400 italic">Belum mengisi</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
