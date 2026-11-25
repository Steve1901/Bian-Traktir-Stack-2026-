import React, { useState } from 'react';
import {
  Sparkles,
  Shuffle,
  ChevronUp,
  ChevronDown,
  Bell,
  Shield,
  Star,
} from 'lucide-react';
import type { Room, Member, VoteStatus } from '../../types';
import { storageService } from '../../services/storageService';

interface DemoControlBarProps {
  room: Room | null;
  activeUser: Member | null;
  onSelectUser: (member: Member) => void;
}

export const DemoControlBar: React.FC<DemoControlBarProps> = ({ room, activeUser, onSelectUser }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!room) return null;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSimulateRandomVotes = () => {
    room.members.forEach((m) => {
      room.candidateDates.forEach((cd) => {
        // Weighted random towards available
        const rand = Math.random();
        let status: VoteStatus = 'available';
        if (rand < 0.2) status = 'unavailable';
        else if (rand < 0.4) status = 'tentative';

        storageService.submitVote(room.token, m.id, m.name, cd.id, status);
      });
    });

    triggerToast('Simulasi voting acak untuk semua anggota berhasil dijalankan!');
  };

  return (
    <>
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Demo Simulator Bar */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-2xl p-3 pointer-events-auto transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold tracking-tight">Demo & Evaluator Bar</p>
                <p className="text-[10px] text-slate-400 hidden sm:block">
                  Pindah peran anggota untuk menguji voting multi-user & konsensus
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSimulateRandomVotes}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg flex items-center gap-1 transition active:scale-95"
              >
                <Shuffle className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Acak Suara</span>
              </button>

              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Member Switcher List */}
          {!isCollapsed && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1">
                Pilih User:
              </span>
              {room.members.map((member) => {
                const isActive = activeUser?.id === member.id;
                return (
                  <button
                    key={member.id}
                    onClick={() => onSelectUser(member)}
                    className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full ${member.avatarColor || 'bg-slate-500'} text-white text-[8px] flex items-center justify-center font-bold`}>
                      {member.name.charAt(0)}
                    </div>
                    <span className="truncate max-w-[100px]">{member.name.split(' ')[0]}</span>
                    {member.role === 'admin' && (
                      <Shield className="w-3 h-3 text-amber-300 shrink-0" />
                    )}
                    {member.isMustAttend && member.role !== 'admin' && (
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
