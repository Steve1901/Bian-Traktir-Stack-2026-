import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Download,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  MapPin,
  Users,
} from 'lucide-react';
import type { Room, Member } from '../../types';
import { formatDateDisplay } from '../../lib/rankingEngine';
import { downloadIcsFile, getGoogleCalendarUrl } from '../../lib/calendarExport';
import { storageService } from '../../services/storageService';

interface FinalizedEventViewProps {
  room: Room;
  activeUser: Member | null;
}

export const FinalizedEventView: React.FC<FinalizedEventViewProps> = ({ room, activeUser }) => {
  const [copied, setCopied] = useState(false);

  const finalizedCandidate = room.candidateDates.find((cd) => cd.id === room.finalizedDateId);

  useEffect(() => {
    // Launch celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  if (!finalizedCandidate) return null;

  const votesForFinal = room.votes[finalizedCandidate.id] || [];
  const attendees = votesForFinal.filter((v) => v.status === 'available');

  const handleDownloadIcs = () => {
    downloadIcsFile(room, finalizedCandidate);
  };

  const handleOpenGoogleCalendar = () => {
    const url = getGoogleCalendarUrl(room, finalizedCandidate);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyAnnouncement = () => {
    const text = `📢 *PENGUMUMAN JADWAL TERPILIH — JANJIAN*\n\nAcara: *${room.name}*\nTanggal: *${formatDateDisplay(finalizedCandidate.date, finalizedCandidate.timeSlot)}*\nToken Community: *${room.token}*\n\nCatatan Admin:\n${room.finalizedNotes || 'Tidak ada catatan tambahan.'}\n\nKehadiran: ${attendees.length} dari ${room.members.length} anggota dapat hadir.\n_Dibuat melalui Janjian — Token-Based Collaborative Scheduling_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReopen = () => {
    if (window.confirm('Buka kembali sesi voting untuk community ini?')) {
      storageService.reopenSchedule(room.token);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      {/* Celebration Header */}
      <div className="text-center py-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Jadwal Resmi Berhasil Ditetapkan</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {room.name}
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Admin telah memilih tanggal terbaik berdasarkan ketersediaan mayoritas dan anggota kunci.
        </p>
      </div>

      {/* Main Finalized Schedule Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-xl shadow-emerald-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-100/50 to-transparent -mr-12 -mt-12 rounded-full pointer-events-none" />

        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
            <Calendar className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-0.5">
              Tanggal & Waktu Terpilih
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {formatDateDisplay(finalizedCandidate.date, finalizedCandidate.timeSlot)}
            </h2>
            {finalizedCandidate.label && (
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{finalizedCandidate.label}</p>
            )}
          </div>
        </div>

        {/* Location / Admin Notes */}
        {room.finalizedNotes && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Catatan / Lokasi dari Admin:</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {room.finalizedNotes}
            </p>
          </div>
        )}

        {/* Attendees Summary */}
        <div className="mb-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Konfirmasi Kehadiran Anggota ({attendees.length} / {room.members.length})</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {room.members.map((member) => {
              const vote = votesForFinal.find((v) => v.memberId === member.id);
              const isAvailable = vote?.status === 'available';
              return (
                <div
                  key={member.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border ${
                    isAvailable
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full ${member.avatarColor || 'bg-slate-400'} text-white text-[8px] flex items-center justify-center font-bold`}>
                    {member.name.charAt(0)}
                  </div>
                  <span>{member.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <button
            onClick={handleDownloadIcs}
            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download .ICS</span>
          </button>

          <button
            onClick={handleOpenGoogleCalendar}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-sm shadow-blue-500/20"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Google Calendar</span>
          </button>

          <button
            onClick={handleCopyAnnouncement}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin!' : 'Salin Siaran Chat'}</span>
          </button>
        </div>
      </div>

      {/* Admin Reopen Action */}
      {activeUser && (
        <div className="text-center pt-2">
          <button
            onClick={handleReopen}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ingin merevisi atau membuka voting ulang? Klik di sini</span>
          </button>
        </div>
      )}
    </div>
  );
};
