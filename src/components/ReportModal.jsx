import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Clock, Building2 } from 'lucide-react';
import { formatMonthYear, formatDateWithDay, formatDuration, formatCurrency } from '../utils/hoursCalculator';

export default function ReportModal({ 
  isOpen, 
  onClose, 
  allMonthEntries = [], 
  selectedMonth, 
  settings, 
  companies = [],
  initialCompany = 'ALL',
  onExportCSV 
}) {
  const [reportCompany, setReportCompany] = useState(initialCompany);

  useEffect(() => {
    setReportCompany(initialCompany);
  }, [initialCompany, isOpen]);

  if (!isOpen) return null;

  const hourlyWage = Number(settings?.hourlyWage) || 0;

  // Calculate Grand Totals for month
  let grandTotalBilledHours = 0;
  allMonthEntries.forEach(e => {
    grandTotalBilledHours += e.billedHours;
  });

  // Filter entries for the report
  const filtered = reportCompany === 'ALL'
    ? allMonthEntries
    : allMonthEntries.filter(e => (e.company || 'Yritys 1') === reportCompany);

  // Sort entries ascending by date for report
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

  let totalBilledHours = 0;
  let totalRealHours = 0;
  let totalGrossPay = 0;
  sorted.forEach(e => {
    totalBilledHours += e.billedHours;
    totalRealHours += e.realHours;
    const rate = Number(e.wageRate) || hourlyWage;
    totalGrossPay += e.billedHours * rate;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay report-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '860px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        
        {/* Actions Bar (hidden when printed) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Kuukausiraportti & Tulostus</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Valmis tuntikortti työnantajalle tai yritykselle</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Filter by company in report */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building2 size={16} color="var(--accent-cyan)" />
              <select
                value={reportCompany}
                onChange={(e) => setReportCompany(e.target.value)}
                className="glass-input"
                style={{ padding: '0.4rem 0.65rem', fontSize: '0.825rem', fontWeight: '600', width: 'auto' }}
              >
                <option value="ALL" style={{ background: '#0f172a', color: '#f8fafc' }}>
                  Kaikki yritykset ({allMonthEntries.length})
                </option>
                {companies.map(c => (
                  <option key={c} value={c} style={{ background: '#0f172a', color: '#f8fafc' }}>
                    🏢 {c}
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => onExportCSV && onExportCSV(reportCompany)} 
              className="btn btn-secondary" 
              style={{ fontSize: '0.825rem' }}
            >
              <Download size={16} /> Excel / CSV
            </button>
            <button 
              onClick={handlePrint} 
              className="btn btn-primary" 
              style={{ fontSize: '0.825rem' }}
            >
              <Printer size={16} /> Tulosta / PDF
            </button>
            <button 
              onClick={onClose} 
              className="btn btn-secondary btn-icon"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Report Sheet Content */}
        <div className="printable-report" style={{ background: '#ffffff', color: '#1e293b', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
          
          {/* Report Header */}
          <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: '800' }}>TUNTIKORTTI</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
                <span style={{ color: '#0284c7', fontWeight: '700', fontSize: '1.15rem' }}>
                  {formatMonthYear(selectedMonth)}
                </span>
                <span style={{
                  background: '#f0f9ff',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '0.85rem'
                }}>
                  {reportCompany === 'ALL' ? 'Kaikki yritykset' : `Yritys: ${reportCompany}`}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#475569' }}>
              <div>Laskentatapa: <strong>Alkava puolitunti (pyöristetty 30 min)</strong></div>
              <div>Päiväys: {new Date().toLocaleDateString('fi-FI')}</div>
            </div>
          </div>

          {/* Summary Box */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>
                {reportCompany === 'ALL' ? 'Työtunnit yhteensä' : `${reportCompany} tunnit`}
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0284c7' }}>
                {totalBilledHours} h
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Alkavilla puolitunneilla
                {reportCompany !== 'ALL' && ` (Koko kk: ${grandTotalBilledHours} h)`}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>Todelliset tunnit</span>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#334155' }}>
                {Math.round(totalRealHours * 100) / 100} h
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{sorted.length} työvuoroa</span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>Arvioitu Ansio</span>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#16a34a' }}>
                {formatCurrency(totalGrossPay)}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Vuorokohtaiset palkat
              </span>
            </div>
          </div>

          {/* Detailed Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '2rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem' }}>Pvm</th>
                <th style={{ padding: '0.6rem' }}>Yritys / Asiakas</th>
                <th style={{ padding: '0.6rem' }}>Työaika</th>
                <th style={{ padding: '0.6rem' }}>Todellinen</th>
                <th style={{ padding: '0.6rem' }}>Alkava 30m</th>
                <th style={{ padding: '0.6rem' }}>Laskutus</th>
                <th style={{ padding: '0.6rem' }}>Kuvaus</th>
                <th style={{ padding: '0.6rem', textAlign: 'right' }}>Ansio</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Ei kirjattuja työvuoroja valitulla suodatuksella.
                  </td>
                </tr>
              ) : (
                sorted.map((item, idx) => {
                  const rate = Number(item.wageRate) || hourlyWage;
                  const shiftWage = item.billedHours * rate;
                  return (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '0.55rem 0.6rem', fontWeight: '600' }}>{formatDateWithDay(item.date)}</td>
                      <td style={{ padding: '0.55rem 0.6rem', fontWeight: '600', color: '#0369a1' }}>{item.company || 'Yritys 1'}</td>
                      <td style={{ padding: '0.55rem 0.6rem' }}>{item.startTime} - {item.endTime}{Number(item.breakMinutes) > 0 && <span style={{ color: '#b45309', fontSize: '0.75rem' }}> (tauko −{item.breakMinutes} min)</span>}</td>
                      <td style={{ padding: '0.55rem 0.6rem' }}>{formatDuration(item.durationMinutes)}</td>
                      <td style={{ padding: '0.55rem 0.6rem', fontWeight: '700', color: '#0284c7' }}>{item.billedHours} h</td>
                      <td style={{ padding: '0.55rem 0.6rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: item.isBilled ? '#16a34a' : '#d97706'
                        }}>
                          {item.isBilled ? 'Laskutettu' : 'Laskuttamatta'}
                        </span>
                      </td>
                      <td style={{ padding: '0.55rem 0.6rem', color: '#475569' }}>{item.description || '-'}</td>
                      <td style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: '600' }}>
                        {rate > 0 ? formatCurrency(shiftWage) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {sorted.length > 0 && (
              <tfoot>
                <tr style={{ background: '#e2e8f0', fontWeight: '800', borderTop: '2px solid #94a3b8' }}>
                  <td colSpan="4" style={{ padding: '0.75rem 0.6rem' }}>YHTEENSÄ</td>
                  <td style={{ padding: '0.75rem 0.6rem', color: '#0284c7', fontSize: '1rem' }}>{totalBilledHours} h</td>
                  <td colSpan="2"></td>
                  <td style={{ padding: '0.75rem 0.6rem', textAlign: 'right', color: '#16a34a', fontSize: '1rem' }}>
                    {formatCurrency(totalGrossPay)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* Signatures section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '2.5rem' }}>Päiväys ja työntekijän allekirjoitus:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '85%' }}></div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '2.5rem' }}>Hyväksyjän / Yrityksen allekirjoitus:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '85%' }}></div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
