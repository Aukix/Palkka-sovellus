/**
 * Vuosiraportin laskenta ja viennit (kirjanpito & laskutus).
 *
 * Tuntipalkka tulkitaan verottomaksi (ALV 0 %) hinnaksi. Arvonlisävero
 * lasketaan asetuksissa valitulla ALV-kannalla verottoman summan päälle.
 */

import { calculateShiftHours, FINNISH_MONTHS } from './hoursCalculator';

export const VAT_RATES = [25.5, 24, 14, 10, 0];
export const DEFAULT_VAT_RATE = 25.5;

export const SHORT_MONTHS = [
  'Tam', 'Hel', 'Maa', 'Huh', 'Tou', 'Kes',
  'Hei', 'Elo', 'Syy', 'Lok', 'Mar', 'Jou'
];

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Esim. 25.5 -> "25,5" */
export function formatPercent(rate) {
  return String(rate).replace('.', ',');
}

/** Tunnit suomalaisittain: 1234.5 -> "1 234,5" */
export function formatHours(hours) {
  return new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 2 }).format(Number(hours) || 0);
}

/** Desimaaliluku CSV:hen pilkulla, ilman tuhaterottimia: 1234.5 -> "1234,50" */
function csvNumber(n, decimals = 2) {
  return (Number(n) || 0).toFixed(decimals).replace('.', ',');
}

function csvText(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

/** Kirjanpitopohjan tuloluokka valitun ALV-kannan mukaan. */
export function bookkeepingCategory(vatRate) {
  return `300 Myynti - Suomi ${formatPercent(vatRate)}%`;
}

function lastDayOfMonth(year, monthIdx) {
  const d = new Date(year, monthIdx + 1, 0);
  return `${d.getDate()}.${monthIdx + 1}.${year}`;
}

/** Laskee veroton/ALV/verollinen-summat. */
export function vatBreakdown(net, vatRate) {
  const netR = round2(net);
  const vat = round2(netR * (Number(vatRate) || 0) / 100);
  return { net: netR, vat, gross: round2(netR + vat) };
}

function emptyBucket() {
  return {
    shifts: 0,
    realHours: 0,
    billedHours: 0,
    net: 0,
    invoicedHours: 0,
    invoicedNet: 0,
    uninvoicedHours: 0,
    uninvoicedNet: 0,
  };
}

function addToBucket(bucket, { realHours, billedHours, net, isBilled }) {
  bucket.shifts += 1;
  bucket.realHours += realHours;
  bucket.billedHours += billedHours;
  bucket.net += net;
  if (isBilled) {
    bucket.invoicedHours += billedHours;
    bucket.invoicedNet += net;
  } else {
    bucket.uninvoicedHours += billedHours;
    bucket.uninvoicedNet += net;
  }
}

/**
 * Kokoaa vuoden tunnit kuukausittain ja asiakkaittain.
 *
 * @param {Array} entries - tallennetut työvuorot
 * @param {number} year
 * @param {object} options
 *   company: 'ALL' tai yrityksen nimi
 *   billing: 'ALL' | 'BILLED' | 'UNBILLED'
 *   defaultWage: oletustuntipalkka (€/h, veroton)
 *   vatRate: ALV-prosentti
 */
export function buildYearReport(entries, year, {
  company = 'ALL',
  billing = 'ALL',
  defaultWage = 0,
  vatRate = DEFAULT_VAT_RATE,
} = {}) {
  const yearPrefix = `${year}-`;
  const months = FINNISH_MONTHS.map((name, idx) => ({
    idx,
    name,
    monthKey: `${year}-${String(idx + 1).padStart(2, '0')}`,
    ...emptyBucket(),
    companies: {},
  }));
  const totals = emptyBucket();
  const companyTotals = {};

  (entries || []).forEach((entry) => {
    if (!entry.date || !entry.date.startsWith(yearPrefix)) return;
    const entryCompany = entry.company || 'Yritys 1';
    if (company !== 'ALL' && entryCompany !== company) return;
    if (billing === 'BILLED' && !entry.isBilled) return;
    if (billing === 'UNBILLED' && entry.isBilled) return;

    const monthIdx = parseInt(entry.date.slice(5, 7), 10) - 1;
    const month = months[monthIdx];
    if (!month) return;

    const calc = calculateShiftHours(entry.startTime, entry.endTime, entry.breakMinutes);
    const rate = Number(entry.wageRate) || Number(defaultWage) || 0;
    const values = {
      realHours: calc.realHours,
      billedHours: calc.billedHours,
      net: calc.billedHours * rate,
      isBilled: !!entry.isBilled,
    };

    addToBucket(month, values);
    addToBucket(totals, values);

    if (!month.companies[entryCompany]) {
      month.companies[entryCompany] = { ...emptyBucket(), rates: {} };
    }
    const mc = month.companies[entryCompany];
    addToBucket(mc, values);
    mc.rates[rate] = (mc.rates[rate] || 0) + calc.billedHours;

    if (!companyTotals[entryCompany]) {
      companyTotals[entryCompany] = { ...emptyBucket(), monthHours: Array(12).fill(0) };
    }
    addToBucket(companyTotals[entryCompany], values);
    companyTotals[entryCompany].monthHours[monthIdx] += calc.billedHours;
  });

  // Laskutusrivit: yksi rivi per kuukausi / asiakas / tuntihinta
  const invoiceLines = [];
  // Kirjanpitorivit: yksi rivi per kuukausi / asiakas (vastaa yhtä laskua)
  const bookkeepingRows = [];

  months.forEach((month) => {
    month.vat = 0;
    Object.keys(month.companies).sort((a, b) => a.localeCompare(b, 'fi')).forEach((name) => {
      const mc = month.companies[name];
      const monthLabel = `${month.name.toLowerCase()} ${year}`;

      Object.keys(mc.rates)
        .map(Number)
        .sort((a, b) => b - a)
        .forEach((rate) => {
          const hours = mc.rates[rate];
          invoiceLines.push({
            monthIdx: month.idx,
            monthName: month.name,
            company: name,
            description: `Työtunnit ${monthLabel}`,
            hours,
            unitPrice: rate,
            vatRate,
            ...vatBreakdown(hours * rate, vatRate),
          });
        });

      const companySums = vatBreakdown(mc.net, vatRate);
      bookkeepingRows.push({
        monthIdx: month.idx,
        sheet: String(month.idx + 1).padStart(2, '0'),
        monthName: month.name,
        date: lastDayOfMonth(year, month.idx),
        description: `Lasku ${name}: työtunnit ${String(month.idx + 1).padStart(2, '0')}/${year} (${formatHours(mc.billedHours)} h)`,
        category: bookkeepingCategory(vatRate),
        hours: mc.billedHours,
        invoiceStatus: mc.uninvoicedHours === 0 ? 'BILLED' : (mc.invoicedHours > 0 ? 'PARTIAL' : 'UNBILLED'),
        ...companySums,
      });
      // Kuukauden ALV = laskukohtaisten ALV-summien summa (ei pyöristyseroja)
      month.vat += companySums.vat;
    });
    month.net = round2(month.net);
    month.vat = round2(month.vat);
    month.gross = round2(month.net + month.vat);
  });

  const totalNet = round2(months.reduce((sum, m) => sum + m.net, 0));
  const totalVat = round2(months.reduce((sum, m) => sum + m.vat, 0));

  return {
    year,
    vatRate,
    months,
    totals: { ...totals, net: totalNet, vat: totalVat, gross: round2(totalNet + totalVat) },
    companyTotals,
    invoiceLines,
    bookkeepingRows,
  };
}

function downloadCSV(lines, filename) {
  const csvContent = '﻿' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function fileSuffix(report, company) {
  const companySlug = company && company !== 'ALL' ? `_${company.replace(/\s+/g, '_')}` : '';
  return `${report.year}${companySlug}`;
}

/** Vuosiraportti: kuukausierittely + asiakaskohtaiset tunnit kuukausittain. */
export function exportYearReportCSV(report, company = 'ALL') {
  const vat = formatPercent(report.vatRate);
  const lines = [];

  lines.push(`Vuosiraportti ${report.year};${csvText(company === 'ALL' ? 'Kaikki yritykset' : company)}`);
  lines.push('');
  lines.push([
    'Kuukausi',
    'Työvuorot',
    'Todelliset tunnit (h)',
    'Laskutettavat tunnit, alkava 30 min (h)',
    'Laskutettu (h)',
    'Laskuttamatta (h)',
    'Veroton (€)',
    `ALV ${vat} % (€)`,
    'Verollinen (€)',
  ].join(';'));

  report.months.forEach((m) => {
    lines.push([
      m.name,
      m.shifts,
      csvNumber(m.realHours),
      csvNumber(m.billedHours, 1),
      csvNumber(m.invoicedHours, 1),
      csvNumber(m.uninvoicedHours, 1),
      csvNumber(m.net),
      csvNumber(m.vat),
      csvNumber(m.gross),
    ].join(';'));
  });

  const t = report.totals;
  lines.push([
    'YHTEENSÄ',
    t.shifts,
    csvNumber(t.realHours),
    csvNumber(t.billedHours, 1),
    csvNumber(t.invoicedHours, 1),
    csvNumber(t.uninvoicedHours, 1),
    csvNumber(t.net),
    csvNumber(t.vat),
    csvNumber(t.gross),
  ].join(';'));

  const companies = Object.keys(report.companyTotals).sort((a, b) => a.localeCompare(b, 'fi'));
  if (companies.length > 0) {
    lines.push('');
    lines.push('Laskutettavat tunnit asiakkaittain (h)');
    lines.push(['Yritys / Asiakas', ...FINNISH_MONTHS, 'Yhteensä (h)', 'Veroton (€)'].join(';'));
    companies.forEach((name) => {
      const c = report.companyTotals[name];
      lines.push([
        csvText(name),
        ...c.monthHours.map((h) => csvNumber(h, 1)),
        csvNumber(c.billedHours, 1),
        csvNumber(c.net),
      ].join(';'));
    });
  }

  downloadCSV(lines, `Vuosiraportti_${fileSuffix(report, company)}.csv`);
}

/**
 * Kirjanpito-CSV, jonka sarakkeet A–F vastaavat Kirjanpitopohjan
 * kuukausivälilehtiä (01–12): Päiväys, Selite, Tyyppi, Tyyppi teksti,
 * Kirjanpidon luokka, Verollinen summa (brutto).
 */
export function exportBookkeepingCSV(report, company = 'ALL') {
  const lines = [];
  lines.push([
    'Päiväys',
    'Tapahtuman selite / Tosite',
    'Tyyppi',
    'Tyyppi teksti',
    'Kirjanpidon luokka',
    'Verollinen summa (brutto)',
    'Välilehti (kk)',
    'Tunnit (h)',
    'Veroton (€)',
    `ALV ${formatPercent(report.vatRate)} % (€)`,
  ].join(';'));

  report.bookkeepingRows.forEach((row) => {
    lines.push([
      row.date,
      csvText(row.description),
      'Tulo',
      'Tulo',
      csvText(row.category),
      csvNumber(row.gross),
      csvText(`${row.sheet} ${row.monthName}`),
      csvNumber(row.hours, 1),
      csvNumber(row.net),
      csvNumber(row.vat),
    ].join(';'));
  });

  downloadCSV(lines, `Kirjanpito_${fileSuffix(report, company)}.csv`);
}
