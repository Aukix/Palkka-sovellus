import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Printer, Building2, ChevronLeft, ChevronRight, FileSpreadsheet, BookOpen, Receipt, Info
} from 'lucide-react';
import { formatCurrency } from '../utils/hoursCalculator';
import {
  buildYearReport,
  exportYearReportCSV,
  exportBookkeepingCSV,
  formatHours,
  formatPercent,
  SHORT_MONTHS,
  DEFAULT_VAT_RATE,
} from '../utils/yearReport';

const optionStyle = { background: '#0f172a', color: '#f8fafc' };

const th = { padding: '0.45rem 0.5rem', textAlign: 'right', whiteSpace: 'nowrap' };
const thLeft = { ...th, textAlign: 'left' };
const td = { padding: '0.4rem 0.5rem', textAlign: 'right', whiteSpace: 'nowrap' };
const tdLeft = { ...td, textAlign: 'left' };

const sectionTitle = {
  color: '#0f172a',
  fontSize: '1rem',
  fontWeight: '800',
  margin: '1.5rem 0 0.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
};

const INVOICE_STATUS = {
  BILLED: { label: 'Laskutettu', color: '#16a34a' },
  PARTIAL: { label: 'Osittain', color: '#d97706' },
  UNBILLED: { label: 'Laskuttamatta', color: '#d97706' },
};

const BILLING_LABELS = {
  ALL: 'Kaikki vuorot',
  BILLED: 'Vain laskutetut',
  UNBILLED: 'Vain laskuttamatta',
};

export default function YearReportModal({
  isOpen,
  onClose,
  entries = [],
  initialYear,
  settings,
  companies = [],
  initialCompany = 'ALL',
}) {
  const [year, setYear] = useState(initialYear);
  const [reportCompany, setReportCompany] = useState(initialCompany);
  const [billing, setBilling] = useState('ALL');

  useEffect(() => {
    if (isOpen) {
      setYear(initialYear);
      setReportCompany(initialCompany);
    }
  }, [initialYear, initialCompany, isOpen]);

  const vatRate = settings?.vatRate ?? DEFAULT_VAT_RATE;

  const report = useMemo(() => buildYearReport(entries, year, {
    company: reportCompany,
    billing,
    defaultWage: Number(settings?.hourlyWage) || 0,
    vatRate,
  }), [entries, year, reportCompany, billing, settings?.hourlyWage, vatRate]);

  if (!isOpen) return null;

  const { months, totals, companyTotals, invoiceLines, bookkeepingRows } = report;
  const companyNames = Object.keys(companyTotals).sort((a, b) => a.localeCompare(b, 'fi'));
  const vatLabel = `ALV ${formatPercent(vatRate)} %`;
  const hasData = totals.shifts > 0;

  const handleExport = (exportFn) => {
    if (!hasData) {
      const filters = [
        reportCompany !== 'ALL' ? `yritys: ${reportCompany}` : null,
        billing !== 'ALL' ? BILLING_LABELS[billing].toLowerCase() : null,
      ].filter(Boolean);
      alert(`Vuodelle ${year} ei ole kirjattuja työvuoroja${filters.length ? ` (${filters.join(', ')})` : ''}, joten vietävää ei ole.\n\nVaihda vuotta nuolista tai tarkista suodattimet.`);
      return;
    }
    exportFn(report, reportCompany);
  };

  return (
    <div className="modal-overlay report-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1100px', maxHeight: '94vh', overflowY: 'auto' }}
      >
        {/* Toimintopalkki (ei tulostu) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Vuosiraportti</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kuukausittaiset tunnit kirjanpitoon ja laskutukseen</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button onClick={() => setYear(year - 1)} className="btn btn-secondary btn-icon" title="Edellinen vuosi">
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontWeight: '800', fontSize: '1rem', minWidth: '3.2rem', textAlign: 'center' }}>{year}</span>
              <button onClick={() => setYear(year + 1)} className="btn btn-secondary btn-icon" title="Seuraava vuosi">
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building2 size={16} color="var(--accent-cyan)" />
              <select
                value={reportCompany}
                onChange={(e) => setReportCompany(e.target.value)}
                className="glass-input"
                style={{ padding: '0.4rem 0.65rem', fontSize: '0.825rem', fontWeight: '600', width: 'auto' }}
                aria-label="Yritys"
              >
                <option value="ALL" style={optionStyle}>Kaikki yritykset</option>
                {companies.map((c) => (
                  <option key={c} value={c} style={optionStyle}>🏢 {c}</option>
                ))}
              </select>
            </div>

            <select
              value={billing}
              onChange={(e) => setBilling(e.target.value)}
              className="glass-input"
              style={{ padding: '0.4rem 0.65rem', fontSize: '0.825rem', fontWeight: '600', width: 'auto' }}
              aria-label="Laskutustila"
            >
              {Object.entries(BILLING_LABELS).map(([value, label]) => (
                <option key={value} value={value} style={optionStyle}>{label}</option>
              ))}
            </select>

            <button onClick={onClose} className="btn btn-secondary btn-icon" title="Sulje">
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%', justifyContent: 'flex-end' }}>
            <button
              onClick={() => handleExport(exportYearReportCSV)}
              className="btn btn-secondary"
              style={{ fontSize: '0.825rem' }}
              title="Kuukausierittely ja asiakaskohtaiset tunnit Exceliin"
            >
              <FileSpreadsheet size={16} color="var(--accent-emerald)" /> Vuosiraportti CSV
            </button>
            <button
              onClick={() => handleExport(exportBookkeepingCSV)}
              className="btn btn-secondary"
              style={{ fontSize: '0.825rem' }}
              title="Myyntirivit Kirjanpitopohjan sarakkeisiin A–F"
            >
              <BookOpen size={16} color="var(--accent-cyan)" /> Kirjanpito CSV
            </button>
            <button onClick={() => window.print()} className="btn btn-primary" style={{ fontSize: '0.825rem' }}>
              <Printer size={16} /> Tulosta / PDF
            </button>
          </div>
        </div>

        {/* Tulostettava raportti */}
        <div className="printable-report" style={{ background: '#ffffff', color: '#1e293b', padding: '2rem', borderRadius: 'var(--radius-md)' }}>

          <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: '800' }}>VUOSIRAPORTTI {year}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.85rem' }}>
                  {reportCompany === 'ALL' ? 'Kaikki yritykset' : `Yritys: ${reportCompany}`}
                </span>
                {billing !== 'ALL' && (
                  <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.85rem' }}>
                    {BILLING_LABELS[billing]}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#475569' }}>
              <div>Laskentatapa: <strong>Alkava puolitunti (30 min)</strong></div>
              <div>Hinnat verottomia, {vatLabel}</div>
              <div>Päiväys: {new Date().toLocaleDateString('fi-FI')}</div>
            </div>
          </div>

          {/* Yhteenveto */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <SummaryItem label="Tunnit yhteensä" value={`${formatHours(totals.billedHours)} h`} color="#0284c7" sub={`Todelliset ${formatHours(totals.realHours)} h • ${totals.shifts} vuoroa`} />
            <SummaryItem label="Veroton myynti" value={formatCurrency(totals.net)} color="#334155" sub="ALV 0 %" />
            <SummaryItem label={vatLabel} value={formatCurrency(totals.vat)} color="#334155" sub="Arvonlisävero" />
            <SummaryItem label="Verollinen yhteensä" value={formatCurrency(totals.gross)} color="#16a34a" sub="Brutto" />
            <SummaryItem
              label="Laskuttamatta"
              value={`${formatHours(totals.uninvoicedHours)} h`}
              color={totals.uninvoicedHours > 0 ? '#d97706' : '#16a34a'}
              sub={`${formatCurrency(totals.uninvoicedNet)} (veroton)`}
            />
          </div>

          {/* Kuukausierittely */}
          <h3 style={sectionTitle}>Kuukausierittely</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={thLeft}>Kuukausi</th>
                <th style={th}>Vuoroja</th>
                <th style={th}>Todelliset h</th>
                <th style={th}>Tunnit (30 min)</th>
                <th style={th}>Laskutettu h</th>
                <th style={th}>Laskuttamatta h</th>
                <th style={th}>Veroton</th>
                <th style={th}>{vatLabel}</th>
                <th style={th}>Verollinen</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m, idx) => {
                const empty = m.shifts === 0;
                return (
                  <tr key={m.monthKey} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', color: empty ? '#94a3b8' : '#1e293b' }}>
                    <td style={{ ...tdLeft, fontWeight: '600' }}>{m.name}</td>
                    <td style={td}>{m.shifts}</td>
                    <td style={td}>{formatHours(m.realHours)}</td>
                    <td style={{ ...td, fontWeight: '700', color: empty ? '#94a3b8' : '#0284c7' }}>{formatHours(m.billedHours)}</td>
                    <td style={{ ...td, color: empty ? '#94a3b8' : '#16a34a' }}>{formatHours(m.invoicedHours)}</td>
                    <td style={{ ...td, color: m.uninvoicedHours > 0 ? '#d97706' : undefined, fontWeight: m.uninvoicedHours > 0 ? '700' : undefined }}>{formatHours(m.uninvoicedHours)}</td>
                    <td style={td}>{formatCurrency(m.net)}</td>
                    <td style={td}>{formatCurrency(m.vat)}</td>
                    <td style={{ ...td, fontWeight: '600' }}>{formatCurrency(m.gross)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#e2e8f0', fontWeight: '800', borderTop: '2px solid #94a3b8' }}>
                <td style={tdLeft}>YHTEENSÄ</td>
                <td style={td}>{totals.shifts}</td>
                <td style={td}>{formatHours(totals.realHours)}</td>
                <td style={{ ...td, color: '#0284c7' }}>{formatHours(totals.billedHours)}</td>
                <td style={td}>{formatHours(totals.invoicedHours)}</td>
                <td style={td}>{formatHours(totals.uninvoicedHours)}</td>
                <td style={td}>{formatCurrency(totals.net)}</td>
                <td style={td}>{formatCurrency(totals.vat)}</td>
                <td style={{ ...td, color: '#16a34a' }}>{formatCurrency(totals.gross)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Asiakaskohtaiset tunnit */}
          {companyNames.length > 0 && (
            <>
              <h3 style={sectionTitle}><Building2 size={16} color="#0284c7" /> Tunnit asiakkaittain (h)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.775rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={thLeft}>Asiakas</th>
                      {SHORT_MONTHS.map((m) => <th key={m} style={th}>{m}</th>)}
                      <th style={th}>Yht. h</th>
                      <th style={th}>Veroton</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyNames.map((name, idx) => {
                      const c = companyTotals[name];
                      return (
                        <tr key={name} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ ...tdLeft, fontWeight: '600', color: '#0369a1' }}>{name}</td>
                          {c.monthHours.map((h, i) => (
                            <td key={i} style={{ ...td, color: h ? '#1e293b' : '#cbd5e1' }}>{h ? formatHours(h) : '–'}</td>
                          ))}
                          <td style={{ ...td, fontWeight: '800', color: '#0284c7' }}>{formatHours(c.billedHours)}</td>
                          <td style={{ ...td, fontWeight: '600' }}>{formatCurrency(c.net)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {companyNames.length > 1 && (
                    <tfoot>
                      <tr style={{ background: '#e2e8f0', fontWeight: '800', borderTop: '2px solid #94a3b8' }}>
                        <td style={tdLeft}>YHTEENSÄ</td>
                        {months.map((m) => <td key={m.monthKey} style={td}>{m.billedHours ? formatHours(m.billedHours) : '–'}</td>)}
                        <td style={{ ...td, color: '#0284c7' }}>{formatHours(totals.billedHours)}</td>
                        <td style={td}>{formatCurrency(totals.net)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}

          {/* Laskutusrivit */}
          {invoiceLines.length > 0 && (
            <>
              <h3 style={sectionTitle}><Receipt size={16} color="#0284c7" /> Laskutusrivit (esim. Invoicer.fi)</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.4rem' }}>
                Yksi rivi per kuukausi, asiakas ja tuntihinta. Syötä laskulle: kuvaus, määrä (h), à-hinta (veroton) ja {vatLabel}.
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={thLeft}>Asiakas</th>
                    <th style={thLeft}>Kuvaus</th>
                    <th style={th}>Määrä</th>
                    <th style={th}>À-hinta (alv 0)</th>
                    <th style={th}>ALV %</th>
                    <th style={th}>Veroton</th>
                    <th style={th}>ALV</th>
                    <th style={th}>Yhteensä</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceLines.map((line, idx) => (
                    <tr key={`${line.monthIdx}-${line.company}-${line.unitPrice}`} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ ...tdLeft, fontWeight: '600', color: '#0369a1' }}>{line.company}</td>
                      <td style={tdLeft}>{line.description}</td>
                      <td style={td}>{formatHours(line.hours)} h</td>
                      <td style={td}>{formatCurrency(line.unitPrice)}</td>
                      <td style={td}>{formatPercent(line.vatRate)}</td>
                      <td style={td}>{formatCurrency(line.net)}</td>
                      <td style={td}>{formatCurrency(line.vat)}</td>
                      <td style={{ ...td, fontWeight: '700' }}>{formatCurrency(line.gross)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Kirjanpito */}
          {bookkeepingRows.length > 0 && (
            <>
              <h3 style={sectionTitle}><BookOpen size={16} color="#0284c7" /> Kirjanpitoon (Kirjanpitopohja)</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.4rem' }}>
                Yksi myyntirivi per kuukausi ja asiakas. Kirjaa rivi oikean kuukauden välilehdelle (01–12).
                Tarkista päiväys: se on oletuksena kuukauden viimeinen päivä, kirjanpitoon tulee laskun päiväys.
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={thLeft}>Välilehti</th>
                    <th style={thLeft}>Päiväys</th>
                    <th style={thLeft}>Selite</th>
                    <th style={thLeft}>Kirjanpidon luokka</th>
                    <th style={th}>Veroton</th>
                    <th style={th}>Brutto</th>
                    <th style={thLeft}>Tila</th>
                  </tr>
                </thead>
                <tbody>
                  {bookkeepingRows.map((row, idx) => (
                    <tr key={`${row.monthIdx}-${row.description}`} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ ...tdLeft, fontWeight: '700' }}>{row.sheet}</td>
                      <td style={tdLeft}>{row.date}</td>
                      <td style={{ ...tdLeft, whiteSpace: 'normal' }}>{row.description}</td>
                      <td style={tdLeft}>{row.category}</td>
                      <td style={td}>{formatCurrency(row.net)}</td>
                      <td style={{ ...td, fontWeight: '700' }}>{formatCurrency(row.gross)}</td>
                      <td style={{ ...tdLeft, fontWeight: '700', fontSize: '0.75rem', color: INVOICE_STATUS[row.invoiceStatus].color }}>
                        {INVOICE_STATUS[row.invoiceStatus].label}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {!hasData && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              Ei kirjattuja työvuoroja vuodelle {year} valitulla suodatuksella.
            </div>
          )}

          <div className="no-print" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '0.75rem', fontSize: '0.775rem', color: '#0c4a6e' }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong>Kirjanpito CSV:</strong> sarakkeet A–F vastaavat Kirjanpitopohjan kuukausivälilehtien sarakkeita
              (Päiväys, Selite, Tyyppi, Tyyppi teksti, Kirjanpidon luokka, Verollinen summa). Kopioi kuukauden rivien
              sarakkeet A–F ja liitä ne välilehden ensimmäiselle vapaalle riville. Pohjan solussa F1 pitää olla valittuna
              "Verollinen summa (brutto)". ALV-kannan voi vaihtaa asetuksista (⚙️).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value, sub, color }) {
  return (
    <div>
      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>{label}</span>
      <div style={{ fontSize: '1.35rem', fontWeight: '800', color }}>{value}</div>
      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{sub}</span>
    </div>
  );
}
