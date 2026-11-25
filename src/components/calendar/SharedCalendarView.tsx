import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Calendar as CalendarIcon,
  Download,
  ExternalLink,
  ShieldCheck,
  Star,
  Plus,
  Save,
  Check,
  Info,
} from 'lucide-react';
import type { Room, Member, VoteStatus, CandidateDate } from '../../types';
import { rankCandidateDates, formatDateDisplay } from '../../lib/rankingEngine';
import { storageService } from '../../services/storageService';
import { downloadIcsFile, getGoogleCalendarUrl } from '../../lib/calendarExport';

interface SharedCalendarViewProps {
  room: Room;
  activeUser: Member | null;
}

export const SharedCalendarView: React.FC<SharedCalendarViewProps> = ({ room, activeUser }) => {
  // Determine initial month from candidate dates or today
  const initialDate = useMemo(() => {
    if (room.candidateDates.length > 0) {
      const first = room.candidateDates[0].date;
      const [y, m] = first.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  }, [room.candidateDates]);

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(initialDate);

  // Selected date defaults to first candidate date (or today)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    if (room.candidateDates.length > 0) {
      if (room.status === 'FINALIZED' && room.finalizedDateId) {
        const fin = room.candidateDates.find((cd) => cd.id === room.finalizedDateId);
        if (fin) return fin.date;
      }
      return room.candidateDates[0].date;
    }
    return new Date().toISOString().split('T')[0];
  });

  // Requirement 4: Draft voting selection (does NOT update room state until confirmed)
  const [draftVote, setDraftVote] = useState<VoteStatus | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  const rankedResults = rankCandidateDates(room);
  const rankingMap = useMemo(() => {
    return new Map(rankedResults.map((r) => [r.dateId, r]));
  }, [rankedResults]);

  // Map of candidate dates keyed by 'YYYY-MM-DD'
  const candidateByDateStr = useMemo(() => {
    const map = new Map<string, CandidateDate>();
    room.candidateDates.forEach((cd) => map.set(cd.date, cd));
    return map;
  }, [room.candidateDates]);

  // Current selected candidate if applicable
  const selectedCandidate = candidateByDateStr.get(selectedDateStr) || null;
  const selectedRankInfo = selectedCandidate ? rankingMap.get(selectedCandidate.id) : null;
  const selectedVotes = selectedCandidate ? (room.votes[selectedCandidate.id] || []) : [];
  
  // Committed vote from storage
  const committedUserVote = activeUser && selectedCandidate
    ? selectedVotes.find((v) => v.memberId === activeUser.id)
    : null;

  // Initialize draft vote when selected date or active user changes
  useEffect(() => {
    if (committedUserVote) {
      setDraftVote(committedUserVote.status);
    } else {
      setDraftVote(null);
    }
    setIsSavedFeedback(false);
  }, [selectedDateStr, activeUser?.id, committedUserVote?.status]);

  const isFinalizedWinner = (candidate: CandidateDate) => {
    return room.status === 'FINALIZED' && room.finalizedDateId === candidate.id;
  };

  const isSelectedApprovedWinner = selectedCandidate ? isFinalizedWinner(selectedCandidate) : false;

  // Month navigation
  const prevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Calendar matrix calculation (Monday-first: Mon=0, Tue=1, ... Sun=6)
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(currentMonthDate);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  // Requirement 4: Commit draft vote to storageService when user explicitly saves or confirms via details dropdown
  const handleCommitVote = () => {
    if (!activeUser || !selectedCandidate || !draftVote) return;
    storageService.submitVote(room.token, activeUser.id, activeUser.name, selectedCandidate.id, draftVote);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2500);
  };

  const handleApproveDate = (candidate: CandidateDate) => {
    storageService.finalizeSchedule(room.token, candidate.id, 'Disetujui langsung melalui Kalender');
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });
  };

  const handleAddCandidate = (dateStr: string) => {
    const updatedCandidate: CandidateDate = {
      id: `cd-${Date.now()}`,
      date: dateStr,
      timeSlot: 'all-day',
      label: `Opsi Baru`,
    };
    room.candidateDates.push(updatedCandidate);
    setSelectedDateStr(dateStr);
  };

  const dayHeaders = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const hasUnsavedChanges = selectedCandidate && draftVote !== (committedUserVote?.status || null);

  return (
    <div className="w-full space-y-4">
      {/* Dynamic Full-Width Layout: [ MEMBER (left) | CALENDAR (center) | YOUR MEETING (right) ] */}
      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        
        {/* ========================================================= */}
        {/* PANEL 1: MEMBER (Dynamic width, ~20-25%)                  */}
        {/* ========================================================= */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>MEMBER</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {room.members.length} Anggota
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {room.token}
            </span>
          </div>

          {/* Members list */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-0.5">
            {room.members.map((member) => {
              const mVote = selectedCandidate ? selectedVotes.find((v) => v.memberId === member.id) : null;
              const isCurrentUser = activeUser?.id === member.id;

              return (
                <div
                  key={member.id}
                  className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2.5 ${
                    isCurrentUser
                      ? 'bg-blue-50/70 border-blue-200'
                      : 'bg-slate-50/50 border-slate-200/70 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full ${
                        member.avatarColor || 'bg-blue-600'
                      } text-white text-[11px] flex items-center justify-center font-bold shrink-0 shadow-2xs`}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                        <span className="truncate">{member.name}</span>
                        {member.isMustAttend && (
                          <span title="Anggota Wajib">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {member.role === 'admin' ? 'Host Admin' : 'Anggota'}
                        {isCurrentUser && <span className="text-blue-600 font-semibold ml-1">(Anda)</span>}
                      </p>
                    </div>
                  </div>

                  {/* Vote status indicator on selected date */}
                  <div className="shrink-0 text-right">
                    {selectedCandidate ? (
                      mVote?.status === 'available' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Bisa</span>
                        </span>
                      ) : mVote?.status === 'tentative' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <HelpCircle className="w-3 h-3" />
                          <span>Ragu</span>
                        </span>
                      ) : mVote?.status === 'unavailable' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          <span>Tidak</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Belum</span>
                      )
                    ) : (
                      <span className="text-[10px] text-slate-300">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* PANEL 2: CALENDAR (Dynamic width, fills remaining space)  */}
        {/* ========================================================= */}
        <div className="w-full lg:flex-1 min-w-0 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
          {/* Calendar Header with Month Navigation */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                <span>CALENDAR</span>
              </h2>
              <p className="text-xs font-bold text-slate-700 mt-0.5 capitalize">
                {monthName}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                title="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                title="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1">
            {dayHeaders.map((dh, i) => (
              <div key={i}>{dh}</div>
            ))}
          </div>

          {/* Monthly Day Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty padding for days before 1st */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 rounded-xl bg-slate-50/40 border border-slate-100 opacity-25" />
            ))}

            {/* Days 1..daysInMonth */}
            {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
              const dayNum = dayIndex + 1;
              const padMonth = String(month + 1).padStart(2, '0');
              const padDay = String(dayNum).padStart(2, '0');
              const dateStr = `${year}-${padMonth}-${padDay}`;

              const candidate = candidateByDateStr.get(dateStr);
              const rankInfo = candidate ? rankingMap.get(candidate.id) : null;
              const isSelected = selectedDateStr === dateStr;
              const isApprovedWinner = candidate ? isFinalizedWinner(candidate) : false;

              // Heat percentage
              const pct = rankInfo?.availabilityPercentage ?? 0;
              const hasVotes = candidate && (room.votes[candidate.id]?.length || 0) > 0;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-20 rounded-xl border text-left p-1.5 flex flex-col justify-between transition-all duration-150 relative group ${
                    isSelected
                      ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/40 shadow-xs'
                      : candidate
                      ? 'bg-white hover:border-slate-300 hover:shadow-2xs'
                      : 'bg-slate-50/40 hover:bg-slate-100/60 border-slate-150'
                  }`}
                >
                  {/* Top: Day number */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold leading-none ${
                        isSelected
                          ? 'text-blue-700'
                          : candidate
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Small dot indicator if active user has committed vote */}
                    {candidate && activeUser && (
                      <div>
                        {room.votes[candidate.id]?.find((v) => v.memberId === activeUser.id)?.status === 'available' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" title="Anda memilih Bisa" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom: Pill status (YAY! vs Available % vs N/A) */}
                  <div className="w-full">
                    {isApprovedWinner ? (
                      /* YAY! if approved by admin */
                      <div className="w-full py-1 px-1 rounded-lg bg-emerald-500 text-white text-[11px] font-black text-center shadow-xs animate-bounce tracking-wide">
                        YAY!
                      </div>
                    ) : candidate ? (
                      /* Candidate Date: Available % */
                      <div
                        className={`w-full py-0.5 px-1 rounded-md text-[10px] font-bold text-center truncate ${
                          pct >= (room.criteria.minTurnoutPercentage || 50)
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : pct >= 25
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {hasVotes ? `Available ${pct}%` : 'Tersedia'}
                      </div>
                    ) : (
                      /* Non-candidate date: N/A */
                      <div className="text-[10px] text-slate-400 text-center font-medium py-0.5">
                        N/A
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Legend Note */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-black text-emerald-600 font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                YAY!
              </span>
              <span className="text-slate-600 font-medium text-[11px]">
                = kalau diapprove admin
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> &ge;50%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> 25-49%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> N/A
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PANEL 3: YOUR MEETING (Dynamic width, ~25-30%)            */}
        {/* ========================================================= */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-amber-500" />
              <span>YOUR MEETING</span>
            </h2>
          </div>

          {/* Meeting Card Header showing Date & Agenda */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              {/* Calendar Date Badge */}
              <div className="w-12 h-14 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center justify-center shrink-0 overflow-hidden">
                <span className="text-[9px] font-bold text-white bg-blue-600 w-full text-center py-0.5 uppercase tracking-wider">
                  DATE
                </span>
                <span className="text-xl font-black text-slate-900 leading-tight">
                  {selectedDateStr.split('-')[2] || '1'}
                </span>
              </div>

              {/* Agenda / Event Title */}
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Agenda
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 truncate">
                  {room.name}
                </h3>
                <p className="text-[11px] text-slate-500 truncate">
                  {selectedCandidate?.label || 'Sesi Diskusi & Konsensus'}
                </p>
              </div>
            </div>

            {/* Date display string */}
            <p className="text-xs font-semibold text-slate-700 pt-1 border-t border-slate-200/80">
              {formatDateDisplay(selectedDateStr, selectedCandidate?.timeSlot)}
            </p>
          </div>

          {/* Candidate Status or N/A message */}
          {selectedCandidate ? (
            <div className="space-y-4">
              {/* Is it the approved winner? */}
              {isSelectedApprovedWinner && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <span className="text-base">🎉</span>
                  <span>Jadwal ini resmi disetujui (YAY!)</span>
                </div>
              )}

              {/* Availability Stats Bar */}
              <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Tingkat Kehadiran:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedRankInfo?.availabilityPercentage || 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      (selectedRankInfo?.availabilityPercentage || 0) >= (room.criteria.minTurnoutPercentage || 50)
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${selectedRankInfo?.availabilityPercentage || 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {selectedRankInfo?.availableCount || 0} dari {room.members.length} anggota dapat hadir
                </p>
              </div>

              {/* ========================================================= */}
              {/* Requirement 4: Selection of Bisa/Ragu/Tidak               */}
              {/* Doesn't update state until dropdown details event/save   */}
              {/* ========================================================= */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Pilihan Kehadiran Anda:
                  </label>
                  {hasUnsavedChanges && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      Belum Disimpan
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDraftVote('available')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
                      draftVote === 'available'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-600'
                        : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Bisa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDraftVote('tentative')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
                      draftVote === 'tentative'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-500'
                        : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Ragu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDraftVote('unavailable')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
                      draftVote === 'unavailable'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-600'
                        : 'bg-white hover:bg-rose-50 text-slate-700 border border-slate-200 hover:border-rose-300'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Tidak</span>
                  </button>
                </div>
              </div>

              {/* Requirement 4: Dropdown Details Event */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                  className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100/60 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Rincian & Konfirmasi Event</span>
                  </span>
                  {isDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isDetailsOpen && (
                  <div className="p-3 pt-0 border-t border-slate-200/60 space-y-3 bg-white animate-in fade-in duration-150">
                    <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                      <p><strong className="text-slate-700">Waktu:</strong> {selectedCandidate.timeSlot === 'morning' ? 'Pagi' : selectedCandidate.timeSlot === 'afternoon' ? 'Siang' : selectedCandidate.timeSlot === 'evening' ? 'Malam' : 'Seharian'}</p>
                      <p><strong className="text-slate-700">Status Kehadiran Anda saat ini:</strong> {committedUserVote ? committedUserVote.status : 'Belum memilih'}</p>
                    </div>

                    {/* Button to commit vote explicitly inside dropdown details */}
                    <button
                      type="button"
                      disabled={!draftVote}
                      onClick={handleCommitVote}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 ${
                        hasUnsavedChanges
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                          : isSavedFeedback
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isSavedFeedback ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Kehadiran Tersimpan!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>{hasUnsavedChanges ? 'Simpan Pilihan Kehadiran' : 'Perbarui Kehadiran'}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Save button if user hasn't opened dropdown details */}
              {hasUnsavedChanges && !isDetailsOpen && (
                <button
                  type="button"
                  onClick={handleCommitVote}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-98 animate-pulse"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Pilihan Kehadiran</span>
                </button>
              )}

              {/* Admin Approval Button (Sets YAY!) */}
              {!isSelectedApprovedWinner && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleApproveDate(selectedCandidate)}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Setujui Tanggal Ini (YAY!)</span>
                  </button>
                </div>
              )}

              {/* Export buttons if already finalized */}
              {isSelectedApprovedWinner && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => downloadIcsFile(room, selectedCandidate)}
                    className="py-2 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.ICS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(getGoogleCalendarUrl(room, selectedCandidate), '_blank')}
                    className="py-2 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>G-Calendar</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-3">
              <p className="text-xs text-slate-500 font-medium">
                Tanggal ini berstatus <strong className="text-slate-700">N/A</strong> (bukan kandidat aktif).
              </p>
              <button
                type="button"
                onClick={() => handleAddCandidate(selectedDateStr)}
                className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Jadikan Tanggal Kandidat</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
