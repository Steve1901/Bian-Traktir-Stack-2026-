import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { Room, Member, Vote, CandidateDate, EventCriteria } from '../types';
import { generateRoomToken } from '../lib/rankingEngine';
import { db } from '../lib/firebase';

const COMMUNITIES_COLLECTION = 'communities';

/**
 * Removes undefined values recursively so Cloud Firestore setDoc never rejects them.
 */
function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Seed sample community based on GDG ITB STACK 2026 Project
export function createSeedRoom(): Room {
  const adminId = 'fabian-1';
  const members: Member[] = [
    {
      id: adminId,
      name: 'Fabian Alvaro Muhammad',
      role: 'admin',
      isMustAttend: true,
      avatarColor: 'bg-blue-600',
      joinedAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'gwein-2',
      name: 'Gwein Antaresya Al Farabi',
      role: 'member',
      isMustAttend: true,
      avatarColor: 'bg-emerald-600',
      joinedAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'stevanus-3',
      name: 'Stevanus Herdi Pamungkas',
      role: 'member',
      isMustAttend: false,
      avatarColor: 'bg-purple-600',
      joinedAt: Date.now() - 86400000 * 1,
    },
    {
      id: 'keisha-4',
      name: 'Keisha Namirea Aqueena',
      role: 'member',
      isMustAttend: false,
      avatarColor: 'bg-amber-600',
      joinedAt: Date.now() - 86400000 * 1,
    },
  ];

  const today = new Date();
  const makeDateStr = (daysAhead: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const candidateDates: CandidateDate[] = [
    {
      id: 'cd-1',
      date: makeDateStr(2),
      startTime: '14:00',
      endTime: '16:00',
      label: 'Sesi Evaluasi 1',
      description: 'Review progres frontend, backend, dan penyesuaian alur voting tim.',
    },
    {
      id: 'cd-2',
      date: makeDateStr(3),
      startTime: '19:00',
      endTime: '21:00',
      label: 'Sesi Evaluasi 2',
      description: 'Diskusi lanjutan integrasi data dan penyempurnaan UI mobile.',
    },
    {
      id: 'cd-3',
      date: makeDateStr(5),
      startTime: '15:30',
      endTime: '17:30',
      label: 'Gladi Bersih Presentasi',
      description: 'Simulasi pitch deck 5 menit + Q&A persiapan demo STACK 2026.',
    },
    {
      id: 'cd-4',
      date: makeDateStr(6),
      startTime: '10:00',
      endTime: '12:00',
      label: 'Finalisasi Demo',
      description: 'Pengecekan akhir live deployment dan pembagian peran presentasi.',
    },
  ];

  const votes: Record<string, Vote[]> = {
    'cd-1': [
      { memberId: 'fabian-1', memberName: 'Fabian Alvaro Muhammad', dateId: 'cd-1', status: 'available', updatedAt: 1 },
      { memberId: 'gwein-2', memberName: 'Gwein Antaresya Al Farabi', dateId: 'cd-1', status: 'available', updatedAt: 1 },
      { memberId: 'stevanus-3', memberName: 'Stevanus Herdi Pamungkas', dateId: 'cd-1', status: 'available', updatedAt: 1 },
    ],
    'cd-2': [
      { memberId: 'fabian-1', memberName: 'Fabian Alvaro Muhammad', dateId: 'cd-2', status: 'available', updatedAt: 1 },
      { memberId: 'gwein-2', memberName: 'Gwein Antaresya Al Farabi', dateId: 'cd-2', status: 'unavailable', updatedAt: 1 },
      { memberId: 'keisha-4', memberName: 'Keisha Namirea Aqueena', dateId: 'cd-2', status: 'available', updatedAt: 1 },
    ],
    'cd-3': [
      { memberId: 'fabian-1', memberName: 'Fabian Alvaro Muhammad', dateId: 'cd-3', status: 'available', updatedAt: 1 },
      { memberId: 'gwein-2', memberName: 'Gwein Antaresya Al Farabi', dateId: 'cd-3', status: 'available', updatedAt: 1 },
      { memberId: 'stevanus-3', memberName: 'Stevanus Herdi Pamungkas', dateId: 'cd-3', status: 'available', updatedAt: 1 },
      { memberId: 'keisha-4', memberName: 'Keisha Namirea Aqueena', dateId: 'cd-3', status: 'available', updatedAt: 1 },
    ],
    'cd-4': [
      { memberId: 'stevanus-3', memberName: 'Stevanus Herdi Pamungkas', dateId: 'cd-4', status: 'available', updatedAt: 1 },
      { memberId: 'keisha-4', memberName: 'Keisha Namirea Aqueena', dateId: 'cd-4', status: 'available', updatedAt: 1 },
    ],
  };

  return {
    id: 'room-stack-itb-2026',
    token: 'STACK-ITB',
    name: 'GDG ITB — STACK 2026 Team Sync',
    description: 'Pencocokan jadwal tim "bian traktir tomoro" untuk evaluasi berkala dan gladi bersih presentasi.',
    adminId,
    adminName: 'Fabian Alvaro Muhammad',
    createdAt: Date.now() - 86400000 * 2,
    members,
    candidateDates,
    votes,
    criteria: {
      minTurnoutPercentage: 50,
      mustAttendMemberIds: ['fabian-1', 'gwein-2'],
    },
    status: 'VOTING',
  };
}

export function createSeedRooms(): Room[] {
  const room1 = createSeedRoom();

  const today = new Date();
  const makeDateStr = (daysAhead: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const room2: Room = {
    id: 'room-bem-kmf-2026',
    token: 'BEM-KMF',
    name: 'Rapat Divisi Acara BEM 2026',
    description: 'Koordinasi rundown dan penanggung jawab per pos acara tahunan.',
    adminId: 'fabian-1',
    adminName: 'Fabian Alvaro Muhammad',
    createdAt: Date.now() - 86400000 * 4,
    members: [
      {
        id: 'fabian-1',
        name: 'Fabian Alvaro Muhammad',
        role: 'admin',
        isMustAttend: true,
        avatarColor: 'bg-blue-600',
        joinedAt: Date.now() - 86400000 * 4,
      },
      {
        id: 'stevanus-3',
        name: 'Stevanus Herdi Pamungkas',
        role: 'member',
        isMustAttend: false,
        avatarColor: 'bg-purple-600',
        joinedAt: Date.now() - 86400000 * 3,
      },
    ],
    candidateDates: [
      {
        id: 'bem-1',
        date: makeDateStr(1),
        startTime: '16:00',
        endTime: '18:00',
        label: 'Sesi Awal',
        description: 'Pembagian jobdesc panitia dan timeline pengajuan proposal.',
      },
      {
        id: 'bem-2',
        date: makeDateStr(4),
        startTime: '18:30',
        endTime: '20:30',
        label: 'Rapat Finalisasi',
        description: 'Konfirmasi rundown acara, logistik venue, dan anggaran akhir.',
      },
    ],
    votes: {
      'bem-1': [
        { memberId: 'fabian-1', memberName: 'Fabian Alvaro Muhammad', dateId: 'bem-1', status: 'available', updatedAt: 1 },
        { memberId: 'stevanus-3', memberName: 'Stevanus Herdi Pamungkas', dateId: 'bem-1', status: 'available', updatedAt: 1 },
      ],
    },
    criteria: {
      minTurnoutPercentage: 50,
      mustAttendMemberIds: ['fabian-1'],
    },
    status: 'VOTING',
  };

  return [room1, room2];
}

class StorageService {
  private rooms: Map<string, Room> = new Map();
  private listeners: Set<() => void> = new Set();
  private activeUser: Member | null = null;
  private isLoaded = false;
  private syncError: string | null = null;
  private hasAttemptedSeed = false;

  constructor() {
    this.initRealtimeSync();
  }

  private initRealtimeSync() {
    const colRef = collection(db, COMMUNITIES_COLLECTION);

    onSnapshot(
      colRef,
      (snapshot) => {
        this.syncError = null;
        this.isLoaded = true;

        if (snapshot.empty && !this.hasAttemptedSeed) {
          this.hasAttemptedSeed = true;
          const seeds = createSeedRooms();
          seeds.forEach((s) => {
            this.rooms.set(s.token.toUpperCase(), s);
            this.persistRoom(s);
          });
          this.notifyListeners();
          return;
        }

        this.rooms.clear();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Room;
          if (data && data.token) {
            this.rooms.set(data.token.toUpperCase(), data);
          }
        });

        this.notifyListeners();
      },
      (error) => {
        console.error('Firestore realtime sync error:', error);
        this.isLoaded = true;
        this.syncError = error.message || 'Gagal terhubung ke Cloud Firestore.';
        this.notifyListeners();
      }
    );
  }

  private async persistRoom(room: Room) {
    try {
      const docRef = doc(db, COMMUNITIES_COLLECTION, room.token.toUpperCase());
      await setDoc(docRef, sanitizeForFirestore(room));
    } catch (e) {
      console.error('Failed to persist community to Firestore:', e);
      this.syncError = e instanceof Error ? e.message : 'Gagal menyimpan perubahan ke server.';
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public getSyncState(): { isLoaded: boolean; syncError: string | null } {
    return { isLoaded: this.isLoaded, syncError: this.syncError };
  }

  public getRoomByToken(token: string): Room | null {
    if (!token) return null;
    return this.rooms.get(token.trim().toUpperCase()) || null;
  }

  public getAllRooms(): Room[] {
    return Array.from(this.rooms.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public createRoom(params: {
    name: string;
    description: string;
    adminName: string;
    candidateDates: {
      date: string;
      timeSlot?: CandidateDate['timeSlot'];
      startTime?: string;
      endTime?: string;
      label?: string;
      description?: string;
    }[];
    criteria: EventCriteria;
  }): Room {
    const adminId = 'admin-' + Math.random().toString(36).substring(2, 9);
    const token = generateRoomToken('JAN');
    const adminMember: Member = {
      id: adminId,
      name: params.adminName,
      role: 'admin',
      isMustAttend: params.criteria.mustAttendMemberIds.includes(adminId),
      avatarColor: 'bg-blue-600',
      joinedAt: Date.now(),
    };

    const candidateDates: CandidateDate[] = params.candidateDates.map((cd, idx) => ({
      id: `cd-${Date.now()}-${idx}`,
      date: cd.date,
      timeSlot: cd.timeSlot || 'all-day',
      startTime: cd.startTime,
      endTime: cd.endTime,
      label: cd.label,
      description: cd.description,
    }));

    const newRoom: Room = {
      id: 'room-' + Date.now(),
      token,
      name: params.name,
      description: params.description,
      adminId,
      adminName: params.adminName,
      createdAt: Date.now(),
      members: [adminMember],
      candidateDates,
      votes: {},
      criteria: params.criteria,
      status: 'VOTING',
    };

    this.rooms.set(token.toUpperCase(), newRoom);
    this.setActiveUser(adminMember);
    this.notifyListeners();
    void this.persistRoom(newRoom);
    return newRoom;
  }

  public joinRoom(token: string, memberName: string): { room: Room; member: Member } | null {
    const room = this.getRoomByToken(token);
    if (!room) return null;

    let member = room.members.find((m) => m.name.toLowerCase() === memberName.trim().toLowerCase());
    if (!member) {
      const colors = ['bg-indigo-600', 'bg-rose-600', 'bg-teal-600', 'bg-amber-600', 'bg-cyan-600', 'bg-violet-600'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      member = {
        id: 'member-' + Math.random().toString(36).substring(2, 9),
        name: memberName.trim(),
        role: 'member',
        avatarColor: randomColor,
        joinedAt: Date.now(),
      };
      room.members = [...room.members, member];
      this.notifyListeners();
      void this.persistRoom(room);
    }

    this.setActiveUser(member);
    return { room, member };
  }

  public submitVote(token: string, memberId: string, memberName: string, dateId: string, status: Vote['status']) {
    const room = this.getRoomByToken(token);
    if (!room) return;

    const currentVotes = [...(room.votes[dateId] || [])];
    const existingIdx = currentVotes.findIndex((v) => v.memberId === memberId);

    if (existingIdx >= 0) {
      currentVotes[existingIdx] = {
        ...currentVotes[existingIdx],
        status,
        updatedAt: Date.now(),
      };
    } else {
      currentVotes.push({
        memberId,
        memberName,
        dateId,
        status,
        updatedAt: Date.now(),
      });
    }

    room.votes = { ...room.votes, [dateId]: currentVotes };
    this.notifyListeners();
    void this.persistRoom(room);
  }

  public addAgenda(
    token: string,
    agenda: {
      date: string;
      startTime?: string;
      endTime?: string;
      timeSlot?: CandidateDate['timeSlot'];
      label: string;
      description?: string;
    }
  ): CandidateDate | null {
    const room = this.getRoomByToken(token);
    if (!room) return null;

    const newAgenda: CandidateDate = {
      id: `cd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: agenda.date,
      startTime: agenda.startTime || undefined,
      endTime: agenda.endTime || undefined,
      timeSlot: agenda.timeSlot || 'all-day',
      label: agenda.label.trim() || 'Agenda Baru',
      description: agenda.description?.trim() || '',
    };

    room.candidateDates = [...room.candidateDates, newAgenda];
    this.notifyListeners();
    void this.persistRoom(room);
    return newAgenda;
  }

  public updateAgenda(
    token: string,
    agendaId: string,
    updates: Partial<Omit<CandidateDate, 'id'>>
  ): void {
    const room = this.getRoomByToken(token);
    if (!room) return;

    room.candidateDates = room.candidateDates.map((cd) =>
      cd.id === agendaId ? { ...cd, ...updates } : cd
    );
    this.notifyListeners();
    void this.persistRoom(room);
  }

  public deleteAgenda(token: string, agendaId: string): void {
    const room = this.getRoomByToken(token);
    if (!room) return;

    room.candidateDates = room.candidateDates.filter((cd) => cd.id !== agendaId);
    const updatedVotes = { ...room.votes };
    delete updatedVotes[agendaId];
    room.votes = updatedVotes;

    if (room.finalizedDateId === agendaId) {
      room.status = 'VOTING';
      delete room.finalizedDateId;
      delete room.finalizedNotes;
      delete room.finalizedAt;
    }

    this.notifyListeners();
    void this.persistRoom(room);
  }

  public updateRoomCriteria(token: string, criteria: Partial<EventCriteria>) {
    const room = this.getRoomByToken(token);
    if (!room) return;

    room.criteria = { ...room.criteria, ...criteria };
    this.notifyListeners();
    void this.persistRoom(room);
  }

  public toggleMustAttend(token: string, memberId: string) {
    const room = this.getRoomByToken(token);
    if (!room) return;

    const currentList = new Set(room.criteria.mustAttendMemberIds || []);
    room.members = room.members.map((m) => {
      if (m.id !== memberId) return m;
      const next = !m.isMustAttend;
      if (next) currentList.add(memberId);
      else currentList.delete(memberId);
      return { ...m, isMustAttend: next };
    });

    room.criteria = {
      ...room.criteria,
      mustAttendMemberIds: Array.from(currentList),
    };

    this.notifyListeners();
    void this.persistRoom(room);
  }

  public finalizeSchedule(token: string, dateId: string, notes?: string) {
    const room = this.getRoomByToken(token);
    if (!room) return;

    room.status = 'FINALIZED';
    room.finalizedDateId = dateId;
    room.finalizedNotes = notes || '';
    room.finalizedAt = Date.now();
    this.notifyListeners();
    void this.persistRoom(room);
  }

  public reopenSchedule(token: string) {
    const room = this.getRoomByToken(token);
    if (!room) return;

    room.status = 'VOTING';
    delete room.finalizedDateId;
    delete room.finalizedNotes;
    delete room.finalizedAt;
    this.notifyListeners();
    void this.persistRoom(room);
  }

  public async resetDemoData() {
    try {
      const seeds = createSeedRooms();
      for (const seed of seeds) {
        const existing = this.rooms.get(seed.token.toUpperCase());
        const resetDoc: Room = existing
          ? {
              ...seed,
              id: existing.id,
              token: existing.token,
              adminId: existing.adminId,
              adminName: existing.adminName,
              createdAt: existing.createdAt,
            }
          : seed;
        this.rooms.set(resetDoc.token.toUpperCase(), resetDoc);
        await this.persistRoom(resetDoc);
      }
      this.setActiveUser(seeds[0].members[0]);
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to reset Firestore demo data:', e);
    }
  }

  // Active user kept in memory (no localStorage for agenda/session data)
  public getActiveUser(): Member | null {
    if (this.activeUser) return this.activeUser;
    const seed = this.getRoomByToken('STACK-ITB') || this.getAllRooms()[0];
    return seed?.members[0] || null;
  }

  public setActiveUser(member: Member) {
    this.activeUser = member;
    this.notifyListeners();
  }
}

export const storageService = new StorageService();
