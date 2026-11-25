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
  ShieldCheck,
  Users,
  CheckCircle,
  Layers,
} from 'lucide-react';
import type { Room, Member } from '../../types';

export type NavTab = 'calendar' | 'admin' | 'finalized' | 'members';

interface NavbarProps {
  activeToken: string; // 'ALL' or specific community token
  room: Room | null;
  allRooms: Room[];
  activeUser: Member | null;
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onSelectRoom: (token: string) => void;
  onSelectUser: (member: Member) => void;
  onOpenCreateModal: () => void;
  onOpenJoinModal: () => void;
  onResetDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeToken,
  room,
  allRooms,
  activeUser,
  currentTab,
  onSelectTab,
  onSelectRoom,
  onSelectUser,
  onOpenCreateModal,
  onOpenJoinModal,
  onResetDemo,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [communitiesOpen, setCommunitiesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const communitiesRef = useRef<HTMLDivElement>(null);

  const isAllMode = activeToken === 'ALL';

  // Unique members across all communities for switching user when in ALL mode
  const switchableMembers = React.useMemo(() => {
    if (room) return room.members;
    const map = new Map<string, Member>();
    allRooms.forEach((r) => r.members.forEach((m) => map.set(m.id, m)));
    return Array.from(map.values());
  }, [room, allRooms]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (communitiesRef.current && !communitiesRef.current.contains(e.target as Node)) {
        setCommunitiesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleCopyShareLink = () => {
    if (!room) return;
    const url = `${window.location.origin}${window.location.pathname}?token=${room.token}`;
    navigator.clipboard.writeText(
      `Ayo tentukan jadwal "${room.name}" di Janjian!\nToken Community: ${room.token}\nTautan: ${url}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        {/* Left HStack: [ Janjian (text only), Profile (dropdown), Community (dropdown) ] */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* 1. Brand: Text "Janjian" only (no logo icon) */}
          <button
            type="button"
            onClick={() => onSelectTab('calendar')}
            className="font-extrabold text-xl tracking-tight text-slate-900 hover:text-blue-600 transition select-none"
          >
            Janjian
          </button>

          <div className="h-5 w-[1px] bg-slate-200 mx-0.5 hidden sm:block" />

          {/* 2. Profile Dropdown */}
          {activeUser && (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setCommunitiesOpen(false);
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
                <span className="truncate max-w-[90px] sm:max-w-[110px]">
                  {activeUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {profileOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-2.5 py-2 border-b border-slate-100 mb-1.5">
                    <p className="text-xs font-bold text-slate-900 truncate">{activeUser.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {activeUser.role === 'admin' ? 'Host Admin Community' : 'Anggota Community'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Ganti Akun
                    </p>
                    {switchableMembers.map((member) => (
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
                </div>
              )}
            </div>
          )}

          {/* 3. Community Dropdown (with "All Communities" + Add Community) */}
          <div className="relative" ref={communitiesRef}>
            <button
              type="button"
              onClick={() => {
                setCommunitiesOpen(!communitiesOpen);
                setProfileOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
                communitiesOpen
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-100'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
              }`}
            >
              {isAllMode ? (
                <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              ) : (
                <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              )}
              <span className="truncate max-w-[115px] sm:max-w-[170px]">
                {isAllMode ? 'All Communities' : room ? room.name : 'Pilih Community'}
              </span>
              {!isAllMode && room && (
                <span className="text-[10px] font-mono text-slate-400 hidden xl:inline">
                  ({room.token})
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {communitiesOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Communities Anda ({allRooms.length})
                  </span>
                </div>

                {/* Option: All Communities */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectRoom('ALL');
                    setCommunitiesOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition mb-1 ${
                    isAllMode
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">All Communities</p>
                      <p className="text-[10px] text-slate-400">Lihat semua agenda gabungan</p>
                    </div>
                  </div>
                  {isAllMode && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </button>

                <div className="border-t border-slate-100 my-1" />

                {/* List of joined communities */}
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {allRooms.map((r) => {
                    const isCurrent = !isAllMode && room?.token.toUpperCase() === r.token.toUpperCase();
                    return (
                      <button
                        key={r.token}
                        type="button"
                        onClick={() => {
                          onSelectRoom(r.token);
                          setCommunitiesOpen(false);
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

                {/* Add / Join Community */}
                <div className="border-t border-slate-100 mt-2 pt-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCommunitiesOpen(false);
                      onOpenCreateModal();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Community Baru</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCommunitiesOpen(false);
                      onOpenJoinModal();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>Gabung Community (Token)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center/Inline Desktop Navigation Tabs (Moved into Top Navbar) */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70">
          <button
            type="button"
            onClick={() => onSelectTab('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              currentTab === 'calendar'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Kalender & Voting</span>
          </button>

          {!isAllMode && (
            <button
              type="button"
              onClick={() => onSelectTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentTab === 'admin'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Persetujuan Admin</span>
              {room?.status === 'VOTING' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </button>
          )}

          {!isAllMode && room?.status === 'FINALIZED' && (
            <button
              type="button"
              onClick={() => onSelectTab('finalized')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentTab === 'finalized'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hasil Final</span>
            </button>
          )}

          {!isAllMode && room && (
            <button
              type="button"
              onClick={() => onSelectTab('members')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentTab === 'members'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Anggota ({room.members.length})</span>
            </button>
          )}
        </nav>

        {/* Right Actions: Desktop Utilities & Mobile Hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-1.5">
            {!isAllMode && room && (
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                title="Salin Tautan Community"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                )}
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

          {/* Mobile Hamburger Button (shown below md) */}
          <div className="md:hidden">
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

      {/* Mobile Hamburger Menu: Collapsed Tabs + Settings */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3 animate-in fade-in slide-in-from-top-1 shadow-lg">
          {/* Navigation Tabs */}
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Navigasi
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectTab('calendar');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                currentTab === 'calendar' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Kalender & Voting</span>
            </button>

            {!isAllMode && (
              <button
                type="button"
                onClick={() => {
                  onSelectTab('admin');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                  currentTab === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Persetujuan Admin</span>
              </button>
            )}

            {!isAllMode && room?.status === 'FINALIZED' && (
              <button
                type="button"
                onClick={() => {
                  onSelectTab('finalized');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                  currentTab === 'finalized' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Hasil Final</span>
              </button>
            )}

            {!isAllMode && room && (
              <button
                type="button"
                onClick={() => {
                  onSelectTab('members');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                  currentTab === 'members' ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Anggota ({room.members.length})</span>
              </button>
            )}
          </div>

          {/* Active Community Token */}
          {!isAllMode && room && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Token Community
                </p>
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

          {/* Actions & Settings */}
          <div className="border-t border-slate-100 pt-2 space-y-1">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCreateModal();
              }}
              className="w-full text-left py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Buat Community Baru</span>
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
              <span>Gabung Community (Token)</span>
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
