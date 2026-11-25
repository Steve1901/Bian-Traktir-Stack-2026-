export type MemberRole = 'admin' | 'member';

export type VoteStatus = 'available' | 'tentative' | 'unavailable';

export type TimeSlotType = 'all-day' | 'morning' | 'afternoon' | 'evening';

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  isMustAttend?: boolean;
  avatarColor?: string;
  joinedAt: number;
}

export interface CandidateDate {
  id: string; // unique key, e.g. '2026-12-05' or 'cd-123'
  date: string; // ISO date 'YYYY-MM-DD'
  timeSlot?: TimeSlotType;
  startTime?: string; // e.g. '14:00'
  endTime?: string; // e.g. '16:00'
  label?: string; // Agenda title
  description?: string; // Event / Agenda description
}

export interface Vote {
  memberId: string;
  memberName: string;
  dateId: string;
  status: VoteStatus;
  updatedAt: number;
}

export interface EventCriteria {
  minTurnoutPercentage: number; // e.g. 50%
  targetTurnoutPercentage?: number; // optional specific capacity target, e.g. 35%
  mustAttendMemberIds: string[]; // IDs of members whose presence is essential
}

export interface Room {
  id: string;
  token: string; // e.g. 'STACK-ITB' or 'JAN-382'
  name: string;
  description: string;
  adminId: string;
  adminName: string;
  createdAt: number;
  members: Member[];
  candidateDates: CandidateDate[];
  votes: Record<string, Vote[]>; // dateId -> array of votes
  criteria: EventCriteria;
  status: 'VOTING' | 'FINALIZED' | 'CLOSED';
  finalizedDateId?: string;
  finalizedNotes?: string;
  finalizedAt?: number;
}

export interface DateRankingResult {
  dateId: string;
  date: string;
  timeSlot?: TimeSlotType;
  label?: string;
  totalMembers: number;
  availableCount: number;
  tentativeCount: number;
  unavailableCount: number;
  availabilityPercentage: number; // 0 to 100
  meetsMinTurnout: boolean;
  mustAttendTotal: number;
  mustAttendAvailableCount: number;
  mustAttendSatisfied: boolean;
  missingMustAttendMembers: Member[];
  targetVariance: number;
  compositeScore: number;
  rank: number;
  isRecommended: boolean;
  reasons: string[];
}
