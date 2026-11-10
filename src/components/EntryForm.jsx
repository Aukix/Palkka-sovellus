import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Check, RotateCcw, Info, Zap, Building2, PlusCircle, X, Trash2, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { calculateShiftHours, formatDuration, formatCurrency, getTodayString, LUNCH_BREAK_MINUTES } from '../utils/hoursCalculator';

export default function EntryForm({ 
  onSaveEntry, 
  editingEntry, 
  onCancelEdit, 
  settings,
  companies = [],
  onAddCompany,
  onDeleteCompany
}) {
  const [date, setDate] = useState(getTodayString());
  const [company, setCompany] = useState(companies[0] || 'Yritys 1');
  const [startTime, setStartTime] = useState(settings?.defaultStartTime || '08:00');
  const [endTime, setEndTime] = useState(settings?.defaultEndTime || '16:00');
  const [wageRate, setWageRate] = useState(settings?.hourlyWage ?? 40);
  const [description, setDescription] = useState('');
  const [isBilled, setIsBilled] = useState(false);
  const [hasLunchBreak, setHasLunchBreak] = useState(false);

  // Inline company management state
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isManagingCompanies, setIsManagingCompanies] = useState(false);

  // Populate form if editing an entry
  useEffect(() => {
    if (editingEntry) {
      setDate(editingEntry.date || getTodayString());
      setCompany(editingEntry.company || companies[0] || 'Yritys 1');
      setStartTime(editingEntry.startTime || '08:00');
      setEndTime(editingEntry.endTime || '16:00');
      setWageRate(editingEntry.wageRate ?? settings?.hourlyWage ?? 40);
      setDescription(editingEntry.description || '');
      setIsBilled(Boolean(editingEntry.isBilled));
      setHasLunchBreak((Number(editingEntry.breakMinutes) || 0) > 0);
    }
  }, [editingEntry]);

  // Update default settings when settings change and not editing
  useEffect(() => {
    if (!editingEntry && settings) {
      setStartTime(settings.defaultStartTime || '08:00');
      setEndTime(settings.defaultEndTime || '16:00');
      setWageRate(settings.hourlyWage ?? 40);
    }
  }, [settings, editingEntry]);

  // Update company if companies list changes and current selection is missing or empty
  useEffect(() => {
    if (!companies.includes(company) && companies.length > 0) {
      setCompany(companies[0]);
    }
  }, [companies, company]);

  // Live calculation: alkava puolitunti (Math.ceil(minutes / 30) * 0.5)
  const breakMinutes = hasLunchBreak ? LUNCH_BREAK_MINUTES : 0;
  const calc = calculateShiftHours(startTime, endTime, breakMinutes);
  const hourlyWageNum = Number(wageRate) || 0;
  const estimatedEarn = calc.billedHours * hourlyWageNum;

  const handleAddNewCompanySubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = newCompanyName.trim();
    if (!trimmed) return;
    if (onAddCompany) {
      onAddCompany(trimmed);
    }
    setCompany(trimmed);
    setNewCompanyName('');
    setIsAddingCompany(false);
  };

  const handleDeleteCompanyClick = (targetCompany) => {
    if (!targetCompany) return;
    if (companies.length <= 1) {
      alert('Ainakin yksi yritys pitää olla tallennettuna.');
      return;
    }
    if (window.confirm(`Haluatko varmasti poistaa yrityksen "${targetCompany}" listalta?`)) {
      if (onDeleteCompany) {
        onDeleteCompany(targetCompany);
      }
      if (company === targetCompany) {
        const remaining = companies.filter(c => c !== targetCompany);
        setCompany(remaining[0] || '');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) return;

    onSaveEntry({
      id: editingEntry ? editingEntry.id : Date.now().toString(),
      company: company || companies[0] || 'Yritys 1',
      date,
      startTime,
      endTime,
      breakMinutes,
      description: description.trim(),
      wageRate: hourlyWageNum,
      isBilled: Boolean(isBilled)
    });

    // Reset form if creating new entry
    if (!editingEntry) {
      setDescription('');
      setIsBilled(false);
      setHasLunchBreak(false);
    }
  };

  const handleApplyPreset = (start, end) => {
    setStartTime(start);
    setEndTime(end);
  };

  return (
    <div className="glass-panel no-print" style={{ padding: '0.85rem 1rem', marginBottom: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {editingEntry ? <Edit2 size={16} color="var(--accent-cyan)" /> : <Plus size={16} color="var(--primary)" />}
          <span>{editingEntry ? 'Muokkaa työvuoroa' : 'Lisää uusi työvuoro'}</span>
        </h2>
        {editingEntry && (
          <button 
            type="button" 
            onClick={onCancelEdit} 
            className="btn btn-secondary" 
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.725rem' }}
          >
            Peruuta
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        
        {/* Asiakas / Yritys valitsin, lisäys & poisto */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem', flexWrap: 'wrap', gap: '0.3rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', margin: 0, fontSize: '0.725rem' }}>
              <Building2 size={13} color="var(--accent-cyan)" /> Asiakas / Yritys
            </label>
            
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {!isAddingCompany ? (
                <button
                  type="button"
                  onClick={() => { setIsAddingCompany(true); setIsManagingCompanies(false); }}
                  className="btn btn-secondary"
                  style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', gap: '0.25rem' }}
                  title="Lisää uusi asiakas tai yritys listaan"
                >
                  <PlusCircle size={12} color="var(--accent-cyan)" /> + Uusi
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setIsAddingCompany(false); setNewCompanyName(''); }}
                  className="btn btn-secondary btn-icon"
                  style={{ padding: '0.15rem 0.35rem' }}
                  title="Peruuta lisäys"
                >
                  <X size={12} />
                </button>
              )}

              <button
                type="button"
                onClick={() => { setIsManagingCompanies(!isManagingCompanies); setIsAddingCompany(false); }}
                className="btn btn-secondary"
                style={{
                  padding: '0.15rem 0.45rem',
                  fontSize: '0.7rem',
                  gap: '0.25rem',
                  color: isManagingCompanies ? 'var(--accent-rose)' : 'var(--text-muted)'
                }}
                title="Hallitse yrityksiä"
              >
                <Trash2 size={12} color="var(--accent-rose)" /> {isManagingCompanies ? 'Sulje' : 'Poista'}
              </button>
            </div>
          </div>

          {/* Inline lisäyskenttä */}
          {isAddingCompany && (
            <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(6, 182, 212, 0.08)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.3)', marginBottom: '0.3rem' }}>
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Uuden yrityksen nimi..."
                className="glass-input"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddNewCompanySubmit}
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
              >
                Tallenna
              </button>
            </div>
          )}

          {/* Yritysten hallintapalkki (poistotagi-lista) */}
          {isManagingCompanies && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.07)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem',
              marginBottom: '0.35rem'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-rose)', marginBottom: '0.3rem', fontWeight: '700' }}>
                Poista yritys klikkaamalla:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {companies.map(c => (
                  <span
                    key={c}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '6px',
                      fontSize: '0.725rem',
                      fontWeight: '600',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)'
                    }}
                  >
                    🏢 {c}
                    {companies.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCompanyClick(c)}
                        style={{
                          background: 'rgba(244, 63, 94, 0.25)',
                          border: 'none',
                          color: 'var(--accent-rose)',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          padding: '0.1rem 0.25rem',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={`Poista yritys "${c}"`}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dropdown ja suora roskakoripainike */}
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="glass-input"
              style={{ cursor: 'pointer', fontWeight: '600', flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
            >
              {companies.map((c) => (
                <option key={c} value={c} style={{ background: '#0f172a', color: '#f8fafc' }}>
                  🏢 {c}
                </option>
              ))}
            </select>

            {companies.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteCompanyClick(company)}
                className="btn btn-danger btn-icon"
                style={{ padding: '0.45rem', flexShrink: 0 }}
                title={`Poista valittu yritys (${company}) listalta`}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Grid: Päivämäärä & Tuntipalkka */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.725rem' }}>Päivämäärä</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="glass-input" 
              style={{ padding: '0.35rem 0.55rem', fontSize: '0.825rem' }}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem' }}>
              <DollarSign size={12} color="var(--accent-emerald)" /> Palkka (€/h)
            </label>
            <input 
              type="number" 
              step="0.5" 
              min="0" 
              value={wageRate} 
              onChange={(e) => setWageRate(e.target.value)} 
              className="glass-input" 
              style={{ padding: '0.35rem 0.55rem', fontSize: '0.825rem' }}
              placeholder="40" 
            />
          </div>
        </div>

        {/* 2-Column Grid: Start & End Times */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.725rem' }}>Aloitusaika</label>
            <input 
              type="time" 
              value={startTime} 
              onChange={(e) => setStartTime(e.target.value)} 
              className="glass-input" 
              style={{ padding: '0.35rem 0.55rem', fontSize: '0.825rem' }}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.725rem' }}>Lopetusaika</label>
            <input 
              type="time" 
              value={endTime} 
              onChange={(e) => setEndTime(e.target.value)} 
              className="glass-input" 
              style={{ padding: '0.35rem 0.55rem', fontSize: '0.825rem' }}
              required 
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.675rem', color: 'var(--text-dim)', marginRight: '0.1rem' }}>Pika:</span>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ padding: '0.15rem 0.4rem', fontSize: '0.675rem' }}
            onClick={() => handleApplyPreset('08:00', '16:00')}
          >
            08-16 (8h)
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ padding: '0.15rem 0.4rem', fontSize: '0.675rem' }}
            onClick={() => handleApplyPreset('08:00', '16:15')}
          >
            08-16:15 (8.5h)
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ padding: '0.15rem 0.4rem', fontSize: '0.675rem' }}
            onClick={() => handleApplyPreset('08:00', '16:45')}
          >
            08-16:45 (9h)
          </button>
        </div>

        {/* Ruokatauko */}
        <div>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
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

        {/* Description / Note */}
        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.725rem' }}>Kuvaus / Työtehtävä</label>
          <input 
            type="text" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            className="glass-input" 
            style={{ padding: '0.35rem 0.55rem', fontSize: '0.825rem' }}
            placeholder="esim. Huoltotyöt, koodaus" 
          />
        </div>

        {/* Laskutustilanne Täppäys */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
            <label className="form-label" style={{ margin: 0, fontSize: '0.725rem' }}>
              Laskutustilanne
            </label>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setIsBilled(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  border: !isBilled ? '2px solid var(--accent-amber)' : '1px solid var(--border-color)',
                  background: !isBilled ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                  color: !isBilled ? 'var(--accent-amber)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.725rem',
                  transition: 'var(--transition-fast)'
                }}
              >
                <AlertCircle size={12} />
                <span>⏳ Laskuttamatta</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBilled(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  border: isBilled ? '2px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                  background: isBilled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                  color: isBilled ? 'var(--accent-emerald)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.725rem',
                  transition: 'var(--transition-fast)'
                }}
              >
                <CheckCircle2 size={12} />
                <span>✅ Laskutettu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Calculation Preview Box */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.45rem 0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Todellinen: {formatDuration(calc.durationMinutes)} ({calc.realHours} t){hasLunchBreak && ` • tauko −${LUNCH_BREAK_MINUTES} min`}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
              {calc.billedHours} h <span style={{ fontSize: '0.725rem', fontWeight: '500' }}>(30 min pyöristys)</span>
            </div>
          </div>

          {hourlyWageNum > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Ansio vuorosta</div>
              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--accent-emerald)' }}>
                {formatCurrency(estimatedEarn)}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.85rem', marginTop: '0.1rem' }}>
          {editingEntry ? (
            <>
              <Check size={16} />
              <span>Tallenna muutokset</span>
            </>
          ) : (
            <>
              <Plus size={16} />
              <span>Lisää työvuoro ({company || 'Yritys'})</span>
            </>
          )}
        </button>

      </form>
    </div>
  );
}
