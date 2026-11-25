import type { Room, CandidateDate } from '../types';

/**
 * Generates an .ics (iCalendar) file string and triggers a browser download
 */
export function downloadIcsFile(room: Room, chosenDate: CandidateDate) {
  const [year, month, day] = chosenDate.date.split('-').map(Number);
  
  // Format to iCalendar date string YYYYMMDD
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const dtStart = `${year}${pad(month)}${pad(day)}`;
  
  // Next day for full-day event end
  const nextDate = new Date(year, month - 1, day + 1);
  const dtEnd = `${nextDate.getFullYear()}${pad(nextDate.getMonth() + 1)}${pad(nextDate.getDate())}`;

  const summary = `[Janjian] ${room.name}`;
  const description = `${room.description || 'Pertemuan telah difinalisasi melalui Janjian.'}\n\nCatatan Admin: ${room.finalizedNotes || 'Tidak ada catatan khusus.'}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Janjian//Collaborative Scheduling//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:janjian-${room.id}-${chosenDate.id}@janjian.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `janjian-${room.token}-${chosenDate.date}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a direct Google Calendar web link
 */
export function getGoogleCalendarUrl(room: Room, chosenDate: CandidateDate): string {
  const [year, month, day] = chosenDate.date.split('-').map(Number);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const dtStart = `${year}${pad(month)}${pad(day)}`;
  const nextDate = new Date(year, month - 1, day + 1);
  const dtEnd = `${nextDate.getFullYear()}${pad(nextDate.getMonth() + 1)}${pad(nextDate.getDate())}`;

  const text = encodeURIComponent(`[Janjian] ${room.name}`);
  const details = encodeURIComponent(`${room.description || ''}\n\nCatatan: ${room.finalizedNotes || ''}`);
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dtStart}/${dtEnd}&details=${details}`;
}
