import React, { useState } from 'react';
import { X, Save, Settings, Info, Trash2, Building2, Plus } from 'lucide-react';
import { VAT_RATES, DEFAULT_VAT_RATE, formatPercent } from '../utils/yearReport';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  companies = [],
  onAddCompany,
  onDeleteCompany,
  onSaveSettings, 
  onClearAllData 
}) {
  const [hourlyWage, setHourlyWage] = useState(settings?.hourlyWage ?? 40);
  const [defaultStartTime, setDefaultStartTime] = useState(settings?.defaultStartTime || '08:00');
  const [defaultEndTime, setDefaultEndTime] = useState(settings?.defaultEndTime || '16:00');
  const [vatRate, setVatRate] = useState(settings?.vatRate ?? DEFAULT_VAT_RATE);
  const [newCompanyName, setNewCompanyName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings({
      hourlyWage: Number(hourlyWage) || 0,
      defaultStartTime,
      defaultEndTime,
      vatRate: Number(vatRate),
      useStartingHour: true
    });
    onClose();
  };

  const handleAddNewCompany = (e) => {
    e.preventDefault();
    const trimmed = newCompanyName.trim();
    if (!trimmed) return;
    if (onAddCompany) {
      onAddCompany(trimmed);
      setNewCompanyName('');
    }
  };

  const handleClearData = () => {
    if (window.confirm('VAROITUS: Haluatko varmasti poistaa KAIKKI tallennetut työtunnit? Tätä toimintoa ei voi peruuttaa.')) {
      onClearAllData();
      onClose();
    }
  };

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={22} color="var(--primary)" />
            <span>Sovelluksen Asetukset</span>
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary btn-icon"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Yritysten / Asiakkaiden hallinta */}
          <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)' }}>
              <Building2 size={16} /> Tallennetut Yritykset / Asiakkaat
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.5rem', display: 'block' }}>
              Nämä yritykset näkyvät vetovalikossa työvuoroja kirjattaessa ja suodatettaessa.
            </span>

            {/* List of current companies */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {companies.map(c => (
                <span 
                  key={c}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: 'var(--text-main)',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    fontWeight: '600'
                  }}
                >
                  🏢 {c}
                  {companies.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteCompany && onDeleteCompany(c)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-rose)',
                        cursor: 'pointer',
                        padding: '0 0.1rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={`Poista yritys ${c}`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {/* Add company input */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Uuden yrityksen nimi..."
                className="glass-input"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
              />
              <button
                type="button"
                onClick={handleAddNewCompany}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', gap: '0.3rem' }}
              >
                <Plus size={15} color="var(--accent-cyan)" /> Lisää
              </button>
            </div>
          </div>

          {/* Hourly wage */}
          <div className="form-group">
            <label className="form-label">Tuntipalkka (€ / tunti)</label>
            <input 
              type="number" 
              step="0.05" 
              min="0" 
              value={hourlyWage} 
              onChange={(e) => setHourlyWage(e.target.value)} 
              className="glass-input" 
              placeholder="esim. 18.50"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Käytetään kuukauden ja vuorojen arvioidun ansion laskemiseen.
            </span>
          </div>

          {/* ALV-kanta */}
          <div className="form-group">
            <label className="form-label">ALV-kanta laskutuksessa</label>
            <select
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
              className="glass-input"
            >
              {VAT_RATES.map(rate => (
                <option key={rate} value={rate} style={{ background: '#0f172a', color: '#f8fafc' }}>
                  {formatPercent(rate)} %{rate === 0 ? ' (ei arvonlisäverovelvollinen)' : ''}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Tuntipalkka on veroton hinta. Vuosiraportti laskee ALV:n tällä kannalla ja valitsee kirjanpidon luokan (esim. 300 Myynti - Suomi 25,5%).
            </span>
          </div>

          {/* Defaults grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Oletus aloitusaika</label>
              <input 
                type="time" 
                value={defaultStartTime} 
                onChange={(e) => setDefaultStartTime(e.target.value)} 
                className="glass-input" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Oletus lopetusaika</label>
              <input 
                type="time" 
                value={defaultEndTime} 
                onChange={(e) => setDefaultEndTime(e.target.value)} 
                className="glass-input" 
              />
            </div>
          </div>

          {/* Explanation Box */}
          <div style={{
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            fontSize: '0.825rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '0.35rem' }}>
              <Info size={16} /> Miten "Alkava puolitunti" -laskenta toimii?
            </div>
            Alkavalle puolelle tunnille laskennassa jokainen työpäivän aikana alkanut 30 minuutin jakso pyöristetään aina seuraavaan puoleen tuntiin. 
            Esimerkiksi 1 tunnin ja 5 minuutin työvuoro pyöristetään 1,5 tunniksi, ja 1 tunnin ja 35 minuutin työvuoro pyöristetään 2,0 tunniksi (Math.ceil(min / 30) * 0.5).
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <button 
              type="button" 
              onClick={handleClearData} 
              className="btn btn-danger"
              style={{ padding: '0.6rem 1rem', fontSize: '0.825rem' }}
            >
              <Trash2 size={16} />
              <span>Tyhjennä tiedot</span>
            </button>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
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
                <span>Tallenna</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
