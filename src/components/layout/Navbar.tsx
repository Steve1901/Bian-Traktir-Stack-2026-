import React from 'react';
import { Calendar, Users, Copy, Check, PlusCircle, RotateCcw, ArrowRightLeft } from 'lucide-react';
import type { Room, Member } from '../../types';

interface NavbarProps {
  room: Room | null;
  activeUser: Member | null;
  onOpenCreateModal: () => void;
  onOpenJoinModal: () => void;
  onSelectUser: (member: Member) => void;
  onResetDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  room,
  activeUser,
  onOpenCreateModal,
  onOpenJoinModal,
  onSelectUser,
  onResetDemo,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyToken = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Calendar className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Janjian
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                STACK 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Token-Based Collaborative Scheduling</p>
          </div>
        </div>

        {/* Center: Active Room Token Badge */}
        {room && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-300/80 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 hover:bg-slate-200/80 transition-colors">
              <span className="text-slate-400">Token:</span>
              <span className="font-mono font-bold text-slate-900 tracking-wider">{room.token}</span>
              <button
                onClick={handleCopyToken}
                title="Salin Token Room"
                className="ml-1 p-1 rounded-full hover:bg-slate-300/60 text-slate-500 hover:text-slate-800 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Right Actions: User Switcher & Modals */}
        <div className="flex items-center gap-2">
          {/* Active User Pill with dropdown switch */}
          {room && activeUser && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-xs font-medium text-slate-700 transition shadow-2xs">
                <div className={`w-5 h-5 rounded-full ${activeUser.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-[10px]`}>
                  {activeUser.name.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <span className="font-semibold block truncate max-w-[120px]">{activeUser.name}</span>
                </div>
                <ArrowRightLeft className="w-3 h-3 text-slate-400" />
              </button>

              {/* Dropdown to quickly switch simulated member */}
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Ganti Akun Demo
                </div>
                {room.members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => onSelectUser(member)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                      activeUser.id === member.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-4 h-4 rounded-full ${member.avatarColor || 'bg-blue-500'} text-white text-[9px] flex items-center justify-center font-bold`}>
                        {member.name.charAt(0)}
                      </div>
                      <span className="truncate">{member.name}</span>
                    </div>
                    {member.role === 'admin' && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded">Admin</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Join other room */}
          <button
            onClick={onOpenJoinModal}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Masuk Room</span>
          </button>

          {/* Create Room button */}
          <button
            onClick={onOpenCreateModal}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm shadow-blue-600/20 transition active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Buat Room</span>
          </button>

          {/* Reset Demo Data button */}
          <button
            onClick={onResetDemo}
            title="Reset data demo ke awal"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
