import React from 'react';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Download, 
  Printer, 
  Settings, 
  FileSpreadsheet,
  Building2,
  CalendarRange
} from 'lucide-react';
import { FINNISH_MONTHS } from '../utils/hoursCalculator';

export default function Header({ 
  selectedMonth, 
  setSelectedMonth, 
  selectedCompany = 'ALL',
  setSelectedCompany,
  companies = [],
  onOpenSettings, 
  onExportCSV, 
  onExportJSON, 
  onOpenReport,
  onOpenYearReport
}) {
  const [yearStr, monthStr] = selectedMonth.split('-');
  const currentYear = parseInt(yearStr, 10);
  const currentMonthIdx = parseInt(monthStr, 10) - 1;

  const handlePrevMonth = () => {
    let newM = currentMonthIdx - 1;
    let newY = currentYear;
    if (newM < 0) {
      newM = 11;
      newY -= 1;
    }
    const formattedM = String(newM + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${formattedM}`);
  };

  const handleNextMonth = () => {
    let newM = currentMonthIdx + 1;
    let newY = currentYear;
    if (newM > 11) {
      newM = 0;
      newY += 1;
    }
    const formattedM = String(newM + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${formattedM}`);
  };

  const handleMonthChange = (e) => {
    const val = e.target.value;
    if (val) setSelectedMonth(val);
  };

  const handleCurrentMonthClick = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  return (
    <header className="glass-panel no-print" style={{ padding: '0.55rem 1.15rem', marginBottom: '0.65rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        
        {/* App Title & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-cyan) 100%)',
            padding: '0.45rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>
            <Clock size={22} color="#ffffff" />
          </div>
          <div>
            <h1 className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: 1.1 }}>
              Tuntikirjaus
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Alkavan puolitunnin pyöristys (30 min) • Yrityskohtaiset tunnit
            </p>
          </div>
        </div>

        {/* Center Controls: Month & Company Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          
          {/* Month Selector Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(12, 17, 29, 0.6)',
            padding: '0.35rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <button 
              onClick={handlePrevMonth} 
              className="btn btn-secondary btn-icon" 
              title="Edellinen kuukausi"
            >
              <ChevronLeft size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.4rem' }}>
              <Calendar size={16} color="var(--accent-cyan)" />
              <input
                type="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                className="glass-input"
                style={{
                  padding: '0.35rem 0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  width: 'auto'
                }}
              />
            </div>

            <button 
              onClick={handleNextMonth} 
              className="btn btn-secondary btn-icon" 
              title="Seuraava kuukausi"
            >
              <ChevronRight size={18} />
            </button>

            <button 
              onClick={handleCurrentMonthClick}
              className="btn btn-secondary"
              style={{ fontSize: '0.775rem', padding: '0.35rem 0.6rem' }}
            >
              Nyt
            </button>
          </div>

          {/* Company Selector Dropdown in Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(12, 17, 29, 0.6)',
            padding: '0.35rem 0.6rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <Building2 size={16} color="var(--accent-cyan)" />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="glass-input"
              style={{
                border: 'none',
                background: 'transparent',
                padding: '0.35rem 0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                width: 'auto'
              }}
            >
              <option value="ALL" style={{ background: '#0f172a', color: '#f8fafc' }}>
                🏢 Kaikki yritykset
              </option>
              {companies.map(c => (
                <option key={c} value={c} style={{ background: '#0f172a', color: '#f8fafc' }}>
                  🏢 {c}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <button 
            onClick={onOpenReport}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            title="Avaa kuukausiraportti ja tulosta"
          >
            <Printer size={15} />
            <span>Raportti</span>
          </button>

          <button 
            onClick={onOpenYearReport}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            title="Koko vuoden raportti kuukausittain (kirjanpito & laskutus)"
          >
            <CalendarRange size={15} color="var(--accent-cyan)" />
            <span>Vuosiraportti</span>
          </button>

          <button 
            onClick={onExportCSV}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            title="Lataa tunnit Excel / CSV -muodossa"
          >
            <FileSpreadsheet size={15} color="var(--accent-emerald)" />
            <span>Vienti CSV</span>
          </button>

          <button 
            onClick={onOpenSettings}
            className="btn btn-secondary btn-icon"
            style={{ padding: '0.35rem 0.45rem' }}
            title="Asetukset & yritysten hallinta"
          >
            <Settings size={16} />
          </button>
        </div>

      </div>
    </header>
  );
}
