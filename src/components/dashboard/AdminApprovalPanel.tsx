import React, { useState } from 'react';
import {
  Award,
  CheckCircle,
  Sliders,
  Star,
  ArrowRight,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import type { Room } from '../../types';
import { rankCandidateDates, formatDateDisplay } from '../../lib/rankingEngine';
import { storageService } from '../../services/storageService';

interface AdminApprovalPanelProps {
  room: Room;
  onFinalize: (dateId: string, notes: string) => void;
}

export const AdminApprovalPanel: React.FC<AdminApprovalPanelProps> = ({ room, onFinalize }) => {
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const rankedResults = rankCandidateDates(room);

  const handleToggleMustAttend = (memberId: string) => {
    storageService.toggleMustAttend(room.token, memberId);
  };

  const handleConfirmFinalize = (dateId: string) => {
    setSelectedDateId(dateId);
  };

  const handleExecuteFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateId) return;
    onFinalize(selectedDateId, notes);
  };

  return (
    <div className="space-y-6">
      {/* Admin Control Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <FileCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">Dashboard Persetujuan Admin</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Evaluasi hasil konsensus otomatis dan finalisasi tanggal acara terbaik untuk tim.
            </p>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>{showConfig ? 'Sembunyikan Kriteria' : 'Atur Kriteria & Anggota Wajib'}</span>
          </button>
        </div>

        {/* Collapsible Config: Must-Attend & Thresholds */}
        {showConfig && (
          <div className="mt-4 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
            {/* Must-Attend Toggles */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Tentukan Anggota Wajib (Must-Attend)</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {room.criteria.mustAttendMemberIds.length} dipilih
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Tanggal yang tidak dihadiri anggota ini akan otomatis diturunkan peringkatnya.
              </p>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {room.members.map((member) => {
                  const isMust = room.criteria.mustAttendMemberIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => handleToggleMustAttend(member.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition border ${
                        isMust
                          ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className={`w-5 h-5 rounded-full ${member.avatarColor || 'bg-slate-400'} text-white text-[9px] flex items-center justify-center font-bold`}>
                          {member.name.charAt(0)}
                        </div>
                        <span className="truncate">{member.name}</span>
                      </div>
                      <span className="flex items-center gap-1 text-[11px]">
                        {isMust ? (
                          <>
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>Wajib</span>
                          </>
                        ) : (
                          <span className="text-slate-400">Opsional</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Turnout Thresholds Adjustment */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>Target & Ambang Batas</span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Ambang Minimal Kehadiran</span>
                  <span className="font-mono font-bold text-blue-600">{room.criteria.minTurnoutPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={room.criteria.minTurnoutPercentage}
                  onChange={(e) =>
                    storageService.updateRoomCriteria(room.token, {
                      minTurnoutPercentage: Number(e.target.value),
                    })
                  }
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={typeof room.criteria.targetTurnoutPercentage === 'number'}
                    onChange={(e) =>
                      storageService.updateRoomCriteria(room.token, {
                        targetTurnoutPercentage: e.target.checked ? 30 : undefined,
                      })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-xs font-medium text-slate-700">Aktifkan Target Kapasitas Tertentu</span>
                </label>

                {typeof room.criteria.targetTurnoutPercentage === 'number' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">Target kehadiran:</span>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={room.criteria.targetTurnoutPercentage}
                      onChange={(e) =>
                        storageService.updateRoomCriteria(room.token, {
                          targetTurnoutPercentage: Number(e.target.value),
                        })
                      }
                      className="w-16 px-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg"
                    />
                    <span className="text-xs text-slate-600">% (e.g. venue terbatas)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard of Ranked Dates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Peringkat Tanggal Berdasarkan Algoritma Janjian</span>
          </h3>
          <span className="text-xs text-slate-500">Urutan teratas adalah rekomendasi paling optimal</span>
        </div>

        <div className="space-y-3">
          {rankedResults.map((result, index) => {
            const isTop = index === 0;
            return (
              <div
                key={result.dateId}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isTop
                    ? 'bg-gradient-to-r from-emerald-50/80 to-blue-50/50 border-emerald-300 shadow-sm ring-1 ring-emerald-400/40'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Rank Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                        isTop
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      #{result.rank}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-slate-900">
                          {formatDateDisplay(result.date, result.timeSlot)}
                        </span>
                        {result.label && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium text-slate-600">
                            {result.label}
                          </span>
                        )}
                        {isTop && result.isRecommended && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                            Rekomendasi Utama
                          </span>
                        )}
                      </div>

                      {/* Stats line */}
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                        <span className="font-semibold text-slate-800">
                          {result.availableCount} / {result.totalMembers} Anggota Hadir ({result.availabilityPercentage}%)
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>
                          {result.mustAttendSatisfied ? (
                            <strong className="text-emerald-700">Anggota Wajib Lengkap ✓</strong>
                          ) : (
                            <strong className="text-rose-600">Anggota Wajib Kurang ✕</strong>
                          )}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-slate-400">Skor: {result.compositeScore}</span>
                      </div>

                      {/* Explanations */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {result.reasons.map((reason, rIdx) => (
                          <span
                            key={rIdx}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/80 text-slate-600"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Approve Button */}
                  <div className="self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleConfirmFinalize(result.dateId)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition active:scale-95 shadow-sm ${
                        isTop
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Setujui Tanggal Ini</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation & Finalization Modal */}
      {selectedDateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Konfirmasi Jadwal Final</h3>
                <p className="text-xs text-slate-500">Kirim pengumuman resmi ke seluruh anggota community</p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              <p className="font-bold">Tanggal Terpilih:</p>
              <p className="font-semibold text-sm mt-0.5">
                {formatDateDisplay(
                  room.candidateDates.find((cd) => cd.id === selectedDateId)?.date || '',
                  room.candidateDates.find((cd) => cd.id === selectedDateId)?.timeSlot
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Catatan Lokasi / Arahan Admin (Opsional)
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Rapat diadakan di Ruang Rapat CC Timur lt. 2 atau via Google Meet link..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDateId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteFinalize}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95"
              >
                <span>Finalisasi & Siarkan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
