import type { Room, DateRankingResult, Member } from '../types';

/**
 * Calculates deterministic ranking for all candidate dates in a Room based on:
 * 1. Raw availability percentage (or proximity to preferred target turnout)
 * 2. Must-attend (VIP) attendee satisfaction
 * 3. Configurable target turnout percentage (e.g., venue matching)
 * 4. Minimum turnout threshold
 */
export function rankCandidateDates(room: Room): DateRankingResult[] {
  const totalMembers = room.members.length;
  const memberMap = new Map<string, Member>(room.members.map((m) => [m.id, m]));
  const mustAttendIds = new Set(room.criteria.mustAttendMemberIds || []);

  const results: DateRankingResult[] = room.candidateDates.map((candidate) => {
    const votes = room.votes[candidate.id] || [];
    const voteMap = new Map(votes.map((v) => [v.memberId, v.status]));

    let availableCount = 0;
    let tentativeCount = 0;
    let unavailableCount = 0;

    votes.forEach((v) => {
      if (v.status === 'available') availableCount++;
      else if (v.status === 'tentative') tentativeCount++;
      else if (v.status === 'unavailable') unavailableCount++;
    });

    // Calculate percentage based on total room members (avoid division by 0)
    const effectiveTotal = Math.max(totalMembers, 1);
    const availabilityPercentage = Math.round((availableCount / effectiveTotal) * 100);
    const meetsMinTurnout = availabilityPercentage >= (room.criteria.minTurnoutPercentage || 50);

    // Evaluate Must-Attend Members
    const mustAttendTotal = mustAttendIds.size;
    let mustAttendAvailableCount = 0;
    const missingMustAttendMembers: Member[] = [];

    mustAttendIds.forEach((mId) => {
      const status = voteMap.get(mId);
      if (status === 'available') {
        mustAttendAvailableCount++;
      } else {
        const member = memberMap.get(mId);
        if (member) missingMustAttendMembers.push(member);
      }
    });

    const mustAttendSatisfied = mustAttendTotal === 0 || mustAttendAvailableCount === mustAttendTotal;

    // Evaluate Target Turnout Proximity (if host set a specific preferred turnout percentage)
    const hasTarget = typeof room.criteria.targetTurnoutPercentage === 'number' && room.criteria.targetTurnoutPercentage > 0;
    const targetPercentage = hasTarget ? room.criteria.targetTurnoutPercentage! : 100;
    const targetVariance = Math.abs(availabilityPercentage - targetPercentage);

    // Composite Deterministic Score
    let score = 0;

    // 1. VIP satisfaction weight (1000 for all, fractional if partial)
    if (mustAttendTotal > 0) {
      if (mustAttendSatisfied) {
        score += 1000;
      } else {
        score += (mustAttendAvailableCount / mustAttendTotal) * 300;
      }
    } else {
      score += 500; // Baseline when no VIP filter is specified
    }

    // 2. Availability score vs Target Turnout score
    if (hasTarget) {
      // Score based on proximity to target capacity: closer to target gets higher score
      const proximityScore = Math.max(0, 100 - targetVariance * 2.5) * 10;
      score += proximityScore;
    } else {
      // Default: higher availability is better
      score += availabilityPercentage * 10;
    }

    // Tentative votes provide a slight positive signal
    score += tentativeCount * 2;

    // 3. Threshold bonus
    if (meetsMinTurnout) {
      score += 50;
    }

    // Generate readable explanations
    const reasons: string[] = [];
    if (mustAttendTotal > 0) {
      if (mustAttendSatisfied) {
        reasons.push(`Semua ${mustAttendTotal} anggota wajib (must-attend) dapat hadir.`);
      } else {
        const names = missingMustAttendMembers.map((m) => m.name).join(', ');
        reasons.push(`Anggota wajib belum dapat hadir: ${names}`);
      }
    }

    if (meetsMinTurnout) {
      reasons.push(`Memenuhi batas minimal kehadiran (${availabilityPercentage}% ≥ ${room.criteria.minTurnoutPercentage}%).`);
    } else {
      reasons.push(`Di bawah batas minimal kehadiran (${availabilityPercentage}% < ${room.criteria.minTurnoutPercentage}%).`);
    }

    if (hasTarget) {
      reasons.push(`Selisih ${targetVariance}% dari target kehadiran ${targetPercentage}%.`);
    }

    return {
      dateId: candidate.id,
      date: candidate.date,
      timeSlot: candidate.timeSlot,
      label: candidate.label,
      totalMembers,
      availableCount,
      tentativeCount,
      unavailableCount,
      availabilityPercentage,
      meetsMinTurnout,
      mustAttendTotal,
      mustAttendAvailableCount,
      mustAttendSatisfied,
      missingMustAttendMembers,
      targetVariance,
      compositeScore: Math.round(score),
      rank: 0, // Set after sorting
      isRecommended: false,
      reasons,
    };
  });

  // Sort descending by compositeScore, then availabilityPercentage (or target variance), then date
  results.sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore;
    }
    if (b.availabilityPercentage !== a.availabilityPercentage) {
      return b.availabilityPercentage - a.availabilityPercentage;
    }
    return a.date.localeCompare(b.date);
  });

  // Assign ranks and top recommendation
  results.forEach((res, index) => {
    res.rank = index + 1;
    res.isRecommended = index === 0 && res.mustAttendSatisfied && res.meetsMinTurnout;
  });

  return results;
}

/**
 * Helper to generate a human-friendly unique room entry token
 * e.g., 'JAN-824' or 'STACK-712'
 */
export function generateRoomToken(prefix = 'JAN'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

/**
 * Helper to format date strings to Indonesian/International display
 */
export function formatDateDisplay(dateStr: string, timeSlot?: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(dateObj);
    const dateFormatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(dateObj);

    let slotLabel = '';
    if (timeSlot === 'morning') slotLabel = ' (Pagi)';
    else if (timeSlot === 'afternoon') slotLabel = ' (Siang)';
    else if (timeSlot === 'evening') slotLabel = ' (Malam)';

    return `${dayName}, ${dateFormatted}${slotLabel}`;
  } catch {
    return dateStr;
  }
}
