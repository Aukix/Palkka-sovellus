import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Building2, Calendar, Clock, DollarSign, FileText, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { calculateShiftHours, formatDuration, formatCurrency, LUNCH_BREAK_MINUTES } from '../utils/hoursCalculator';

export default function EditEntryModal({ 
  isOpen, 
  onClose, 
  entry, 
  onSave, 
  companies = [], 
  settings 
}) {
  const [date, setDate] = useState('');
  const [company, setCompany] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [wageRate, setWageRate] = useState(40);
  const [description, setDescription] = useState('');
  const [isBilled, setIsBilled] = useState(false);
  const [hasLunchBreak, setHasLunchBreak] = useState(false);

  useEffect(() => {
    if (entry) {
      setDate(entry.date || '');
      setCompany(entry.company || companies[0] || 'Yritys 1');
      setStartTime(entry.startTime || '08:00');
      setEndTime(entry.endTime || '16:00');
      setWageRate(entry.wageRate ?? settings?.hourlyWage ?? 40);
      setDescription(entry.description || '');
      setIsBilled(Boolean(entry.isBilled));
      setHasLunchBreak((Number(entry.breakMinutes) || 0) > 0);
    }
  }, [entry, companies, settings]);

  if (!isOpen || !entry) return null;

  const breakMinutes = hasLunchBreak ? LUNCH_BREAK_MINUTES : 0;
  const calc = calculateShiftHours(startTime, endTime, breakMinutes);
  const hourlyWageNum = Number(wageRate) || 0;
  const estimatedEarn = calc.billedHours * hourlyWageNum;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) return;

    onSave({
      ...entry,
      company: company || companies[0] || 'Yritys 1',
      date,
      startTime,
      endTime,
      breakMinutes,
      wageRate: hourlyWageNum,
      description: description.trim(),
      isBilled: Boolean(isBilled)
    });
    onClose();
  };

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '580px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit3 size={20} color="var(--accent-cyan)" />
            <span>Muokkaa työvuoroa</span>
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary btn-icon"
            title="Sulje"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Asiakas / Yritys */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={14} color="var(--accent-cyan)" /> Asiakas / Yritys
            </label>
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="glass-input"
              style={{ fontWeight: '600' }}
            >
              {companies.map(c => (
                <option key={c} value={c} style={{ background: '#0f172a', color: '#f8fafc' }}>
                  🏢 {c}
                </option>
              ))}
            </select>
          </div>

          {/* Päivämäärä */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} color="var(--primary)" /> Päivämäärä
            </label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="glass-input" 
              required 
            />
          </div>

          {/* Aloitus- ja Lopetusaika */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={14} color="var(--accent-cyan)" /> Aloitusaika
              </label>
              <input 
                type="time" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
                className="glass-input" 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={14} color="var(--accent-cyan)" /> Lopetusaika
              </label>
              <input 
                type="time" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
                className="glass-input" 
                required 
              />
            </div>
          </div>

          {/* Ruokatauko */}
          <div>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: hasLunchBreak ? 'var(--accent-amber)' : 'var(--text-muted)',
                userSelect: 'none'
              }}
              title="Vähentää {LUNCH_BREAK_MINUTES} min ruokatauon työajasta ennen pyöristystä"
            >
              <input
                type="checkbox"
                checked={hasLunchBreak}
                onChange={(e) => setHasLunchBreak(e.target.checked)}
                style={{ accentColor: 'var(--accent-amber)', width: '0.95rem', height: '0.95rem', cursor: 'pointer' }}
              />
              🍽️ Ruokatauko (−{LUNCH_BREAK_MINUTES} min)
            </label>
          </div>

          {/* Tuntipalkka */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <DollarSign size={14} color="var(--accent-emerald)" /> Tuntipalkka (€ / tunti)
            </label>
            <input 
              type="number" 
              step="0.5" 
              min="0" 
              value={wageRate} 
              onChange={(e) => setWageRate(e.target.value)} 
              className="glass-input" 
              placeholder="esim. 40" 
            />
          </div>

          {/* Kuvaus */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={14} color="var(--text-muted)" /> Kuvaus / Työtehtävä
            </label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="glass-input" 
              placeholder="esim. Huoltotyöt, koodaus" 
            />
          </div>

          {/* Laskutustilanne Täppäys / Toggle */}
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '0.35rem' }}>
              Laskutustilanne
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={() => setIsBilled(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.7rem',
                  borderRadius: 'var(--radius-md)',
                  border: !isBilled ? '2px solid var(--accent-amber)' : '1px solid var(--border-color)',
                  background: !isBilled ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: !isBilled ? 'var(--accent-amber)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  transition: 'var(--transition-fast)'
                }}
              >
                <AlertCircle size={16} />
                <span>⏳ Laskuttamatta</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBilled(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.7rem',
                  borderRadius: 'var(--radius-md)',
                  border: isBilled ? '2px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                  background: isBilled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: isBilled ? 'var(--accent-emerald)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  transition: 'var(--transition-fast)'
                }}
              >
                <CheckCircle2 size={16} />
                <span>✅ Laskutettu</span>
              </button>
            </div>
          </div>

          {/* Live Calculation Box */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            marginTop: '0.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Zap size={14} color="var(--accent-cyan)" /> LASKENTA LIVENÄ
              </span>
              <span className="badge badge-alkava">
                Alkava puolitunti
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Todellinen aika: <strong style={{ color: 'var(--text-main)' }}>{formatDuration(calc.durationMinutes)}</strong> ({calc.realHours} t){hasLunchBreak && ` • tauko −${LUNCH_BREAK_MINUTES} min`}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                  {calc.billedHours} h <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>(30 min pyöristys)</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ansio vuorosta</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--accent-emerald)' }}>
                  {formatCurrency(estimatedEarn)}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.75rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary"
            >
              Peruuta
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              <Save size={18} />
              <span>Tallenna muutokset</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
