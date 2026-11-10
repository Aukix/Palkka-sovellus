import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Trash2, 
  Edit3, 
  Search, 
  FileText, 
  AlertCircle,
  ArrowUpDown,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { formatDateWithDay, formatDuration, formatCurrency } from '../utils/hoursCalculator';

export default function EntryList({ 
  entriesForMonth = [], 
  onEditEntry, 
  onDeleteEntry, 
  onToggleBilled,
  settings,
  selectedCompany = 'ALL',
  onSelectCompany,
  companies = []
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(false); // Default latest first
  const [billingFilter, setBillingFilter] = useState('ALL'); // 'ALL' | 'UNBILLED' | 'BILLED'

  const hourlyWage = Number(settings?.hourlyWage) || 0;

  // Filter entries by company, billing status, and search query
  const filtered = entriesForMonth.filter(item => {
    // 1. Company match
    if (selectedCompany && selectedCompany !== 'ALL') {
      if ((item.company || 'Yritys 1') !== selectedCompany) {
        return false;
      }
    }

    // 2. Billing status match
    if (billingFilter === 'UNBILLED' && item.isBilled) return false;
    if (billingFilter === 'BILLED' && !item.isBilled) return false;

    // 3. Search query match
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const dateFormatted = formatDateWithDay(item.date).toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const comp = (item.company || '').toLowerCase();
    return item.date.includes(q) || dateFormatted.includes(q) || desc.includes(q) || comp.includes(q);
  });

  // Sort entries
  filtered.sort((a, b) => {
    const comp = a.date.localeCompare(b.date);
    return sortAsc ? comp : -comp;
  });

  // Counts for billing badges
  const unbilledCount = entriesForMonth.filter(e => !e.isBilled).length;
  const billedCount = entriesForMonth.filter(e => e.isBilled).length;

  return (
    <div className="glass-panel no-print" style={{ padding: '0.85rem 1rem' }}>
      
      {/* Header & Search / Filter Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '0.65rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={16} color="var(--primary)" />
            <span>
              Työvuorot ({filtered.length}
              {selectedCompany !== 'ALL' && ` • ${selectedCompany}`}
              {entriesForMonth.length !== filtered.length && ` / ${entriesForMonth.length}`})
            </span>
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          
          {/* Company Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Building2 size={14} color="var(--accent-cyan)" />
            <select
              value={selectedCompany}
              onChange={(e) => onSelectCompany && onSelectCompany(e.target.value)}
              className="glass-input"
              style={{
                padding: '0.3rem 0.55rem',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                width: 'auto'
              }}
            >
              <option value="ALL" style={{ background: '#0f172a', color: '#f8fafc' }}>
                Kaikki yritykset ({entriesForMonth.length})
              </option>
              {companies.map((c) => {
                const countForComp = entriesForMonth.filter(e => (e.company || 'Yritys 1') === c).length;
                return (
                  <option key={c} value={c} style={{ background: '#0f172a', color: '#f8fafc' }}>
                    🏢 {c} ({countForComp})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Billing Status Filter Dropdown */}
          <div>
            <select
              value={billingFilter}
              onChange={(e) => setBillingFilter(e.target.value)}
              className="glass-input"
              style={{
                padding: '0.3rem 0.55rem',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                width: 'auto',
                color: billingFilter === 'UNBILLED' ? 'var(--accent-amber)' : billingFilter === 'BILLED' ? 'var(--accent-emerald)' : 'inherit'
              }}
            >
              <option value="ALL" style={{ background: '#0f172a', color: '#f8fafc' }}>
                Kaikki tilat
              </option>
              <option value="UNBILLED" style={{ background: '#0f172a', color: '#f59e0b' }}>
                ⏳ Laskuttamatta ({unbilledCount})
              </option>
              <option value="BILLED" style={{ background: '#0f172a', color: '#10b981' }}>
                ✅ Laskutettu ({billedCount})
              </option>
            </select>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '150px' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Etsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input"
              style={{ paddingLeft: '1.8rem', paddingRight: '0.5rem', paddingTop: '0.3rem', paddingBottom: '0.3rem', fontSize: '0.8rem' }}
            />
          </div>

          {/* Sort Toggle Button */}
          <button 
            type="button" 
            onClick={() => setSortAsc(!sortAsc)} 
            className="btn btn-secondary btn-icon"
            style={{ padding: '0.3rem 0.45rem' }}
            title={sortAsc ? 'Vanhin ensin' : 'Uusin ensin'}
          >
            <ArrowUpDown size={14} />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1.5rem',
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-color)'
        }}>
          <AlertCircle size={36} color="var(--text-dim)" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.3rem' }}>
            {selectedCompany !== 'ALL'
              ? `Ei vuoroja yritykselle "${selectedCompany}" valituilla suodattimilla`
              : billingFilter !== 'ALL'
              ? `Ei vuoroja tilassa "${billingFilter === 'UNBILLED' ? 'Laskuttamatta' : 'Laskutettu'}"`
              : searchQuery ? 'Ei hakua vastaavia merkintöjä' : 'Ei kirjattuja työvuoroja tässä kuussa'}
          </h3>
          <p style={{ fontSize: '0.875rem' }}>
            {(selectedCompany !== 'ALL' || billingFilter !== 'ALL') ? (
              <button
                onClick={() => { onSelectCompany && onSelectCompany('ALL'); setBillingFilter('ALL'); }}
                className="btn btn-secondary"
                style={{ marginTop: '0.6rem', fontSize: '0.8rem' }}
              >
                Nollaa suodattimet
              </button>
            ) : searchQuery ? (
              'Kokeile eri hakusanaa.'
            ) : (
              'Lisää uusi työvuoro vasemmanpuoleisella lomakkeella.'
            )}
          </p>
        </div>
      ) : (
        /* Entries List Table */
        <div style={{ 
          overflowX: 'auto', 
          overflowY: 'auto', 
          maxHeight: 'calc(100vh - 310px)', 
          minHeight: '150px' 
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '0.725rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <th style={{ padding: '0.45rem 0.5rem', position: 'sticky', top: 0, background: '#0f172a', zIndex: 2 }}>Päivämäärä</th>
                <th style={{ padding: '0.45rem 0.5rem', position: 'sticky', top: 0, background: '#0f172a', zIndex: 2 }}>Yritys</th>
                <th style={{ padding: '0.45rem 0.5rem', position: 'sticky', top: 0, background: '#0f172a', zIndex: 2 }}>Työaika</th>
                <th style={{ padding: '0.45rem 0.5rem', position: 'sticky', top: 0, background: '#0f172a', zIndex: 2 }}>Todellinen</th>
                <th style={{ padding: '0.45rem 0.5rem', position: 'sticky', top: 0, background: '#0f172a', zIndex: 2 }}>Alkava 30m</th>
                <th style={{ padding: '0.45rem 0.5rem', position: 'sticky', top: 0, background: '#0f172a', zIndex: 2 }}>Palkka (€)</th>
                <th style={{ padding: '0.45rem 0.5rem', position: 'sticky', top: 0, background: '#0f172a', zIndex: 2 }}>Laskutus</th>
                <th style={{ padding: '0.45rem 0.5rem', position: 'sticky', top: 0, background: '#0f172a', zIndex: 2 }}>Kuvaus</th>
                <th style={{ padding: '0.45rem 0.5rem', position: 'sticky', top: 0, background: '#0f172a', zIndex: 2, textAlign: 'right' }}>Toiminnot</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => {
                const effectiveRate = Number(entry.wageRate) || hourlyWage;
                const shiftWage = entry.billedHours * effectiveRate;
                return (
                  <tr 
                    key={entry.id} 
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Date */}
                    <td style={{ padding: '0.45rem 0.5rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {formatDateWithDay(entry.date)}
                    </td>

                    {/* Company Tag */}
                    <td style={{ padding: '0.45rem 0.5rem', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '6px',
                        fontSize: '0.725rem',
                        fontWeight: '700',
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: '#a5b4fc',
                        border: '1px solid rgba(99, 102, 241, 0.25)'
                      }}>
                        🏢 {entry.company || 'Yritys 1'}
                      </span>
                    </td>

                    {/* Time */}
                    <td style={{ padding: '0.45rem 0.5rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} color="var(--accent-cyan)" />
                        <span>{entry.startTime} - {entry.endTime}</span>
                        {Number(entry.breakMinutes) > 0 && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)' }} title="Ruokatauko vähennetty">🍽️ −{entry.breakMinutes} min</span>
                        )}
                      </div>
                    </td>

                    {/* Real Hours */}
                    <td style={{ padding: '0.45rem 0.5rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDuration(entry.durationMinutes)}
                      <span style={{ display: 'inline', fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: '0.3rem' }}>
                        ({entry.realHours}h)
                      </span>
                    </td>

                    {/* Alkava Puolitunti (Billed Hours) */}
                    <td style={{ padding: '0.45rem 0.5rem', whiteSpace: 'nowrap' }}>
                      <span className="badge badge-alkava" style={{ fontSize: '0.775rem', padding: '0.15rem 0.45rem' }}>
                        {entry.billedHours} h
                      </span>
                    </td>

                    {/* Pay */}
                    <td style={{ padding: '0.45rem 0.5rem', fontWeight: '600', color: 'var(--accent-emerald)', whiteSpace: 'nowrap' }}>
                      {effectiveRate > 0 ? (
                        <div>
                          <div>{formatCurrency(shiftWage)}</div>
                          <div style={{ fontSize: '0.675rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>
                            {effectiveRate.toFixed(2)} €/h
                          </div>
                        </div>
                      ) : '-'}
                    </td>

                    {/* Laskutus status (Clickable Badge Toggle) */}
                    <td style={{ padding: '0.45rem 0.5rem', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => onToggleBilled && onToggleBilled(entry.id)}
                        className={`badge badge-clickable ${entry.isBilled ? 'badge-billed' : 'badge-unbilled'}`}
                        style={{ border: 'none', padding: '0.2rem 0.5rem', fontSize: '0.725rem' }}
                        title="Klikkaa tästä vaihtaaksesi tilan (Laskutettu / Laskuttamatta)"
                      >
                        {entry.isBilled ? '✅ Laskutettu' : '⏳ Laskuttamatta'}
                      </button>
                    </td>

                    {/* Description */}
                    <td style={{ padding: '0.45rem 0.5rem', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.description || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>-</span>}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                        <button 
                          onClick={() => onEditEntry(entry)}
                          className="btn btn-secondary btn-icon"
                          style={{ padding: '0.25rem 0.4rem' }}
                          title="Muokkaa työvuoroa"
                        >
                          <Edit3 size={13} color="var(--accent-cyan)" />
                        </button>

                        <button 
                          onClick={() => {
                            if (window.confirm(`Haluatko varmasti poistaa työvuoron (${formatDateWithDay(entry.date)})?`)) {
                              onDeleteEntry(entry.id);
                            }
                          }}
                          className="btn btn-danger btn-icon"
                          style={{ padding: '0.25rem 0.4rem' }}
                          title="Poista vuoro"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
