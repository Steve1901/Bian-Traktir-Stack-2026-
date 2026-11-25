import { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  ShieldCheck,
  Users,
  Copy,
  Check,
  Share2,
  KeyRound,
} from 'lucide-react';
import type { Room, Member } from './types';
import { storageService } from './services/storageService';
import { Navbar } from './components/layout/Navbar';
import { SharedCalendarView } from './components/calendar/SharedCalendarView';
import { AdminApprovalPanel } from './components/dashboard/AdminApprovalPanel';
import { FinalizedEventView } from './components/event/FinalizedEventView';
import { CreateRoomModal } from './components/room/CreateRoomModal';
import { JoinRoomModal } from './components/room/JoinRoomModal';
import { DemoControlBar } from './components/demo/DemoControlBar';

export function App() {
  const [activeToken, setActiveToken] = useState<string>('STACK-ITB');
  const [room, setRoom] = useState<Room | null>(null);
  const [activeUser, setActiveUser] = useState<Member | null>(null);
  const [currentTab, setCurrentTab] = useState<'calendar' | 'admin' | 'finalized' | 'members'>('calendar');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Sync state from storageService
  const refreshState = () => {
    const currentRoom = storageService.getRoomByToken(activeToken);
    setRoom(currentRoom);

    const currentUser = storageService.getActiveUser();
    // Ensure active user belongs to room members if possible
    if (currentRoom && currentUser) {
      const match = currentRoom.members.find((m) => m.id === currentUser.id);
      if (match) {
        setActiveUser(match);
      } else {
        setActiveUser(currentRoom.members[0] || null);
      }
    } else if (currentRoom) {
      setActiveUser(currentRoom.members[0] || null);
    }
  };

  useEffect(() => {
    refreshState();
    const unsubscribe = storageService.subscribe(() => {
      refreshState();
    });
    return () => unsubscribe();
  }, [activeToken]);

  // When room status changes to FINALIZED, auto-switch to finalized tab
  useEffect(() => {
    if (room?.status === 'FINALIZED') {
      setCurrentTab('finalized');
    }
  }, [room?.status]);

  const handleSelectUser = (member: Member) => {
    storageService.setActiveUser(member);
    setActiveUser(member);
  };

  const handleFinalize = (dateId: string, notes: string) => {
    if (!room) return;
    storageService.finalizeSchedule(room.token, dateId, notes);
    setCurrentTab('finalized');
  };

  const handleCopyShareLink = () => {
    if (!room) return;
    const url = `${window.location.origin}${window.location.pathname}?token=${room.token}`;
    navigator.clipboard.writeText(`Ayo tentukan jadwal "${room.name}" di Janjian!\nToken Room: ${room.token}\nTautan: ${url}`);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-24">
      {/* Top Navigation */}
      <Navbar
        room={room}
        activeUser={activeUser}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onOpenJoinModal={() => setIsJoinOpen(true)}
        onSelectUser={handleSelectUser}
        onResetDemo={() => {
          storageService.resetDemoData();
          setActiveToken('STACK-ITB');
          refreshState();
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {room ? (
          <>
            {/* Room Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
                <button
                  onClick={() => setCurrentTab('calendar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    currentTab === 'calendar'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Kalender & Voting</span>
                </button>

                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    currentTab === 'admin'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Persetujuan Admin</span>
                  {room.status === 'VOTING' && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  )}
                </button>

                {room.status === 'FINALIZED' && (
                  <button
                    onClick={() => setCurrentTab('finalized')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      currentTab === 'finalized'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hasil Final</span>
                  </button>
                )}

                <button
                  onClick={() => setCurrentTab('members')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    currentTab === 'members'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Anggota ({room.members.length})</span>
                </button>
              </div>

              {/* Share Token Button */}
              <button
                onClick={handleCopyShareLink}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition active:scale-95"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedToken ? 'Tautan Tersalin!' : 'Bagikan Token Room'}</span>
              </button>
            </div>

            {/* Tab Views */}
            {currentTab === 'calendar' && (
              <SharedCalendarView room={room} activeUser={activeUser} />
            )}

            {currentTab === 'admin' && (
              <AdminApprovalPanel room={room} onFinalize={handleFinalize} />
            )}

            {currentTab === 'finalized' && (
              <FinalizedEventView room={room} activeUser={activeUser} />
            )}

            {currentTab === 'members' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>Daftar Anggota Room</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Bagikan token <strong>{room.token}</strong> ke anggota lain agar mereka dapat bergabung dan mengisi ketersediaan jadwal.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Token Masuk Room:</p>
                      <p className="font-mono text-xl font-extrabold text-slate-900 tracking-wider">
                        {room.token}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyShareLink}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Token & Tautan</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {room.members.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`w-8 h-8 rounded-full ${member.avatarColor || 'bg-slate-400'} text-white text-xs flex items-center justify-center font-bold shrink-0`}>
                          {member.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">{member.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {member.role === 'admin' ? 'Host / Admin' : 'Anggota'}
                          </p>
                        </div>
                      </div>

                      {member.isMustAttend && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                          ★ Must-Attend
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">Room Tidak Ditemukan</h2>
            <p className="text-sm text-slate-500">
              Token room tidak valid atau belum dibuat.
            </p>
            <button
              onClick={() => {
                storageService.resetDemoData();
                setActiveToken('STACK-ITB');
                refreshState();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Buka Room Demo (STACK-ITB)
            </button>
          </div>
        )}
      </main>

      {/* Floating Demo Simulator Bar */}
      <DemoControlBar
        room={room}
        activeUser={activeUser}
        onSelectUser={handleSelectUser}
      />

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(token) => {
          setActiveToken(token);
          setCurrentTab('calendar');
        }}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoined={(token) => {
          setActiveToken(token);
          setCurrentTab('calendar');
        }}
      />
    </div>
  );
}

export default App;
