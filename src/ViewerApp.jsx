import React, { useEffect, useState } from 'react';
import { sessionSync } from './sessionSync.js';
import { dispName, flagImg } from './utils/flags.js';
import './viewer.css';

const logoAlt = '/simsd-square.svg';

// Reusable Flag component using HTML string from flagImg
function Flag({ code, fallback, iso, size }) {
  if (!code) return null;
  return <span dangerouslySetInnerHTML={{ __html: flagImg(code, fallback, iso, size) }} />;
}

export default function ViewerApp({ roomId }) {
  const [state, setState] = useState(null);
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [closedMessage, setClosedMessage] = useState('');
  const [lastPresenceChange, setLastPresenceChange] = useState(null);
  const prevPresence = React.useRef({});

  useEffect(() => {
    if (state?.presence) {
      for (const key in state.presence) {
        if (state.presence[key] !== prevPresence.current[key]) {
          setLastPresenceChange(key);
        }
      }
      prevPresence.current = { ...state.presence };
    }
  }, [state?.presence]);

  useEffect(() => {
    if (!roomId) {
      setError('ID da sala não fornecido.');
      setStatus('error');
      return;
    }

    const unsub = sessionSync.subscribe(event => {
      if (event.type === 'status') {
        setStatus(event.status);
      }
      if (event.type === 'error') {
        setError(event.message);
        setStatus('error');
      }
      if (event.type === 'closed') {
        setStatus('closed');
        setClosedMessage('Sessão encerrada');
      }
    });

    // Override applyRemoteState so sessionSync pushes updates here instead of window.SimSDController
    window.SimSDController = {
      applyRemoteState: (newState) => {
        setState(prev => ({ ...(prev || {}), ...newState }));
      },
      setRoomContext: () => { },
    };

    // Override fetch room info via ws init
    const originalWsMessage = sessionSync.socket?.onmessage;

    // We open with mode=viewer
    sessionSync.open({ id: roomId }, { mode: 'viewer' });

    // Handle initial state manually if needed, but sessionSync handles state:init and calls applyRemoteState
    const interceptor = sessionSync.subscribe((event) => {
      // room is emitted only when state:init happens? No, sessionSync doesn't emit room in init.
    });

    return () => {
      unsub();
      interceptor();
      sessionSync.close();
      window.SimSDController = null;
    };
  }, [roomId]);

  // Handle manual extraction of room info since sessionSync doesn't expose it directly on state:init easily
  useEffect(() => {
    const handleWsMsg = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'state:init') {
          setRoom(msg.room);
          if (msg.room?.status === 'closed') {
            setStatus('closed');
            setClosedMessage('Sessão encerrada');
          }
        }
      } catch { }
    };
    if (sessionSync.socket) {
      sessionSync.socket.addEventListener('message', handleWsMsg);
    }
  }, [status]); // re-bind if socket reconnects

  if (status === 'error') return <div className="viewer-screen center-msg"><div className="err-msg">{error}</div></div>;
  if (status === 'connecting') return <div className="viewer-screen center-msg"><div className="loading-spinner"></div><h2>Conectando...</h2></div>;
  if (status === 'closed') return <div className="viewer-screen center-msg"><h1>{closedMessage}</h1><p>A sessão foi encerrada pela mesa.</p></div>;
  if (!state) return <div className="viewer-screen center-msg"><div className="loading-spinner"></div><h2>Sincronizando estado...</h2></div>;

  return (
    <div className="viewer-app">
      <header className="v-header">
        <div className="v-header-left">
          <img src={logoAlt} alt="Logo" className="v-logo" />
          <div className="v-session-info">
            <h1 className="v-committee">{state.config?.committee || room?.name}</h1>
            <h2 className="v-session">{state.config?.session}</h2>
          </div>
        </div>
        <div className="v-header-center">
          <div className="v-agenda">{state.agenda || 'Nenhuma agenda foi adotada'}</div>
        </div>
        <div className="v-header-right">
          {status !== 'connected' && <span className="v-status-dot offline"></span>}
          <div className="v-quorum">
            <div>Maioria Qualificada: <strong>{calculateMajority(state)}</strong></div>
            <div>Presença Total: <strong>{calculatePresence(state)}</strong></div>
          </div>
        </div>
      </header>

      <main className="v-main">
        <ActiveView state={state} lastPresenceChange={lastPresenceChange} />
      </main>
    </div>
  );
}

function calculatePresence(state) {
  if (!state.committeeCountries) return 0;
  return state.committeeCountries.filter(c => state.presence[c.c] !== 'ausente' && c.voto !== false).length;
}

function calculateMajority(state) {
  const tot = calculatePresence(state);
  return tot > 0 ? Math.ceil(tot * 2 / 3) : '—';
}

function formatTime(secs) {
  const m = Math.floor(Math.max(0, secs) / 60);
  const s = Math.max(0, secs) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ActiveView({ state, lastPresenceChange }) {
  switch (state.activeTab) {
    case 'gsl': return <GslView state={state} />;
    case 'mod': return <ModCaucusView state={state} />;
    case 'unmod': return <UnmodCaucusView state={state} />;
    case 'solo': return <SoloSpeakerView state={state} />;
    case 'vote': return <VoteView state={state} />;
    case 'motions': return <MotionsView state={state} />;
    case 'presence': return <PresenceView state={state} lastPresenceChange={lastPresenceChange} />;
    default: return <div className="v-empty">Modo não suportado: {state.activeTab}</div>;
  }
}

function GslView({ state }) {
  const cur = state.speakers?.[state.curIdx];
  const timer = state.timer;

  return (
    <div className="v-view v-gsl">
      <div className="v-title-bar">Lista de Discursos</div>
      <div className="v-gsl-content">
        <div className="v-gsl-current">
          {cur ? (
            <div className="v-cur-speaker">
              <div className="v-cur-flag"><Flag code={cur.c} fallback={cur.f} iso={cur.i} size={120} /></div>
              <div className="v-cur-name">{dispName(cur.c, state)}</div>
              {cur.receivedFrom && <div className="v-received-from">Tempo cedido por {dispName(cur.receivedFrom, state)}</div>}
            </div>
          ) : (
            <div className="v-cur-speaker empty">
              <div className="v-cur-name">A lista de discursos está vazia</div>
            </div>
          )}

          <div className="v-timer-container">
            <div className={`v-timer-text ${timer?.sec <= (state.config?.warnTime || 15) ? 'warn' : ''} ${timer?.sec <= 0 ? 'danger' : ''}`}>
              {formatTime(timer?.sec || 0)}
            </div>
            <div className="v-timer-bar-wrap">
              <div className={`v-timer-bar ${timer?.sec <= (state.config?.warnTime || 15) ? 'warn' : ''} ${timer?.sec <= 0 ? 'danger' : ''}`} style={{ width: `${(timer?.sec / timer?.total) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="v-gsl-queue">
          <h3>Próximos Oradores</h3>
          <div className="v-queue-list">
            {state.speakers?.map((s, i) => (
              <div key={i} className={`v-queue-item ${i === state.curIdx ? 'active' : ''} ${i < state.curIdx ? 'past' : ''}`}>
                <div className="v-qi-flag"><Flag code={s.c} fallback={s.f} iso={s.i} size={40} /></div>
                <div className="v-qi-name">{dispName(s.c, state)}</div>
              </div>
            )).filter((_, i) => i > state.curIdx).slice(0, 8)}
            {(!state.speakers || state.speakers.length - state.curIdx <= 1) && <div className="v-empty-queue">Sem próximos oradores</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModCaucusView({ state }) {
  const mod = state.mod;
  const cur = mod?.spks?.[mod?.cur];

  return (
    <div className="v-view v-mod">
      <div className="v-title-bar">Sessão Moderada</div>
      <div className="v-mod-layout">
        <div className="v-mod-left">
          <div className="v-mod-timer-group">
            <h4>Tempo Total</h4>
            <div className="v-timer-text">{formatTime(mod?.totalSec || 0)}</div>
          </div>
          <div className="v-mod-queue">
            <h3>Oradores</h3>
            <div className="v-queue-list">
              {mod?.spks?.map((s, i) => (
                <div key={i} className={`v-queue-item ${i === mod.cur ? 'active' : ''} ${i < mod.cur ? 'past' : ''}`}>
                  <div className="v-qi-flag"><Flag code={s.c} fallback={s.f} iso={s.i} size={32} /></div>
                  <div className="v-qi-name">{dispName(s.c, state)}</div>
                </div>
              ))}
              {(!mod?.spks || mod.spks.length === 0) && <div className="v-empty-queue">Nenhum orador inscrito</div>}
            </div>
          </div>
        </div>
        <div className="v-mod-right">
          <div className="v-mod-current">
            {cur ? (
              <div className="v-cur-speaker">
                <div className="v-cur-flag"><Flag code={cur.c} fallback={cur.f} iso={cur.i} size={100} /></div>
                <div className="v-cur-name">{dispName(cur.c, state)}</div>
              </div>
            ) : (
              <div className="v-cur-speaker empty">Nenhum orador em discurso</div>
            )}

            <div className="v-timer-container">
              <div className={`v-timer-text ${mod?.spkSec <= 15 ? 'warn' : ''} ${mod?.spkSec <= 0 ? 'danger' : ''}`}>
                {formatTime(mod?.spkSec || 0)}
              </div>
              <div className="v-timer-bar-wrap">
                <div className="v-timer-bar" style={{ width: `${(mod?.spkSec / mod?.spkTotal) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnmodCaucusView({ state }) {
  const unmod = state.unmod;
  return (
    <div className="v-view v-unmod">
      <div className="v-title-bar">Sessão Não-Moderada</div>
      <div className="v-unmod-content">
        <span className="material-icons v-unmod-icon">groups</span>
        <h2>A sessão encontra-se em debate livre</h2>
        <div className="v-unmod-timer">
          <div className="v-timer-text massive">{formatTime(unmod?.sec || 0)}</div>
          <div className="v-timer-bar-wrap">
            <div className="v-timer-bar" style={{ width: `${(unmod?.sec / unmod?.total) * 100}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SoloSpeakerView({ state }) {
  const solo = state.solo;
  return (
    <div className="v-view v-solo">
      <div className="v-title-bar">Orador Único</div>
      <div className="v-solo-content">
        {solo?.code ? (
          <div className="v-cur-speaker">
            <div className="v-cur-flag"><Flag code={solo.code} fallback={solo.flag} iso={solo.iso} size={120} /></div>
            <div className="v-cur-name massive">{dispName(solo.code, state)}</div>
          </div>
        ) : (
          <div className="v-cur-speaker empty">Aguardando orador...</div>
        )}
        <div className="v-timer-container">
          <div className={`v-timer-text ${solo?.sec <= 15 ? 'warn' : ''} ${solo?.sec <= 0 ? 'danger' : ''}`}>
            {formatTime(solo?.sec || 0)}
          </div>
          <div className="v-timer-bar-wrap">
            <div className="v-timer-bar" style={{ width: `${(solo?.sec / solo?.total) * 100}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VoteView({ state }) {
  const config = state.voteConfig || {};
  const totalYes = Object.values(state.votes || {}).filter(v => ['fav', 'fdr'].includes(v)).length;
  const totalNo = Object.values(state.votes || {}).filter(v => ['con', 'cdr'].includes(v)).length;
  const totalAbs = Object.values(state.votes || {}).filter(v => v === 'abs').length;

  const present = state.committeeCountries?.filter(c => (state.presence[c.c] === 'presente-votante' || state.presence[c.c] === 'presente') && c.voto !== false)
    .slice().sort((a, b) => dispName(a.c, state).localeCompare(dispName(b.c, state), 'pt'));
  const currentCountry = present?.find(c => !state.votes?.[c.c]);

  // Calculate majority requirement dynamically
  let req = 0;
  let resultText = '';
  let resultClass = '';

  if (config.type === 'procedimental') {
    const p = calculatePresence(state);
    req = p > 0 ? Math.floor(p / 2) + 1 : 0;
    if (totalYes >= req) { resultText = 'APROVADA'; resultClass = 'pass'; }
    else { resultText = 'REJEITADA'; resultClass = 'fail'; }
  } else {
    if (config.majority === 'simples') {
      const p = calculatePresence(state);
      req = p > 0 ? Math.floor(p / 2) + 1 : 0;
      if (totalYes >= req) { resultText = 'APROVADA'; resultClass = 'pass'; }
      else { resultText = 'REJEITADA'; resultClass = 'fail'; }
    } else if (config.majority === 'qualificada') {
      req = calculateMajority(state);
      if (req !== '—' && totalYes >= req) { resultText = 'APROVADA'; resultClass = 'pass'; }
      else { resultText = 'REJEITADA'; resultClass = 'fail'; }
    } else if (config.majority === 'csnu') {
      req = 9;
      // CSNU Veto check
      const csnuMembers = ['China', 'Estados Unidos', 'França', 'Reino Unido', 'Rússia'];
      let veto = false;
      csnuMembers.forEach(c => {
        if (['con', 'cdr'].includes(state.votes?.[c])) veto = true;
      });
      if (veto) { resultText = 'VETADA'; resultClass = 'fail'; }
      else if (totalYes >= req) { resultText = 'APROVADA'; resultClass = 'pass'; }
      else { resultText = 'REJEITADA'; resultClass = 'fail'; }
    } else if (config.majority === 'consenso') {
      if (totalNo === 0 && totalYes > 0) { resultText = 'APROVADA'; resultClass = 'pass'; }
      else { resultText = 'REJEITADA'; resultClass = 'fail'; }
    }
  }

  return (
    <div className="v-view v-vote">
      <div className="v-title-bar">Painel de Votação</div>
      <div className="v-vote-content">
        <div className="v-vote-header">
          <h2>{config.type === 'procedimental' ? 'Votação Procedimental' : 'Votação Substancial'}</h2>
          <div className="v-vote-req">
            Requisito: {config.majority === 'simples' ? 'Maioria Simples' : config.majority === 'qualificada' ? 'Maioria Qualificada (2/3)' : config.majority === 'csnu' ? 'CSNU' : 'Consenso'}
            {req > 0 && ` (${req} votos)`}
          </div>
        </div>

        {currentCountry && (
          <div className="v-vote-current-country" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--v-muted)' }}>Voto Atual</h3>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '24px', background: 'rgba(255,255,255,0.05)', padding: '16px 32px', borderRadius: '16px' }}>
              <Flag code={currentCountry.c} fallback={currentCountry.f} iso={currentCountry.i} size={64} />
              <span style={{ fontSize: '48px', fontWeight: 'bold' }}>{dispName(currentCountry.c, state)}</span>
            </div>
          </div>
        )}

        <div className="v-vote-tally">
          <div className="v-vt-box yes">
            <div className="v-vt-label">SIM</div>
            <div className="v-vt-num">{totalYes}</div>
          </div>
          <div className="v-vt-box no">
            <div className="v-vt-label">NÃO</div>
            <div className="v-vt-num">{totalNo}</div>
          </div>
          <div className="v-vt-box abs">
            <div className="v-vt-label">ABSTENÇÃO</div>
            <div className="v-vt-num">{totalAbs}</div>
          </div>
        </div>

        <div className={`v-vote-result ${resultClass}`}>
          {resultText}
        </div>
      </div>
    </div>
  );
}

function MotionsView({ state }) {
  const ML = { unmod: 'Sessão Não-Moderada', mod: 'Sessão Moderada', vote: 'Votação de Documento', recess: 'Recesso', other: 'Outra' };

  return (
    <div className="v-view v-motions">
      <div className="v-title-bar">Moções Propostas</div>
      <div className="v-motions-content" style={{ overflowY: 'auto', flex: 1, paddingRight: '16px' }}>
        {(!state.motions || state.motions.length === 0) ? (
          <div className="v-empty">Nenhuma moção no momento</div>
        ) : (
          <div className="v-motions-grid">
            {state.motions.map((m, i) => (
              <div key={i} className={`v-motion-card ${m.status === 'approved' ? 'approved' : m.status === 'rejected' ? 'rejected' : ''}`}>
                <div className="v-motion-proposer">
                  <Flag code={m.prop} size={24} /> <span>{dispName(m.prop, state)}</span>
                </div>
                <div className="v-motion-type">{ML[m.type] || m.type}</div>
                {(m.dur || m.spk) && (
                  <div className="v-motion-details">
                    {[m.dur ? `${m.dur} min` : '', m.spk ? `${m.spk}s/orador` : ''].filter(Boolean).join(' · ')}
                  </div>
                )}
                {m.subj && <div className="v-motion-subj">"{m.subj}"</div>}

                <div className={`v-motion-status ${m.status}`}>
                  {m.status === 'approved' ? 'APROVADA' : m.status === 'rejected' ? 'REJEITADA' : 'PENDENTE'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PresenceView({ state, lastPresenceChange }) {
  const total = state.committeeCountries?.length || 0;
  const present = state.committeeCountries?.filter(c => state.presence[c.c] !== 'ausente').length || 0;

  useEffect(() => {
    if (lastPresenceChange) {
      const el = document.getElementById(`v-pres-${lastPresenceChange}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [lastPresenceChange]);

  return (
    <div className="v-view v-presence">
      <div className="v-title-bar">Chamada e Presença</div>
      <div className="v-presence-summary">
        <div>Total de Membros: <strong>{total}</strong></div>
        <div>Membros Presentes: <strong>{present}</strong></div>
      </div>
      <div className="v-presence-grid">
        {state.committeeCountries?.map(c => {
          const st = state.presence[c.c] || 'ausente';
          const label = st === 'presente' ? 'Presente' : st === 'presente-votante' ? 'Pres. e Votando' : 'Ausente';
          const stClass = st === 'ausente' ? 'st-absent' : 'st-present';

          return (
            <div key={c.c} id={`v-pres-${c.c}`} className={`v-presence-card ${stClass} ${lastPresenceChange === c.c ? 'pulse' : ''}`}>
              <Flag code={c.c} fallback={c.f} iso={c.i} size={40} />
              <div className="v-pc-info">
                <div className="v-pc-name">{dispName(c.c, state)}</div>
                <div className="v-pc-status">{label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
