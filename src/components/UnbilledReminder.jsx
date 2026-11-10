import React from 'react';
import { AlertTriangle, List } from 'lucide-react';
import { formatCurrency, formatMonthYear } from '../utils/hoursCalculator';
import { formatHours } from '../utils/yearReport';

/**
 * Muistutus laskuttamattomista tunneista muilta kuin valitulta kuukaudelta,
 * jotta niitä ei unohdu laskuttaa.
 */
export default function UnbilledReminder({
  entries = [],
  selectedMonth,
  selectedCompany = 'ALL',
  defaultWage = 0,
  onOpenMonth,
  onShowAll,
}) {
  const months = {};
  entries.forEach((e) => {
    if (e.isBilled || !e.date) return;
    if (selectedCompany !== 'ALL' && (e.company || 'Yritys 1') !== selectedCompany) return;
    const key = e.date.slice(0, 7);
    if (key === selectedMonth) return;
    if (!months[key]) months[key] = { hours: 0, amount: 0, count: 0 };
    const rate = Number(e.wageRate) || Number(defaultWage) || 0;
    months[key].hours += e.billedHours;
    months[key].amount += e.billedHours * rate;
    months[key].count += 1;
  });

  const keys = Object.keys(months).sort().reverse(); // uusin ensin
  if (keys.length === 0) return null;

  const totalHours = keys.reduce((s, k) => s + months[k].hours, 0);
  const totalAmount = keys.reduce((s, k) => s + months[k].amount, 0);

  return (
    <div className="no-print" role="status" style={{
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.45rem 0.6rem',
      background: 'rgba(245, 158, 11, 0.08)',
      border: '1px solid rgba(245, 158, 11, 0.4)',
      borderRadius: 'var(--radius-sm)',
      padding: '0.4rem 0.75rem',
      marginBottom: '0.45rem',
      fontSize: '0.8rem',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: '700', color: 'var(--accent-amber)' }}>
        <AlertTriangle size={14} />
        Laskuttamatta muilta kuukausilta{selectedCompany !== 'ALL' ? ` (${selectedCompany})` : ''}:
      </span>

      {keys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onOpenMonth && onOpenMonth(key)}
          title={`Avaa ${formatMonthYear(key).toLowerCase()} ja näytä laskuttamattomat vuorot`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.15rem 0.55rem',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            background: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--text-main)',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          {formatMonthYear(key)}:
          <strong style={{ color: 'var(--accent-amber)' }}>
            {formatHours(months[key].hours)} h{months[key].amount > 0 && ` (${formatCurrency(months[key].amount)})`}
          </strong>
        </button>
      ))}

      <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Yhteensä <strong style={{ color: 'var(--accent-amber)' }}>{formatHours(totalHours)} h ({formatCurrency(totalAmount)})</strong>
        </span>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onShowAll}
          style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
          title="Näytä kaikki laskuttamattomat vuorot kaikilta kuukausilta"
        >
          <List size={13} /> Näytä kaikki
        </button>
      </span>
    </div>
  );
}
