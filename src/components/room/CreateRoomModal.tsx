import React, { useState } from 'react';
import { CalendarPlus, Plus, Trash2, X, Sliders, ShieldCheck, Calendar as CalendarIcon } from 'lucide-react';
import { storageService } from '../../services/storageService';
import type { TimeSlotType } from '../../types';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (token: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [adminName, setAdminName] = useState('');
  const [minTurnout, setMinTurnout] = useState(50);
  const [hasTargetTurnout, setHasTargetTurnout] = useState(false);
  const [targetTurnout, setTargetTurnout] = useState(30);

  // Default candidate dates: upcoming 3 days
  const today = new Date();
  const getFutureDateStr = (days: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const [candidateDates, setCandidateDates] = useState<
    { date: string; timeSlot: TimeSlotType; label: string }[]
  >([
    { date: getFutureDateStr(3), timeSlot: 'all-day', label: 'Opsi Hari 1' },
    { date: getFutureDateStr(4), timeSlot: 'all-day', label: 'Opsi Hari 2' },
    { date: getFutureDateStr(5), timeSlot: 'all-day', label: 'Opsi Hari 3' },
  ]);

  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddCandidateDate = () => {
    setCandidateDates([
      ...candidateDates,
      {
        date: getFutureDateStr(candidateDates.length + 3),
        timeSlot: 'all-day',
        label: `Opsi Hari ${candidateDates.length + 1}`,
      },
    ]);
  };

  const handleRemoveCandidateDate = (index: number) => {
    if (candidateDates.length <= 1) {
      setError('Minimal harus ada 1 opsi tanggal kandidat.');
      return;
    }
    setCandidateDates(candidateDates.filter((_, i) => i !== index));
  };

  const handleUpdateDate = (index: number, field: string, value: string) => {
    const updated = [...candidateDates];
    updated[index] = { ...updated[index], [field]: value };
    setCandidateDates(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nama Community / Organisasi wajib diisi.');
      return;
    }
    if (!adminName.trim()) {
      setError('Nama Admin / Host penyelenggara wajib diisi.');
      return;
    }
    if (candidateDates.length === 0) {
      setError('Tambahkan minimal 1 tanggal kandidat.');
      return;
    }

    const room = storageService.createRoom({
      name: name.trim(),
      description: description.trim(),
      adminName: adminName.trim(),
      candidateDates: candidateDates.map((cd) => ({
        date: cd.date,
        timeSlot: cd.timeSlot,
        label: cd.label,
      })),
      criteria: {
        minTurnoutPercentage: minTurnout,
        targetTurnoutPercentage: hasTargetTurnout ? targetTurnout : undefined,
        mustAttendMemberIds: [], // will be configured from the room dashboard
      },
    });

    onCreated(room.token);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <CalendarPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Buat Community Baru</h3>
              <p className="text-xs text-slate-500">Mulai penjadwalan kolaboratif berbasis token</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {error}
            </div>
          )}

          {/* Room Name & Admin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Community / Acara *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Rapat Pleno GDG"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Anda (Admin/Host) *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Fabian Alvaro"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Deskripsi Acara (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Jelaskan tujuan pertemuan atau agenda singkat..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
            />
          </div>

          {/* Candidate Dates List */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilihan Tanggal Kandidat</span>
              </label>
              <button
                type="button"
                onClick={handleAddCandidateDate}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Tanggal</span>
              </button>
            </div>

            <div className="space-y-2">
              {candidateDates.map((cd, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <input
                    type="date"
                    value={cd.date}
                    onChange={(e) => handleUpdateDate(index, 'date', e.target.value)}
                    className="text-xs font-mono bg-white px-2 py-1.5 border border-slate-200 rounded-lg outline-none"
                  />
                  <select
                    value={cd.timeSlot}
                    onChange={(e) => handleUpdateDate(index, 'timeSlot', e.target.value)}
                    className="text-xs bg-white px-2 py-1.5 border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="all-day">Seharian</option>
                    <option value="morning">Pagi</option>
                    <option value="afternoon">Siang</option>
                    <option value="evening">Malam</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Label/Sesi"
                    value={cd.label}
                    onChange={(e) => handleUpdateDate(index, 'label', e.target.value)}
                    className="text-xs bg-white px-2 py-1.5 border border-slate-200 rounded-lg flex-1 outline-none min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCandidateDate(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Criteria & Attendance Rules */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kriteria & Ambang Batas Kehadiran</span>
            </div>

            {/* Min Turnout Slider */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-700">Ambang Minimal Kehadiran</span>
                <span className="font-bold font-mono text-blue-600">{minTurnout}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={minTurnout}
                onChange={(e) => setMinTurnout(Number(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Tanggal yang mencapai &ge; {minTurnout}% akan ditandai hijau/layak.
              </p>
            </div>

            {/* Target Turnout (Venue matching) */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasTargetTurnout}
                  onChange={(e) => setHasTargetTurnout(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700">
                  Batasi / Targetkan Kapasitas Venue Khusus
                </span>
              </label>

              {hasTargetTurnout && (
                <div className="pl-6 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">Target kehadiran:</span>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={targetTurnout}
                      onChange={(e) => setTargetTurnout(Number(e.target.value))}
                      className="w-16 px-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg"
                    />
                    <span className="text-xs text-slate-600">% anggota</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sistem akan memprioritaskan tanggal dengan kehadiran mendekati angka ini.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Buat Community & Dapatkan Token</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
