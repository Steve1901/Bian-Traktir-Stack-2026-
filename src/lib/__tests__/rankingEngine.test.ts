import { describe, it, expect } from 'vitest';
import { rankCandidateDates, generateRoomToken, formatDateDisplay } from '../rankingEngine';
import type { Room, Member } from '../../types';

describe('rankingEngine', () => {
  const mockMembers: Member[] = [
    { id: 'm1', name: 'Fabian (Leader)', role: 'admin', isMustAttend: true, joinedAt: Date.now() },
    { id: 'm2', name: 'Gwein (Core)', role: 'member', isMustAttend: true, joinedAt: Date.now() },
    { id: 'm3', name: 'Stevanus', role: 'member', joinedAt: Date.now() },
    { id: 'm4', name: 'Keisha', role: 'member', joinedAt: Date.now() },
  ];

  it('generates properly formatted room tokens', () => {
    const token = generateRoomToken('STACK');
    expect(token).toMatch(/^STACK-[2-9A-Z]{4}$/);
    const defaultToken = generateRoomToken();
    expect(defaultToken).toMatch(/^JAN-[2-9A-Z]{4}$/);
  });

  it('formats dates nicely into readable Indonesian display strings', () => {
    const display = formatDateDisplay('2026-11-28', 'morning');
    expect(display).toContain('2026');
    expect(display).toContain('Pagi');
  });

  it('ranks dates with higher raw percentage when no must-attend criteria are set', () => {
    const room: Room = {
      id: 'r1',
      token: 'JAN-1234',
      name: 'Meeting Test',
      description: 'Test Room',
      adminId: 'm1',
      adminName: 'Fabian',
      createdAt: Date.now(),
      members: mockMembers,
      candidateDates: [
        { id: 'd1', date: '2026-11-28' },
        { id: 'd2', date: '2026-11-29' },
      ],
      votes: {
        d1: [{ memberId: 'm1', memberName: 'Fabian', dateId: 'd1', status: 'available', updatedAt: 1 }],
        d2: [
          { memberId: 'm1', memberName: 'Fabian', dateId: 'd2', status: 'available', updatedAt: 1 },
          { memberId: 'm2', memberName: 'Gwein', dateId: 'd2', status: 'available', updatedAt: 1 },
          { memberId: 'm3', memberName: 'Stevanus', dateId: 'd2', status: 'available', updatedAt: 1 },
        ],
      },
      criteria: {
        minTurnoutPercentage: 50,
        mustAttendMemberIds: [],
      },
      status: 'VOTING',
    };

    const ranked = rankCandidateDates(room);
    expect(ranked[0].dateId).toBe('d2');
    expect(ranked[0].availabilityPercentage).toBe(75);
    expect(ranked[0].meetsMinTurnout).toBe(true);
    expect(ranked[0].isRecommended).toBe(true);
    expect(ranked[1].dateId).toBe('d1');
    expect(ranked[1].availabilityPercentage).toBe(25);
    expect(ranked[1].meetsMinTurnout).toBe(false);
  });

  it('prioritizes must-attend satisfaction over higher total attendee count', () => {
    const room: Room = {
      id: 'r2',
      token: 'JAN-5678',
      name: 'Community Sync',
      description: 'VIP test',
      adminId: 'm1',
      adminName: 'Fabian',
      createdAt: Date.now(),
      members: mockMembers,
      candidateDates: [
        { id: 'd1', date: '2026-12-01' },
        { id: 'd2', date: '2026-12-02' },
      ],
      votes: {
        d1: [
          { memberId: 'm2', memberName: 'Gwein', dateId: 'd1', status: 'available', updatedAt: 1 },
          { memberId: 'm3', memberName: 'Stevanus', dateId: 'd1', status: 'available', updatedAt: 1 },
          { memberId: 'm4', memberName: 'Keisha', dateId: 'd1', status: 'available', updatedAt: 1 },
          { memberId: 'm1', memberName: 'Fabian', dateId: 'd1', status: 'unavailable', updatedAt: 1 },
        ],
        d2: [
          { memberId: 'm1', memberName: 'Fabian', dateId: 'd2', status: 'available', updatedAt: 1 },
          { memberId: 'm2', memberName: 'Gwein', dateId: 'd2', status: 'available', updatedAt: 1 },
        ],
      },
      criteria: {
        minTurnoutPercentage: 50,
        mustAttendMemberIds: ['m1', 'm2'],
      },
      status: 'VOTING',
    };

    const ranked = rankCandidateDates(room);
    expect(ranked[0].dateId).toBe('d2');
    expect(ranked[0].mustAttendSatisfied).toBe(true);
    expect(ranked[1].dateId).toBe('d1');
    expect(ranked[1].mustAttendSatisfied).toBe(false);
    expect(ranked[1].missingMustAttendMembers[0].id).toBe('m1');
  });

  it('optimizes for target turnout percentage when specified by host', () => {
    const room: Room = {
      id: 'r3',
      token: 'JAN-TARGET',
      name: 'Intimate Workshop',
      description: 'Capacity limited to 30%',
      adminId: 'm1',
      adminName: 'Fabian',
      createdAt: Date.now(),
      members: mockMembers,
      candidateDates: [
        { id: 'd1', date: '2026-12-10' },
        { id: 'd2', date: '2026-12-11' },
      ],
      votes: {
        d1: [
          { memberId: 'm1', memberName: 'Fabian', dateId: 'd1', status: 'available', updatedAt: 1 },
          { memberId: 'm2', memberName: 'Gwein', dateId: 'd1', status: 'available', updatedAt: 1 },
          { memberId: 'm3', memberName: 'Stevanus', dateId: 'd1', status: 'available', updatedAt: 1 },
        ],
        d2: [
          { memberId: 'm1', memberName: 'Fabian', dateId: 'd2', status: 'available', updatedAt: 1 },
        ],
      },
      criteria: {
        minTurnoutPercentage: 20,
        targetTurnoutPercentage: 30,
        mustAttendMemberIds: ['m1'],
      },
      status: 'VOTING',
    };

    const ranked = rankCandidateDates(room);
    expect(ranked[0].dateId).toBe('d2');
    expect(ranked[0].targetVariance).toBe(5);
  });

  it('handles empty votes gracefully', () => {
    const room: Room = {
      id: 'r4',
      token: 'JAN-EMPTY',
      name: 'Empty Room',
      description: 'No votes yet',
      adminId: 'm1',
      adminName: 'Fabian',
      createdAt: Date.now(),
      members: mockMembers,
      candidateDates: [{ id: 'd1', date: '2026-12-15' }],
      votes: {},
      criteria: {
        minTurnoutPercentage: 50,
        mustAttendMemberIds: ['m1'],
      },
      status: 'VOTING',
    };

    const ranked = rankCandidateDates(room);
    expect(ranked.length).toBe(1);
    expect(ranked[0].availableCount).toBe(0);
    expect(ranked[0].availabilityPercentage).toBe(0);
    expect(ranked[0].mustAttendSatisfied).toBe(false);
    expect(ranked[0].isRecommended).toBe(false);
  });
});
