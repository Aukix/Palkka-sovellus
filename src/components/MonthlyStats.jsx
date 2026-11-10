import React from 'react';
import { Clock, TrendingUp, DollarSign, CalendarCheck, Building2, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDuration, formatCurrency, formatMonthYear } from '../utils/hoursCalculator';

export default function MonthlyStats({ 
  allMonthEntries = [], 
  filteredMonthEntries = [], 
  selectedCompany = '', 
  selectedMonth, 
  settings,
  onSelectCompany
}) {
  const hourlyWage = Number(settings?.hourlyWage) || 0;

  // 1. Calculate Grand Totals across ALL companies in this month
  let grandBilledHours = 0;
  let grandRealHours = 0;
  let grandMinutes = 0;
  let grandGrossPay = 0;
  const companyMap = {};

  allMonthEntries.forEach(entry => {
    grandBilledHours += entry.billedHours;
    grandRealHours += entry.realHours;
    grandMinutes += entry.durationMinutes;

    const rate = Number(entry.wageRate) || hourlyWage;
    const shiftPay = entry.billedHours * rate;
    grandGrossPay += shiftPay;

    const comp = entry.company || 'Yleinen';
    if (!companyMap[comp]) {
      companyMap[comp] = { billedHours: 0, realHours: 0, shifts: 0, grossPay: 0 };
    }
    companyMap[comp].billedHours += entry.billedHours;
    companyMap[comp].realHours += entry.realHours;
    companyMap[comp].shifts += 1;
    companyMap[comp].grossPay += shiftPay;
  });

  // 2. Calculate View Totals (filtered by selected company or all)
  let viewBilledHours = 0;
  let viewRealHours = 0;
  let viewMinutes = 0;
  let viewGrossPay = 0;
  let viewUnbilledHours = 0;
  let viewUnbilledPay = 0;
  let viewUnbilledCount = 0;
  let viewBilledStatusHours = 0;
  let viewBilledStatusPay = 0;
  let viewBilledStatusCount = 0;

  filteredMonthEntries.forEach(entry => {
    viewBilledHours += entry.billedHours;
    viewRealHours += entry.realHours;
    viewMinutes += entry.durationMinutes;
    const rate = Number(entry.wageRate) || hourlyWage;
    const shiftPay = entry.billedHours * rate;
    viewGrossPay += shiftPay;

    if (entry.isBilled) {
      viewBilledStatusHours += entry.billedHours;
      viewBilledStatusPay += shiftPay;
      viewBilledStatusCount += 1;
    } else {
      viewUnbilledHours += entry.billedHours;
      viewUnbilledPay += shiftPay;
      viewUnbilledCount += 1;
    }
  });

  const viewShifts = filteredMonthEntries.length;
  const viewAvgShift = viewShifts > 0 ? (viewBilledHours / viewShifts).toFixed(1) : '0';
  const extraHoursFromRounding = viewBilledHours - Math.round(viewRealHours * 10) / 10;

  const isCompanyFiltered = Boolean(selectedCompany && selectedCompany !== 'ALL');

  return (
    <div className="no-print" style={{ marginBottom: '0.65rem' }}>
      
      {/* Header bar with month and starting hour badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '0.4rem'
      }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: '700' }}>
          Kuukauden yhteenveto <span style={{ color: 'var(--accent-cyan)' }}>({formatMonthYear(selectedMonth)})</span>
          {isCompanyFiltered && (
            <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              • {selectedCompany}
            </span>
          )}
        </h2>
        <span className="badge badge-alkava" style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}>
          <Clock size={13} /> Alkava puolitunti (30 min)
        </span>
      </div>

      {/* ALWAYS VISIBLE: Grand Total Banner if a specific company is filtered */}
      {isCompanyFiltered && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.45rem 0.85rem',
          marginBottom: '0.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={16} color="var(--accent-cyan)" />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700' }}>
                Kaikki yritykset yhteensä tässä kuussa:
              </span>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.05rem' }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>{grandBilledHours} h</strong> pyöristettynä ({Math.round(grandRealHours * 100) / 100} h todellista)
                {hourlyWage > 0 && <span style={{ color: 'var(--accent-emerald)', marginLeft: '0.6rem' }}>{formatCurrency(grandGrossPay)}</span>}
              </div>
            </div>
          </div>
          {onSelectCompany && (
            <button
              onClick={() => onSelectCompany('ALL')}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.725rem' }}
            >
              Näytä kaikki yritykset
            </button>
          )}
        </div>
      )}

      {/* Stats Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.65rem',
        marginBottom: '0.5rem'
      }}>

        {/* 1. Primary Billed Hours Card */}
        <div className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          padding: '0.55rem 0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isCompanyFiltered ? `${selectedCompany} Tunnit` : 'Työtunnit Yhteensä'}
            </span>
            <Clock size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ marginTop: '0.3rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', lineHeight: 1.1 }} className="gradient-text">
              {viewBilledHours} <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>h</span>
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              {isCompanyFiltered ? `Laskutettavat (${selectedCompany})` : 'Kaikki yritykset'}
            </div>
          </div>
        </div>

        {/* 2. Real Hours vs Rounding Card */}
        <div className="glass-card" style={{ padding: '0.55rem 0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Todelliset Tunnit
            </span>
            <TrendingUp size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ marginTop: '0.3rem' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1.1 }}>
              {Math.round(viewRealHours * 100) / 100} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>h</span>
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--accent-emerald)', marginTop: '0.15rem' }}>
              {formatDuration(viewMinutes)}
              {extraHoursFromRounding > 0 && (
                <span style={{ color: 'var(--accent-cyan)', marginLeft: '0.35rem' }}>
                  (+{extraHoursFromRounding.toFixed(2)}h)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Estimated Earnings Card */}
        <div className="glass-card" style={{ padding: '0.55rem 0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Arvioitu Ansio
            </span>
            <DollarSign size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ marginTop: '0.3rem' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: '700', color: 'var(--accent-emerald)', lineHeight: 1.1 }}>
              {formatCurrency(viewGrossPay)}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Vuorokohtaiset palkat
            </div>
          </div>
        </div>

        {/* 4. Shifts & Averages Card */}
        <div className="glass-card" style={{ padding: '0.55rem 0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Työvuorot
            </span>
            <CalendarCheck size={16} color="var(--primary)" />
          </div>
          <div style={{ marginTop: '0.3rem' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1.1 }}>
              {viewShifts} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>päivää</span>
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Ka: ~{viewAvgShift} h / vuoro
            </div>
          </div>
        </div>

      </div>

      {/* Billing Status Summary Bar */}
      {viewBilledHours > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.4rem',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          marginBottom: '0.45rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.725rem',
                fontWeight: '700',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-amber)',
                border: '1px solid rgba(245, 158, 11, 0.35)'
              }}>
                <AlertCircle size={12} /> Odottaa laskutusta ({viewUnbilledCount}):
              </span>
              <strong style={{ color: 'var(--accent-amber)', fontSize: '0.825rem' }}>
                {viewUnbilledHours} h {viewUnbilledPay > 0 && `(${formatCurrency(viewUnbilledPay)})`}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.725rem',
                fontWeight: '700',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-emerald)',
                border: '1px solid rgba(16, 185, 129, 0.35)'
              }}>
                <CheckCircle2 size={12} /> Laskutettu ({viewBilledStatusCount}):
              </span>
              <strong style={{ color: 'var(--accent-emerald)', fontSize: '0.825rem' }}>
                {viewBilledStatusHours} h {viewBilledStatusPay > 0 && `(${formatCurrency(viewBilledStatusPay)})`}
              </strong>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Laskutettu: <strong style={{ color: viewBilledHours > 0 ? 'var(--accent-cyan)' : 'var(--text-dim)' }}>
              {viewBilledHours > 0 ? Math.round((viewBilledStatusHours / viewBilledHours) * 100) : 0}%
            </strong> tunneista
          </div>
        </div>
      )}

      {/* Company Breakdown Badges (Shows distribution across companies in the month) */}
      {Object.keys(companyMap).length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          flexWrap: 'wrap',
          background: 'rgba(12, 17, 29, 0.5)',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          fontSize: '0.775rem'
        }}>
          <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
            <Building2 size={13} color="var(--accent-cyan)" /> Tunnit yrityksittäin:
          </span>
          {Object.entries(companyMap).map(([compName, stats]) => {
            const isSelected = selectedCompany === compName;
            return (
              <button
                key={compName}
                onClick={() => onSelectCompany && onSelectCompany(isSelected ? 'ALL' : compName)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  transition: 'var(--transition-fast)'
                }}
                title={`Klikkaa suodattaaksesi: ${compName}`}
              >
                <span>{compName}:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>{stats.billedHours} h</strong>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.675rem' }}>({stats.shifts} kpl)</span>
              </button>
            );
          })}
          <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.75rem' }}>
            Yhteensä: <span style={{ color: 'var(--accent-cyan)' }}>{grandBilledHours} h</span>
          </div>
        </div>
      )}

    </div>
  );
}
