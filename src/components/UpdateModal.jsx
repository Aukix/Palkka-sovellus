import React, { useEffect, useRef, useState } from 'react';
import { X, RefreshCw, CheckCircle2, AlertCircle, Download, ShieldCheck } from 'lucide-react';
import {
  APP_VERSION,
  LegacyServerError,
  checkForUpdate,
  backupLocalData,
  installUpdate,
  requestRestart,
  waitForVersion,
} from '../utils/updater';

/**
 * Tilat: checking → upToDate | available | error
 * available → installing → restarting → (ikkuna sulkeutuu / sivu latautuu) | closeManually | error
 */
export default function UpdateModal({ isOpen, onClose }) {
  const [state, setState] = useState('checking');
  const [info, setInfo] = useState(null);
  const [step, setStep] = useState('');
  const [error, setError] = useState('');
  const busyRef = useRef(false);

  const runCheck = async () => {
    setState('checking');
    setError('');
    try {
      const result = await checkForUpdate();
      setInfo(result);
      setState(result.updateAvailable ? 'available' : 'upToDate');
    } catch (err) {
      setError(err instanceof LegacyServerError
        ? 'Päivitystoiminto otetaan käyttöön, kun suljet sovelluksen ja avaat sen uudelleen.'
        : `Päivitysten haku epäonnistui: ${err.message} Tarkista nettiyhteys.`);
      setState('error');
    }
  };

  useEffect(() => {
    if (isOpen) runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const busy = state === 'installing' || state === 'restarting';

  const handleInstall = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setState('installing');
    setError('');
    try {
      setStep('Tallennetaan varmuuskopio tunneista...');
      await backupLocalData();

      setStep('Ladataan ja asennetaan uusin versio...');
      const result = await installUpdate();

      setStep('Käynnistetään sovellus uudelleen...');
      setState('restarting');
      const restart = await requestRestart();

      if (restart.mode === 'window') {
        // Ikkuna suljetaan hallitusti, jotta selain tallentaa tiedot. Sovellus aukeaa uudelleen itsestään.
        setTimeout(() => {
          window.close();
          // Jos selain ei salli sulkemista, pyydetään käyttäjää sulkemaan ikkuna
          setTimeout(() => setState('closeManually'), 1500);
        }, 800);
      } else {
        const ok = await waitForVersion(result.version);
        if (ok) {
          window.location.reload();
        } else {
          setState('closeManually');
        }
      }
    } catch (err) {
      busyRef.current = false;
      setError(`Päivitys epäonnistui: ${err.message} Tallennetut tunnit ovat ennallaan.`);
      setState('error');
    }
  };

  const box = (color, bg) => ({
    display: 'flex',
    gap: '0.6rem',
    alignItems: 'flex-start',
    padding: '0.9rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${color}`,
    background: bg,
    fontSize: '0.875rem',
    lineHeight: 1.45,
  });

  return (
    <div className="modal-overlay no-print" onClick={busy ? undefined : onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={20} color="var(--accent-cyan)" />
            <span>Päivitykset</span>
          </h2>
          {!busy && (
            <button type="button" onClick={onClose} className="btn btn-secondary btn-icon" title="Sulje">
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {state === 'checking' && (
            <div style={box('var(--border-color)', 'rgba(255,255,255,0.03)')}>
              <RefreshCw size={18} className="spin" />
              <span>Haetaan päivityksiä GitHubista...</span>
            </div>
          )}

          {state === 'upToDate' && (
            <div style={box('rgba(16,185,129,0.4)', 'rgba(16,185,129,0.1)')}>
              <CheckCircle2 size={18} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
              <span>Ei päivityksiä. Sinulla on uusin versio <strong>{info?.current}</strong>.</span>
            </div>
          )}

          {state === 'available' && (
            <>
              <div style={box('rgba(6,182,212,0.4)', 'rgba(6,182,212,0.1)')}>
                <Download size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
                <span>
                  Uusi versio <strong>{info?.latest}</strong> on saatavilla.<br />
                  Nykyinen versio: {info?.current}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <ShieldCheck size={16} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span>
                  Tallennetut tunnit, yritykset ja asetukset säilyvät. Niistä tallennetaan lisäksi varmuuskopio
                  sovelluskansion <em>varmuuskopiot</em>-kansioon ennen päivitystä. Sovellus käynnistyy päivityksen jälkeen uudelleen.
                </span>
              </div>
            </>
          )}

          {busy && (
            <div style={box('rgba(99,102,241,0.4)', 'rgba(99,102,241,0.1)')}>
              <RefreshCw size={18} className="spin" style={{ flexShrink: 0 }} />
              <span>{step}<br /><span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Älä sulje sovellusta.</span></span>
            </div>
          )}

          {state === 'closeManually' && (
            <div style={box('rgba(245,158,11,0.45)', 'rgba(245,158,11,0.1)')}>
              <CheckCircle2 size={18} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
              <span>
                Päivitys on asennettu. <strong>Sulje tämä ikkuna</strong>, niin sovellus avautuu uudelleen uudella versiolla.
              </span>
            </div>
          )}

          {state === 'error' && (
            <div style={box('rgba(244,63,94,0.45)', 'rgba(244,63,94,0.1)')}>
              <AlertCircle size={18} color="var(--accent-rose)" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Asennettu versio {APP_VERSION}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(state === 'upToDate' || state === 'error') && (
                <button type="button" className="btn btn-secondary" onClick={runCheck}>
                  <RefreshCw size={16} /> Hae uudelleen
                </button>
              )}
              {state === 'available' && (
                <button type="button" className="btn btn-primary" onClick={handleInstall}>
                  <Download size={16} /> Päivitä nyt
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
