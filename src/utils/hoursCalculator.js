/**
 * Utility functions for work hour calculations and formatting.
 * Handles exact duration and starting hour ("alkava tunti") calculations.
 */

export const FINNISH_MONTHS = [
  'Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu',
  'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'
];

export const FINNISH_WEEKDAYS = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'];

/**
 * Calculates work shift durations.
 * @param {string} startTime - HH:mm
 * @param {string} endTime - HH:mm
 * @param {number} breakMinutes - Unpaid break in minutes
 * @returns {object} { durationMinutes, realHours, billedHours (alkava tunti) }
 */
export function calculateShiftHours(startTime, endTime, breakMinutes = 0) {
  if (!startTime || !endTime) {
    return { durationMinutes: 0, realHours: 0, billedHours: 0 };
  }

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let startTotalM = startH * 60 + startM;
  let endTotalM = endH * 60 + endM;

  // Handle overnight shift (e.g., 22:00 - 06:00)
  if (endTotalM < startTotalM) {
    endTotalM += 24 * 60;
  }

  const grossMinutes = endTotalM - startTotalM;
  const durationMinutes = Math.max(0, grossMinutes - (Number(breakMinutes) || 0));

  const realHours = Math.round((durationMinutes / 60) * 100) / 100;
  
  // "Alkava puolitunti" rule: round up to next 30 min block (0.5 h)
  const billedHours = durationMinutes > 0 ? Math.ceil(durationMinutes / 30) * 0.5 : 0;

  return {
    durationMinutes,
    realHours,
    billedHours
  };
}

/**
 * Formats duration in minutes to human readable string, e.g., 1t 45min
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 min';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} t`;
  return `${hrs} t ${mins} min`;
}

/**
 * Formats a currency value to EUR string e.g. 1 250,50 €
 */
export function formatCurrency(amount) {
  const numeric = Number(amount) || 0;
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numeric);
}

/**
 * Formats YYYY-MM date string to Finnish month and year, e.g., "Syyskuu 2026"
 */
export function formatMonthYear(monthKey) {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const monthIdx = parseInt(month, 10) - 1;
  return `${FINNISH_MONTHS[monthIdx] || ''} ${year}`;
}

/**
 * Returns Finnish weekday and date string e.g. "Ti 15.09.2026"
 */
export function formatDateWithDay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const dayName = FINNISH_WEEKDAYS[d.getDay()];
  const dayNum = String(d.getDate()).padStart(2, '0');
  const monthNum = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${dayName} ${dayNum}.${monthNum}.${year}`;
}

/**
 * Formats date to YYYY-MM-DD
 */
export function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats date to YYYY-MM
 */
export function getCurrentMonthKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
