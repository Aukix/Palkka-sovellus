/**
 * LocalStorage wrapper and data export utilities for Työtunnit application.
 */

import { calculateShiftHours, formatDateWithDay } from './hoursCalculator';

const ENTRIES_KEY = 'tyotunnit_entries_v2';
const SETTINGS_KEY = 'tyotunnit_settings_v2';
const COMPANIES_KEY = 'tyotunnit_companies_v2';

export const DEFAULT_SETTINGS = {
  hourlyWage: 40.00,
  useStartingHour: true, // alkava puolitunti
  defaultStartTime: '08:00',
  defaultEndTime: '16:00',
  vatRate: 25.5, // ALV % laskutukseen ja kirjanpitoon
};

export const DEFAULT_COMPANIES = ['Yritys 1'];

// Initial sample data if no entries exist yet (empty for clean install)
const SAMPLE_ENTRIES = [];

export function getStoredCompanies() {
  try {
    const raw = localStorage.getItem(COMPANIES_KEY);
    if (!raw) {
      saveStoredCompanies(DEFAULT_COMPANIES);
      return DEFAULT_COMPANIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_COMPANIES;
  } catch (err) {
    console.error('Failed to load companies from localStorage', err);
    return DEFAULT_COMPANIES;
  }
}

export function saveStoredCompanies(companies) {
  try {
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
  } catch (err) {
    console.error('Failed to save companies to localStorage', err);
  }
}

export function getStoredEntries() {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) {
      saveStoredEntries(SAMPLE_ENTRIES);
      return SAMPLE_ENTRIES;
    }
    const entries = JSON.parse(raw);
    // Ensure all entries have a company field
    return entries.map(item => ({
      ...item,
      company: item.company || 'Yritys 1'
    }));
  } catch (err) {
    console.error('Failed to load entries from localStorage', err);
    return [];
  }
}

export function saveStoredEntries(entries) {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to save entries to localStorage', err);
  }
}

export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

export function exportToCSV(entries, monthKey, selectedCompany = '') {
  if (!entries || entries.length === 0) return;

  let filtered = monthKey
    ? entries.filter(e => e.date.startsWith(monthKey))
    : entries;

  if (selectedCompany) {
    filtered = filtered.filter(e => e.company === selectedCompany);
  }

  // Sort by date ascending
  filtered.sort((a, b) => a.date.localeCompare(b.date));

  const headers = [
    'Päivämäärä',
    'Päivä',
    'Yritys / Asiakas',
    'Aloitus',
    'Lopetus',
    'Todelliset tunnit (h)',
    'Alkava puolitunti (h)',
    'Kuvaus',
    'Tuntipalkka (€)',
    'Yhteensä (€)',
    'Laskutus'
  ];

  const rows = filtered.map(item => {
    const calc = calculateShiftHours(item.startTime, item.endTime, 0);
    const wage = Number(item.wageRate) || 40;
    const totalWage = (calc.billedHours * wage).toFixed(2);
    const formattedDate = formatDateWithDay(item.date);

    return [
      item.date,
      `"${formattedDate}"`,
      `"${(item.company || 'Yritys 1').replace(/"/g, '""')}"`,
      item.startTime,
      item.endTime,
      calc.realHours.toFixed(2).replace('.', ','),
      calc.billedHours,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      wage.toFixed(2).replace('.', ','),
      totalWage.replace('.', ','),
      item.isBilled ? 'Laskutettu' : 'Laskuttamatta'
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const companySlug = selectedCompany ? `_${selectedCompany.replace(/\s+/g, '_')}` : '';
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Työtunnit_${monthKey || 'Kaikki'}${companySlug}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(entries) {
  const dataStr = JSON.stringify(entries, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tyotunnit_varmuuskopio_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
