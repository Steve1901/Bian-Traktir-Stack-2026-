import React, { useState } from 'react';
import { KeyRound, User, ArrowRight, X, Sparkles } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: (token: string) => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ isOpen, onClose, onJoined }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const token = tokenInput.trim().toUpperCase();
    const name = nameInput.trim();

    if (!token) {
      setError('Masukkan token community yang valid (misal: STACK-ITB).');
      return;
    }

    if (!name) {
      setError('Masukkan nama atau panggilan Anda.');
      return;
    }

    const result = storageService.joinRoom(token, name);
    if (!result) {
      setError(`Community dengan token "${token}" tidak ditemukan. Pastikan token benar.`);
      return;
    }

    onJoined(token);
    onClose();
  };

  const handleUseDemo = () => {
    setTokenInput('STACK-ITB');
    setNameInput('Fabian Alvaro Muhammad');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Gabung ke Community Janjian</h3>
              <p className="text-xs text-slate-500">Gunakan token unik yang dibagikan admin</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Token Community
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Contoh: STACK-ITB atau JAN-XXXX"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                className="w-full pl-3.5 pr-20 py-2.5 text-sm font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
              <button
                type="button"
                onClick={handleUseDemo}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
              >
                <Sparkles className="w-3 h-3" />
                <span>Demo</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Anda
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Contoh: Stevanus Herdi"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition"
            >
              <span>Lanjut ke Kalender Community</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
