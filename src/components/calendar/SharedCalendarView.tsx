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
  Clock,
  Pencil,
  Trash2,
  X,
  AlignLeft,
  Building2,
} from 'lucide-react';
import type { Room, Member, VoteStatus, CandidateDate, DateRankingResult } from '../../types';
import { rankCandidateDates, formatDateDisplay } from '../../lib/rankingEngine';
import { storageService } from '../../services/storageService';
import { downloadIcsFile, getGoogleCalendarUrl } from '../../lib/calendarExport';

interface AgendaEntry {
  room: Room;
  candidate: CandidateDate;
  rankInfo?: DateRankingResult;
}

interface SharedCalendarViewProps {
  isAllMode: boolean;
  room: Room | null;
  allRooms: Room[];
  activeUser: Member | null;
}

export const SharedCalendarView: React.FC<SharedCalendarViewProps> = ({
  isAllMode,
  room,
  allRooms,
  activeUser,
}) => {
  const displayedRooms = useMemo(() => {
    if (isAllMode) return allRooms;
    return room ? [room] : [];
  }, [isAllMode, room, allRooms]);

  // Build agenda entries across all displayed communities
  const agendaEntries = useMemo<AgendaEntry[]>(() => {
    const entries: AgendaEntry[] = [];
    displayedRooms.forEach((r) => {
      const ranked = rankCandidateDates(r);
      const rankMap = new Map(ranked.map((res) => [res.dateId, res]));
      r.candidateDates.forEach((cd) => {
        entries.push({
          room: r,
          candidate: cd,
          rankInfo: rankMap.get(cd.id),
        });
      });
    });
    return entries;
  }, [displayedRooms]);

  // Group agenda entries by date 'YYYY-MM-DD'
  const agendasByDateStr = useMemo(() => {
    const map = new Map<string, AgendaEntry[]>();
    agendaEntries.forEach((entry) => {
      const list = map.get(entry.candidate.date) || [];
      list.push(entry);
      map.set(entry.candidate.date, list);
    });
    return map;
  }, [agendaEntries]);

  // Initial calendar month
  const initialDate = useMemo(() => {
    if (agendaEntries.length > 0) {
      const first = agendaEntries[0].candidate.date;
      const [y, m] = first.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  }, [agendaEntries.length]);

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(initialDate);

  // Selected date string
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    if (agendaEntries.length > 0) {
      const finalized = agendaEntries.find(
        (e) => e.room.status === 'FINALIZED' && e.room.finalizedDateId === e.candidate.id
      );
      if (finalized) return finalized.candidate.date;
      return agendaEntries[0].candidate.date;
    }
    return new Date().toISOString().split('T')[0];
  });

  // If multiple agendas exist on the same date, track which one is selected
  const [selectedAgendaId, setSelectedAgendaId] = useState<string | null>(null);

  const agendasOnSelectedDate = agendasByDateStr.get(selectedDateStr) || [];

  const activeAgendaEntry: AgendaEntry | null = useMemo(() => {
    if (agendasOnSelectedDate.length === 0) return null;
    if (selectedAgendaId) {
      const found = agendasOnSelectedDate.find((e) => e.candidate.id === selectedAgendaId);
      if (found) return found;
    }
    return agendasOnSelectedDate[0];
  }, [agendasOnSelectedDate, selectedAgendaId]);

  // Draft voting state (does NOT update room state until confirmed)
  const [draftVote, setDraftVote] = useState<VoteStatus | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Agenda CRUD Modal state
  const [crudModalOpen, setCrudModalOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<'create' | 'edit'>('create');
  const [editingEntry, setEditingEntry] = useState<AgendaEntry | null>(null);
  const [formCommunityToken, setFormCommunityToken] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('14:00');
  const [formEndTime, setFormEndTime] = useState('16:00');
  const [formDescription, setFormDescription] = useState('');

  const activeVotes = activeAgendaEntry
    ? activeAgendaEntry.room.votes[activeAgendaEntry.candidate.id] || []
    : [];

  const committedUserVote =
    activeUser && activeAgendaEntry
      ? activeVotes.find((v) => v.memberId === activeUser.id)
      : null;

  useEffect(() => {
    if (committedUserVote) {
      setDraftVote(committedUserVote.status);
    } else {
      setDraftVote(null);
    }
    setIsSavedFeedback(false);
  }, [selectedDateStr, activeAgendaEntry?.candidate.id, activeUser?.id, committedUserVote?.status]);

  const isFinalizedWinner = (entry: AgendaEntry) =>
    entry.room.status === 'FINALIZED' && entry.room.finalizedDateId === entry.candidate.id;

  const isSelectedApprovedWinner = activeAgendaEntry ? isFinalizedWinner(activeAgendaEntry) : false;

  // Members to show in left panel
  const panelMembers = useMemo(() => {
    if (activeAgendaEntry) return activeAgendaEntry.room.members;
    if (!isAllMode && room) return room.members;
    const map = new Map<string, Member>();
    allRooms.forEach((r) => r.members.forEach((m) => map.set(m.id, m)));
    return Array.from(map.values());
  }, [activeAgendaEntry, isAllMode, room, allRooms]);

  // Month navigation
  const prevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
    currentMonthDate
  );

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  const handleCommitVote = () => {
    if (!activeUser || !activeAgendaEntry || !draftVote) return;
    storageService.submitVote(
      activeAgendaEntry.room.token,
      activeUser.id,
      activeUser.name,
      activeAgendaEntry.candidate.id,
      draftVote
    );
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2500);
  };

  const handleApproveDate = (entry: AgendaEntry) => {
    storageService.finalizeSchedule(
      entry.room.token,
      entry.candidate.id,
      'Disetujui langsung melalui Kalender'
    );
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });
  };

  // CRUD handlers
  const openCreateModal = (dateOverride?: string) => {
    setCrudMode('create');
    setEditingEntry(null);
    setFormCommunityToken(room ? room.token : allRooms[0]?.token || '');
    setFormTitle('');
    setFormDate(dateOverride || selectedDateStr);
    setFormStartTime('14:00');
    setFormEndTime('16:00');
    setFormDescription('');
    setCrudModalOpen(true);
  };

  const openEditModal = (entry: AgendaEntry) => {
    setCrudMode('edit');
    setEditingEntry(entry);
    setFormCommunityToken(entry.room.token);
    setFormTitle(entry.candidate.label || '');
    setFormDate(entry.candidate.date);
    setFormStartTime(entry.candidate.startTime || '');
    setFormEndTime(entry.candidate.endTime || '');
    setFormDescription(entry.candidate.description || '');
    setCrudModalOpen(true);
  };

  const handleSaveAgendaForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;

    if (crudMode === 'create') {
      const targetToken = formCommunityToken || room?.token || allRooms[0]?.token;
      if (!targetToken) return;
      const created = storageService.addAgenda(targetToken, {
        date: formDate,
        startTime: formStartTime || undefined,
        endTime: formEndTime || undefined,
        label: formTitle.trim(),
        description: formDescription.trim(),
      });
      if (created) {
        setSelectedDateStr(created.date);
        setSelectedAgendaId(created.id);
      }
    } else if (crudMode === 'edit' && editingEntry) {
      storageService.updateAgenda(editingEntry.room.token, editingEntry.candidate.id, {
        date: formDate,
        startTime: formStartTime || undefined,
        endTime: formEndTime || undefined,
        label: formTitle.trim(),
        description: formDescription.trim(),
      });
      setSelectedDateStr(formDate);
      setSelectedAgendaId(editingEntry.candidate.id);
    }

    setCrudModalOpen(false);
  };

  const handleDeleteAgenda = (entry: AgendaEntry) => {
    if (window.confirm(`Hapus agenda "${entry.candidate.label || entry.candidate.date}"?`)) {
      storageService.deleteAgenda(entry.room.token, entry.candidate.id);
      setSelectedAgendaId(null);
    }
  };

  const formatTimeRange = (cd: CandidateDate) => {
    if (cd.startTime && cd.endTime) return `${cd.startTime} - ${cd.endTime} WIB`;
    if (cd.startTime) return `${cd.startTime} WIB`;
    if (cd.timeSlot === 'morning') return 'Pagi (08:00 - 12:00)';
    if (cd.timeSlot === 'afternoon') return 'Siang (13:00 - 17:00)';
    if (cd.timeSlot === 'evening') return 'Malam (18:30 - 21:00)';
    return 'Seharian';
  };

  const dayHeaders = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const hasUnsavedChanges =
    activeAgendaEntry && draftVote !== (committedUserVote?.status || null);

  return (
    <div className="w-full space-y-4">
      {/* Dynamic Full-Width 3-Panel Layout: MEMBER | CALENDAR | YOUR MEETING */}
      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* ========================================================= */}
        {/* PANEL 1: MEMBER (Left)                                    */}
        {/* ========================================================= */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>MEMBER</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {panelMembers.length} Anggota
                {isAllMode && activeAgendaEntry ? ` • ${activeAgendaEntry.room.token}` : ''}
              </p>
            </div>
            {!isAllMode && room && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {room.token}
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-0.5">
            {panelMembers.map((member) => {
              const mVote = activeAgendaEntry
                ? activeVotes.find((v) => v.memberId === member.id)
                : null;
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
                        {isCurrentUser && (
                          <span className="text-blue-600 font-semibold ml-1">(Anda)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {activeAgendaEntry ? (
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
        {/* PANEL 2: CALENDAR (Center, fluid)                         */}
        {/* ========================================================= */}
        <div className="w-full lg:flex-1 min-w-0 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                <span>CALENDAR</span>
              </h2>
              <p className="text-xs font-bold text-slate-700 mt-0.5 capitalize">{monthName}</p>
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
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="h-20 rounded-xl bg-slate-50/40 border border-slate-100 opacity-25"
              />
            ))}

            {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
              const dayNum = dayIndex + 1;
              const padMonth = String(month + 1).padStart(2, '0');
              const padDay = String(dayNum).padStart(2, '0');
              const dateStr = `${year}-${padMonth}-${padDay}`;

              const entriesOnDay = agendasByDateStr.get(dateStr) || [];
              const primaryEntry = entriesOnDay[0] || null;
              const isSelected = selectedDateStr === dateStr;
              const hasApprovedWinner = entriesOnDay.some((e) => isFinalizedWinner(e));

              const pct = primaryEntry?.rankInfo?.availabilityPercentage ?? 0;
              const hasVotes =
                primaryEntry &&
                (primaryEntry.room.votes[primaryEntry.candidate.id]?.length || 0) > 0;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDateStr(dateStr);
                    setSelectedAgendaId(entriesOnDay[0]?.candidate.id || null);
                  }}
                  className={`h-20 rounded-xl border text-left p-1.5 flex flex-col justify-between transition-all duration-150 relative ${
                    isSelected
                      ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/40 shadow-xs'
                      : primaryEntry
                      ? 'bg-white hover:border-slate-300 hover:shadow-2xs border-slate-200'
                      : 'bg-slate-50/30 hover:bg-slate-100/50 border-slate-100'
                  }`}
                >
                  {/* Top: Day number */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold leading-none ${
                        isSelected
                          ? 'text-blue-700'
                          : primaryEntry
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {entriesOnDay.length > 1 && (
                      <span className="text-[9px] font-bold px-1 rounded bg-indigo-100 text-indigo-700">
                        +{entriesOnDay.length - 1}
                      </span>
                    )}
                  </div>

                  {/* Bottom: Pill status ONLY if an agenda exists (blank if none — no "N/A") */}
                  <div className="w-full">
                    {hasApprovedWinner ? (
                      <div className="w-full py-1 px-1 rounded-lg bg-emerald-500 text-white text-[11px] font-black text-center shadow-xs tracking-wide">
                        YAY!
                      </div>
                    ) : primaryEntry ? (
                      <div
                        className={`w-full py-0.5 px-1 rounded-md text-[10px] font-bold text-center truncate ${
                          pct >= (primaryEntry.room.criteria.minTurnoutPercentage || 50)
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : pct >= 25
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {hasVotes ? `Available ${pct}%` : 'Tersedia'}
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Legend */}
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
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PANEL 3: YOUR MEETING (Right, with full details & CRUD)   */}
        {/* ========================================================= */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-amber-500" />
              <span>YOUR MEETING</span>
            </h2>

            <button
              type="button"
              onClick={() => openCreateModal(selectedDateStr)}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>

          {/* Multiple agenda switcher when selected date has >1 agenda */}
          {agendasOnSelectedDate.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {agendasOnSelectedDate.map((entry) => {
                const isActive = activeAgendaEntry?.candidate.id === entry.candidate.id;
                return (
                  <button
                    key={entry.candidate.id}
                    type="button"
                    onClick={() => setSelectedAgendaId(entry.candidate.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 border transition ${
                      isActive
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {entry.candidate.label || 'Agenda'}
                  </button>
                );
              })}
            </div>
          )}

          {/* Meeting Detail Card */}
          {activeAgendaEntry ? (
            <div className="space-y-4">
              {/* Date, Time, Agenda Title, Description & Edit/Delete */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Calendar Date Badge */}
                    <div className="w-12 h-14 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center justify-center shrink-0 overflow-hidden">
                      <span className="text-[9px] font-bold text-white bg-blue-600 w-full text-center py-0.5 uppercase tracking-wider">
                        DATE
                      </span>
                      <span className="text-xl font-black text-slate-900 leading-tight">
                        {activeAgendaEntry.candidate.date.split('-')[2] || '1'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      {isAllMode && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded mb-1">
                          <Building2 className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[140px]">
                            {activeAgendaEntry.room.name}
                          </span>
                        </span>
                      )}
                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                        {activeAgendaEntry.candidate.label || activeAgendaEntry.room.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatDateDisplay(
                          activeAgendaEntry.candidate.date,
                          activeAgendaEntry.candidate.timeSlot
                        )}
                      </p>
                    </div>
                  </div>

                  {/* CRUD Edit / Delete buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(activeAgendaEntry)}
                      title="Edit Agenda"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAgenda(activeAgendaEntry)}
                      title="Hapus Agenda"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-slate-200 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Time / Jam */}
                <div className="flex items-center gap-2 text-xs text-slate-700 pt-2 border-t border-slate-200/80">
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-semibold">
                    {formatTimeRange(activeAgendaEntry.candidate)}
                  </span>
                </div>

                {/* Event / Agenda Description */}
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <AlignLeft className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {activeAgendaEntry.candidate.description ||
                      activeAgendaEntry.room.description ||
                      'Tidak ada deskripsi tambahan untuk agenda ini.'}
                  </p>
                </div>
              </div>

              {/* Approved Banner */}
              {isSelectedApprovedWinner && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <span>🎉</span>
                  <span>Jadwal ini resmi disetujui (YAY!)</span>
                </div>
              )}

              {/* Availability Stats Bar */}
              <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Tingkat Kehadiran:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeAgendaEntry.rankInfo?.availabilityPercentage || 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      (activeAgendaEntry.rankInfo?.availabilityPercentage || 0) >=
                      (activeAgendaEntry.room.criteria.minTurnoutPercentage || 50)
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${activeAgendaEntry.rankInfo?.availabilityPercentage || 0}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {activeAgendaEntry.rankInfo?.availableCount || 0} dari{' '}
                  {activeAgendaEntry.room.members.length} anggota dapat hadir
                </p>
              </div>

              {/* Draft Voting Selection */}
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

              {/* Dropdown Details Event & Commit Vote */}
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
                  {isDetailsOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {isDetailsOpen && (
                  <div className="p-3 pt-0 border-t border-slate-200/60 space-y-3 bg-white animate-in fade-in duration-150">
                    <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                      <p>
                        <strong className="text-slate-700">Community:</strong>{' '}
                        {activeAgendaEntry.room.name}
                      </p>
                      <p>
                        <strong className="text-slate-700">Jam:</strong>{' '}
                        {formatTimeRange(activeAgendaEntry.candidate)}
                      </p>
                      <p>
                        <strong className="text-slate-700">Status Tersimpan:</strong>{' '}
                        {committedUserVote ? committedUserVote.status : 'Belum memilih'}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!draftVote}
                      onClick={handleCommitVote}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
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
                          <span>
                            {hasUnsavedChanges
                              ? 'Simpan Pilihan Kehadiran'
                              : 'Perbarui Kehadiran'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Admin Approval Button */}
              {!isSelectedApprovedWinner && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleApproveDate(activeAgendaEntry)}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Setujui Tanggal Ini (YAY!)</span>
                  </button>
                </div>
              )}

              {/* Export buttons if finalized */}
              {isSelectedApprovedWinner && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      downloadIcsFile(activeAgendaEntry.room, activeAgendaEntry.candidate)
                    }
                    className="py-2 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.ICS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        getGoogleCalendarUrl(activeAgendaEntry.room, activeAgendaEntry.candidate),
                        '_blank'
                      )
                    }
                    className="py-2 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>G-Calendar</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Empty date selected: Clean prompt to add a new agenda */
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-3">
              <div className="w-12 h-14 mx-auto rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center overflow-hidden">
                <span className="text-[9px] font-bold text-white bg-slate-400 w-full text-center py-0.5 uppercase">
                  DATE
                </span>
                <span className="text-xl font-black text-slate-700">
                  {selectedDateStr.split('-')[2] || '1'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Belum ada agenda pada{' '}
                <strong className="text-slate-700">{formatDateDisplay(selectedDateStr)}</strong>.
              </p>
              <button
                type="button"
                onClick={() => openCreateModal(selectedDateStr)}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Agenda di Tanggal Ini</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* AGENDA CRUD MODAL (Create & Edit Agenda)                  */}
      {/* ========================================================= */}
      {crudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">
                {crudMode === 'create' ? 'Tambah Agenda Baru' : 'Edit Agenda'}
              </h3>
              <button
                type="button"
                onClick={() => setCrudModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAgendaForm} className="p-4 space-y-3.5">
              {/* Community selector (when creating in ALL mode) */}
              {crudMode === 'create' && isAllMode && allRooms.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Community
                  </label>
                  <select
                    value={formCommunityToken}
                    onChange={(e) => setFormCommunityToken(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                  >
                    {allRooms.map((r) => (
                      <option key={r.token} value={r.token}>
                        {r.name} ({r.token})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Judul Agenda *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Evaluasi Sprint"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tanggal *
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi Event / Agenda
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan detail pembahasan, lokasi, atau link meeting..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCrudModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  {crudMode === 'create' ? 'Simpan Agenda' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
