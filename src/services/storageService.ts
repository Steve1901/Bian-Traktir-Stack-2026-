import type { Room, Member, Vote, CandidateDate, EventCriteria } from '../types';
import { generateRoomToken } from '../lib/rankingEngine';

const STORAGE_KEY_ROOMS = 'janjian_rooms_v2';
const STORAGE_KEY_ACTIVE_USER = 'janjian_active_user_v1';

// Seed sample room based on GDG ITB STACK 2026 Project
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

  // Dates: Tomorrow and consecutive days
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

  // Initial votes pre-filled for demonstration
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

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ROOMS);
      if (data) {
        const parsed: Room[] = JSON.parse(data);
        this.rooms.clear();
        parsed.forEach((r) => this.rooms.set(r.token.toUpperCase(), r));
      } else {
        // First run: seed with sample rooms
        const seeds = createSeedRooms();
        seeds.forEach((s) => this.rooms.set(s.token.toUpperCase(), s));
        this.saveToStorage();
      }
    } catch {
      const seeds = createSeedRooms();
      seeds.forEach((s) => this.rooms.set(s.token.toUpperCase(), s));
    }
  }

  private saveToStorage() {
    try {
      const array = Array.from(this.rooms.values());
      localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(array));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
    window.dispatchEvent(new CustomEvent('janjian-store-update'));
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public getRoomByToken(token: string): Room | null {
    if (!token) return null;
    return this.rooms.get(token.trim().toUpperCase()) || null;
  }

  public getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
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
    this.saveToStorage();
    this.setActiveUser(adminMember);
    return newRoom;
  }

  public joinRoom(token: string, memberName: string): { room: Room; member: Member } | null {
    const room = this.getRoomByToken(token);
    if (!room) return null;

    // Check if member with same name already exists
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
      room.members.push(member);
      this.saveToStorage();
    }

    this.setActiveUser(member);
    return { room, member };
  }

  public submitVote(token: string, memberId: string, memberName: string, dateId: string, status: Vote['status']) {
    const room = this.getRoomByToken(token);
    if (!room) return;

    if (!room.votes[dateId]) {
      room.votes[dateId] = [];
    }

    const existingIdx = room.votes[dateId].findIndex((v) => v.memberId === memberId);
    if (existingIdx >= 0) {
      room.votes[dateId][existingIdx].status = status;
      room.votes[dateId][existingIdx].updatedAt = Date.now();
    } else {
      room.votes[dateId].push({
        memberId,
        memberName,
        dateId,
        status,
        updatedAt: Date.now(),
      });
    }

    this.saveToStorage();
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

    room.candidateDates.push(newAgenda);
    this.saveToStorage();
    return newAgenda;
  }

  public updateAgenda(
    token: string,
    agendaId: string,
    updates: Partial<Omit<CandidateDate, 'id'>>
  ): void {
    const room = this.getRoomByToken(token);
    if (!room) return;

    const idx = room.candidateDates.findIndex((cd) => cd.id === agendaId);
    if (idx === -1) return;

    room.candidateDates[idx] = {
      ...room.candidateDates[idx],
      ...updates,
    };
    this.saveToStorage();
  }

  public deleteAgenda(token: string, agendaId: string): void {
    const room = this.getRoomByToken(token);
    if (!room) return;

    room.candidateDates = room.candidateDates.filter((cd) => cd.id !== agendaId);
    delete room.votes[agendaId];
    if (room.finalizedDateId === agendaId) {
      room.status = 'VOTING';
      room.finalizedDateId = undefined;
      room.finalizedNotes = undefined;
    }
    this.saveToStorage();
  }

  public updateRoomCriteria(token: string, criteria: Partial<EventCriteria>) {
    const room = this.getRoomByToken(token);
    if (!room) return;
    room.criteria = { ...room.criteria, ...criteria };
    this.saveToStorage();
  }

  public toggleMustAttend(token: string, memberId: string) {
    const room = this.getRoomByToken(token);
    if (!room) return;

    const member = room.members.find((m) => m.id === memberId);
    if (!member) return;

    member.isMustAttend = !member.isMustAttend;
    const currentList = new Set(room.criteria.mustAttendMemberIds || []);
    if (member.isMustAttend) {
      currentList.add(memberId);
    } else {
      currentList.delete(memberId);
    }
    room.criteria.mustAttendMemberIds = Array.from(currentList);
    this.saveToStorage();
  }

  public finalizeSchedule(token: string, dateId: string, notes?: string) {
    const room = this.getRoomByToken(token);
    if (!room) return;

    room.status = 'FINALIZED';
    room.finalizedDateId = dateId;
    room.finalizedNotes = notes || '';
    room.finalizedAt = Date.now();
    this.saveToStorage();
  }

  public reopenSchedule(token: string) {
    const room = this.getRoomByToken(token);
    if (!room) return;

    room.status = 'VOTING';
    room.finalizedDateId = undefined;
    room.finalizedNotes = undefined;
    this.saveToStorage();
  }

  public resetDemoData() {
    this.rooms.clear();
    const seeds = createSeedRooms();
    seeds.forEach((s) => this.rooms.set(s.token.toUpperCase(), s));
    this.saveToStorage();
    this.setActiveUser(seeds[0].members[0]);
  }

  // Active User session helpers
  public getActiveUser(): Member | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
      if (data) return JSON.parse(data);
    } catch {}
    // Default to Fabian if none selected
    const seed = this.getRoomByToken('STACK-ITB');
    return seed?.members[0] || null;
  }

  public setActiveUser(member: Member) {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(member));
      this.notifyListeners();
    } catch {}
  }
}

export const storageService = new StorageService();
