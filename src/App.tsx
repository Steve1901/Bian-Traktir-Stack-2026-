import { useState, useEffect } from 'react';
import { Users, Copy, KeyRound } from 'lucide-react';
import type { Room, Member } from './types';
import { storageService } from './services/storageService';
import { Navbar, type NavTab } from './components/layout/Navbar';
import { SharedCalendarView } from './components/calendar/SharedCalendarView';
import { AdminApprovalPanel } from './components/dashboard/AdminApprovalPanel';
import { FinalizedEventView } from './components/event/FinalizedEventView';
import { CreateRoomModal } from './components/room/CreateRoomModal';
import { JoinRoomModal } from './components/room/JoinRoomModal';

export function App() {
  const [activeToken, setActiveToken] = useState<string>('STACK-ITB');
  const [room, setRoom] = useState<Room | null>(null);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [activeUser, setActiveUser] = useState<Member | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>('calendar');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const isAllMode = activeToken === 'ALL';

  const refreshState = () => {
    const roomsList = storageService.getAllRooms();
    setAllRooms(roomsList);

    const currentRoom = activeToken === 'ALL' ? null : storageService.getRoomByToken(activeToken);
    setRoom(currentRoom);

    const currentUser = storageService.getActiveUser();
    if (currentRoom && currentUser) {
      const match = currentRoom.members.find((m) => m.id === currentUser.id);
      setActiveUser(match || currentRoom.members[0] || null);
    } else if (currentRoom) {
      setActiveUser(currentRoom.members[0] || null);
    } else if (currentUser) {
      setActiveUser(currentUser);
    } else if (roomsList.length > 0) {
      setActiveUser(roomsList[0].members[0] || null);
    }
  };

  useEffect(() => {
    refreshState();
    const unsubscribe = storageService.subscribe(() => {
      refreshState();
    });
    return () => unsubscribe();
  }, [activeToken]);

  useEffect(() => {
    if (!isAllMode && room?.status === 'FINALIZED') {
      setCurrentTab('finalized');
    }
  }, [room?.status, isAllMode]);

  const handleSelectUser = (member: Member) => {
    storageService.setActiveUser(member);
    setActiveUser(member);
  };

  const handleFinalize = (dateId: string, notes: string) => {
    if (!room) return;
    storageService.finalizeSchedule(room.token, dateId, notes);
    setCurrentTab('finalized');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-12">
      {/* Top Navbar with integrated Tabs & Mobile Hamburger */}
      <Navbar
        activeToken={activeToken}
        room={room}
        allRooms={allRooms}
        activeUser={activeUser}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onSelectRoom={(token) => {
          setActiveToken(token);
          setCurrentTab('calendar');
        }}
        onSelectUser={handleSelectUser}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onOpenJoinModal={() => setIsJoinOpen(true)}
        onResetDemo={() => {
          storageService.resetDemoData();
          setActiveToken('STACK-ITB');
          setCurrentTab('calendar');
          refreshState();
        }}
      />

      {/* Main Container - Dynamic Full Width */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {isAllMode || room ? (
          <>
            {currentTab === 'calendar' && (
              <SharedCalendarView
                isAllMode={isAllMode}
                room={room}
                allRooms={allRooms}
                activeUser={activeUser}
              />
            )}

            {!isAllMode && room && currentTab === 'admin' && (
              <AdminApprovalPanel room={room} onFinalize={handleFinalize} />
            )}

            {!isAllMode && room && currentTab === 'finalized' && (
              <FinalizedEventView room={room} activeUser={activeUser} />
            )}

            {!isAllMode && room && currentTab === 'members' && (
              <div className="w-full bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Daftar Anggota Community</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gunakan token <strong>{room.token}</strong> untuk mengundang anggota lain ke community ini.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Token Community
                      </p>
                      <p className="font-mono text-base font-extrabold text-slate-900">{room.token}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(room.token);
                      alert(`Token ${room.token} berhasil disalin!`);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Token</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {room.members.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 bg-slate-50/60 border border-slate-200/80 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className={`w-7 h-7 rounded-full ${
                            member.avatarColor || 'bg-slate-400'
                          } text-white text-[11px] flex items-center justify-center font-bold shrink-0`}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">{member.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {member.role === 'admin' ? 'Host Admin' : 'Anggota'}
                          </p>
                        </div>
                      </div>

                      {member.isMustAttend && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                          ★ Wajib
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
            <h2 className="text-xl font-bold text-slate-800">Community Tidak Ditemukan</h2>
            <button
              type="button"
              onClick={() => {
                storageService.resetDemoData();
                setActiveToken('STACK-ITB');
                refreshState();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Buka Community Default (STACK-ITB)
            </button>
          </div>
        )}
      </main>

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
