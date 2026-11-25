import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronDown,
  Plus,
  KeyRound,
  Check,
  Copy,
  Share2,
  Menu,
  X,
  RotateCcw,
  CheckCircle2,
  Building2,
  Shield,
} from 'lucide-react';
import type { Room, Member } from '../../types';

interface NavbarProps {
  room: Room | null;
  allRooms: Room[];
  activeUser: Member | null;
  onSelectRoom: (token: string) => void;
  onSelectUser: (member: Member) => void;
  onOpenCreateModal: () => void;
  onOpenJoinModal: () => void;
  onResetDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  room,
  allRooms,
  activeUser,
  onSelectRoom,
  onSelectUser,
  onOpenCreateModal,
  onOpenJoinModal,
  onResetDemo,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const roomsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (roomsRef.current && !roomsRef.current.contains(e.target as Node)) {
        setRoomsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleCopyShareLink = () => {
    if (!room) return;
    const url = `${window.location.origin}${window.location.pathname}?token=${room.token}`;
    navigator.clipboard.writeText(`Ayo tentukan jadwal "${room.name}" di Janjian!\nToken Room: ${room.token}\nTautan: ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all shadow-xs">
      {/* Dynamic full-width container (no max-w limit) */}
      <div className="w-full px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-3">
        
        {/* ========================================================= */}
        {/* HStack: [ Janjian , profile (dropdown) , rooms (dropdown) ]*/}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* 1. Brand: Janjian */}
          <div className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Calendar className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 hidden xs:inline">
              Janjian
            </span>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 mx-0.5 hidden sm:block" />

          {/* 2. Profile Dropdown */}
          {activeUser && (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setRoomsOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  profileOpen
                    ? 'bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-100'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full ${
                    activeUser.avatarColor || 'bg-blue-600'
                  } text-white text-[10px] flex items-center justify-center font-bold shrink-0`}
                >
                  {activeUser.name.charAt(0)}
                </div>
                <span className="truncate max-w-[100px] sm:max-w-[120px]">
                  {activeUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Profile dropdown menu */}
              {profileOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-2.5 py-2 border-b border-slate-100 mb-1.5">
                    <p className="text-xs font-bold text-slate-900 truncate">{activeUser.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">
                      {activeUser.role === 'admin' ? 'Host Admin Room' : 'Anggota Room'}
                    </p>
                  </div>

                  {/* Switch user options from current room members */}
                  {room && (
                    <div className="space-y-1">
                      <p className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Ganti Akun Demo
                      </p>
                      {room.members.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => {
                            onSelectUser(member);
                            setProfileOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                            activeUser.id === member.id
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div
                              className={`w-4 h-4 rounded-full ${
                                member.avatarColor || 'bg-slate-400'
                              } text-white text-[9px] flex items-center justify-center font-bold`}
                            >
                              {member.name.charAt(0)}
                            </div>
                            <span className="truncate">{member.name}</span>
                          </div>
                          {member.role === 'admin' && (
                            <Shield className="w-3 h-3 text-amber-500 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Rooms Dropdown (Compact, with Add Room element) */}
          <div className="relative" ref={roomsRef}>
            <button
              type="button"
              onClick={() => {
                setRoomsOpen(!roomsOpen);
                setProfileOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
                roomsOpen
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-100'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[180px]">
                {room ? room.name : 'Pilih Room'}
              </span>
              {room && (
                <span className="text-[10px] font-mono text-slate-400 hidden md:inline">
                  ({room.token})
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Rooms dropdown menu */}
            {roomsOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Rooms Anda ({allRooms.length})
                  </span>
                </div>

                {/* List of joined rooms */}
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {allRooms.map((r) => {
                    const isCurrent = room?.token.toUpperCase() === r.token.toUpperCase();
                    return (
                      <button
                        key={r.token}
                        type="button"
                        onClick={() => {
                          onSelectRoom(r.token);
                          setRoomsOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                          isCurrent
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-semibold">{r.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">{r.token}</p>
                        </div>
                        {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Divider & Action Buttons */}
                <div className="border-t border-slate-100 mt-2 pt-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRoomsOpen(false);
                      onOpenCreateModal();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Buat Room Baru</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRoomsOpen(false);
                      onOpenJoinModal();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>Masuk dengan Token</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* Right Actions: Desktop Quick Bar & Mobile Hamburger Menu   */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2">
          
          {/* Desktop Only Actions */}
          <div className="hidden sm:flex items-center gap-2">
            {room && (
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                title="Salin Tautan Room"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Tersalin' : 'Bagikan'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onResetDemo}
              title="Reset data demo"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="sm:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Hamburger Slide-Down Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3 animate-in fade-in slide-in-from-top-1 shadow-lg">
          {room && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Token Room Aktif</p>
                <p className="font-mono text-sm font-extrabold text-slate-900">{room.token}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          )}

          <div className="space-y-1 pt-1">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCreateModal();
              }}
              className="w-full text-left py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Buat Room Baru</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenJoinModal();
              }}
              className="w-full text-left py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Masuk dengan Token</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onResetDemo();
              }}
              className="w-full text-left py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>Reset Data Demo</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
