import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { sessionSync } from './sessionSync.js';
const logoUrl = '/simsd-square.svg';
import './collaboration.css';
import licensesText from './opensource-licenses.md?raw';
async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || 'Erro na requisição.');
  return data;
}

function roleLabel(role) {
  return { admin: 'Admin', simsd_tools: 'SimSD Tools', student: 'Estudante' }[role] || role;
}

function LoginScreen({ config, onVisitor }) {
  const devLogin = async role => {
    await api('/api/dev/login', { method: 'POST', body: JSON.stringify({ role, suffix: `${role}-${Date.now()}` }) });
    location.reload();
  };
  return <div className="portal-overlay auth-screen">
    <div className="portal-card auth-card">
      <img src={logoUrl} alt="Sim SD" />
      <h1>SimSD Chair</h1>
      <p>Continue conectado ao Portal SimSD ou use todos os recursos localmente, sem conta e sem sincronização.</p>
      <div className="auth-actions">
        <button className="visitor-button" onClick={onVisitor}><span className="material-icons">person_outline</span><span><strong>Entrar como visitante</strong><small>100% local neste dispositivo</small></span></button>
        {config.oauthConfigured
          ? <a className="portal-primary simsd-login" href="/auth/login"><span className="material-icons">login</span>Continuar com SimSD</a>
          : <button className="portal-primary simsd-login" disabled title="OAuth ainda não configurado"><span className="material-icons">login</span>Continuar com SimSD</button>}
      </div>
      {!config.oauthConfigured && <div className="portal-warning">OAuth ainda não foi configurado no servidor.</div>}
      {config.devAuth && <div className="dev-auth">
        <span>Login local de testes</span>
        <div><button onClick={() => devLogin('admin')}>Admin</button><button onClick={() => devLogin('simsd_tools')}>Tools</button><button onClick={() => devLogin('student')}>Estudante</button></div>
      </div>}
    </div>
  </div>;
}

function AdminDashboard({ onClose }) {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const liveReportTimers = useRef(new Set());
  const load = useCallback(() => api('/api/admin/rooms').then(data => setRooms(data.rooms)).catch(err => setError(err.message)), []);
  const deleteRoom = async (room) => {
    if (!confirm(`Tem certeza que deseja deletar a sala "${room.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api(`/api/admin/rooms/${room.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => { load(); const timer = setInterval(load, 5000); return () => clearInterval(timer); }, [load]);
  useEffect(() => () => { for (const timer of liveReportTimers.current) clearInterval(timer); }, []);
  const openReport = (room, type) => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) { setError('Permita pop-ups para abrir o relatório.'); return; }
    reportWindow.document.title = 'Carregando relatório…';
    
    if (type === 'partial') {
      let ws;
      let currentState = null;

      const render = () => {
        if (reportWindow.closed) {
          if (ws) ws.close();
          return;
        }
        if (!currentState) return;
        try {
          const html = window.SimSDController?.buildReportHTML(currentState, { type, room });
          if (!html) return;
          
          if (reportWindow.document.body && reportWindow.document.body.innerHTML) {
            const scrollY = reportWindow.scrollY;
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            reportWindow.document.body.innerHTML = doc.body.innerHTML;
            reportWindow.scrollTo(0, scrollY);
          } else {
            reportWindow.document.write(html);
            reportWindow.document.close();
          }
        } catch (err) {
          console.error('Erro ao gerar relatório:', err);
        }
      };

      const connect = () => {
        const wsUrl = new URL(`/ws?roomId=${room.id}&mode=viewer`, window.location.href);
        wsUrl.protocol = wsUrl.protocol.replace('http', 'ws');
        ws = new WebSocket(wsUrl.href);
        
        ws.onmessage = (e) => {
          if (reportWindow.closed) { ws.close(); return; }
          const msg = JSON.parse(e.data);
          if (msg.type === 'state:init' || msg.type === 'state:update') {
            currentState = msg.state;
            render();
          }
        };
      };
      connect();
      
      const timer = setInterval(() => {
        if (reportWindow.closed) {
          clearInterval(timer);
          liveReportTimers.current.delete(timer);
          if (ws) ws.close();
        }
      }, 1000);
      liveReportTimers.current.add(timer);
    } else {
      let updating = false;
      const update = async () => {
        if (reportWindow.closed || updating) return;
        updating = true;
        try {
          const data = await api(`/api/admin/rooms/${room.id}/report?type=${type}`);
          const html = window.SimSDController?.buildReportHTML(data.state, { type, room: data.room });
          if (!html) throw new Error('Gerador de relatório indisponível.');
          reportWindow.document.write(html);
          reportWindow.document.close();
        } catch (err) {
          setError(err.message);
        } finally { updating = false; }
      };
      update();
    }
  };
  return <div className="portal-overlay admin-overlay">
    <div className="admin-shell">
      <div className="admin-head"><div><h1>Painel administrativo</h1><p>Acompanhamento das sessões em tempo real</p></div><button onClick={onClose}>Voltar às salas</button></div>
      {error && <div className="portal-error">{error}</div>}
      <div className="admin-room-grid">{rooms.map(room => <article key={room.id}>
        <div><span className={`room-state ${room.status}`}>{room.status === 'open' ? 'Em andamento' : 'Encerrada'}</span><code>{room.code}</code></div>
        <h2>{room.name}</h2><p>Responsável: {room.owner.name} · {room.memberCount} participante(s)</p>
        <div className="room-actions"><button onClick={() => openReport(room, 'partial')}>Relatório parcial</button>{room.status === 'closed' && <button onClick={() => openReport(room, 'final')}>Relatório final</button>}<button onClick={() => deleteRoom(room)} style={{ color: '#d9534f', borderColor: '#d9534f' }}>Deletar</button></div>
      </article>)}</div>
    </div>
  </div>;
}

function MembersModal({ room, onClose }) {
  const [members, setMembers] = useState([]);
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(() => api(`/api/rooms/${room.id}/members`).then(data => setMembers(data.members)), [room.id]);
  useEffect(() => { load(); }, [load]);
  const add = async event => {
    event.preventDefault();
    try {
      await api(`/api/rooms/${room.id}/members`, { method: 'POST', body: JSON.stringify({ identifier }) });
      setIdentifier(''); setMessage('Usuário adicionado.'); load();
    } catch (err) { setMessage(err.message); }
  };
  return <div className="portal-modal-backdrop"><div className="portal-modal members-modal">
    <div className="portal-modal-head"><div><h2>Pessoas na sala</h2><p>{room.name}</p></div><button onClick={onClose}>Fechar</button></div>
    <form onSubmit={add}><input value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="E-mail, login ou ID do portal" required /><button className="portal-primary">Adicionar</button></form>
    {message && <p className="member-message">{message}</p>}
    <ul>{members.map(member => <li key={member.id}><span>{member.name} {member.isOnline && <span title="Online" style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#4caf50',marginLeft:6}}></span>}<small>{member.email || member.login}</small></span><b>{roleLabel(member.role)}</b></li>)}</ul>
  </div></div>;
}

function LicensesModal({ onClose }) {
  return <div className="portal-modal-backdrop"><div className="portal-modal licenses-modal" style={{ maxWidth: 800, width: '90%', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
    <div className="portal-modal-head"><div><h2>Licenças Open Source</h2></div><button onClick={onClose}>Fechar</button></div>
    <div className="licenses-content" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13, padding: '16px 0', flex: 1, overflowY: 'auto' }}>
      {licensesText}
    </div>
  </div></div>;
}

function Lobby({ user, onEnterRoom }) {
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState('');
  const [committeeKey, setCommitteeKey] = useState('unodc');
  const [adminOpen, setAdminOpen] = useState(false);
  const [membersRoom, setMembersRoom] = useState(null);
  const [licensesOpen, setLicensesOpen] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(() => api('/api/rooms').then(data => setRooms(data.rooms)).catch(err => setError(err.message)), []);
  useEffect(() => { load(); const timer = setInterval(load, 5000); return () => clearInterval(timer); }, [load]);
  const createRoom = async event => {
    event.preventDefault();
    try {
      const { room } = await api('/api/rooms', { method: 'POST', body: JSON.stringify({ name, committeeKey }) });
      setName(''); await load(); onEnterRoom(room);
    } catch (err) { setError(err.message); }
  };
  const logoutNow = async () => { await api('/api/logout', { method: 'POST' }); location.reload(); };
  return <div className="portal-overlay lobby-screen">
    <div className="lobby-shell">
      <header><div className="lobby-brand"><img src={logoUrl} alt="Sim SD" /><div><h1>Salas SimSD Chair</h1><p>Sincronização ao vivo entre chairs e delegados</p></div></div><div className="user-menu"><span><strong>{user.name}</strong><small>{roleLabel(user.role)}</small></span>{user.role === 'admin' && <button onClick={() => setAdminOpen(true)}>Painel admin</button>}<button onClick={logoutNow}>Sair</button></div></header>
      {error && <div className="portal-error">{error}</div>}
      <div className="lobby-columns">
        {user.role !== 'student' && <section className="create-room"><h2>Criar uma sala</h2><form onSubmit={createRoom}><label>Nome da sessão<input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: UNESCO — Sessão 1" required /></label><label>Comitê<select value={committeeKey} onChange={e => setCommitteeKey(e.target.value)}><option value="camara">Câmara dos Deputados</option><option value="unodc">UNODC</option><option value="oea">OEA</option><option value="unesco">UNESCO</option></select></label><button className="portal-primary">Criar e entrar</button></form></section>}
        <section className="rooms-list" style={{ gridColumn: user.role === 'student' ? '1 / -1' : undefined }}><div className="section-head"><div><h2>Salas disponíveis</h2><p>{user.role === 'simsd_tools' ? 'Você pode entrar em qualquer sala aberta.' : 'Salas criadas por você ou para as quais foi adicionado.'}</p></div><button onClick={load}>Atualizar</button></div>
          <div className="room-list-grid">{rooms.length ? rooms.map(room => <article key={room.id}><div className="room-card-head"><span className={`room-state ${room.status}`}>{room.status === 'open' ? 'Aberta' : 'Encerrada'}</span><code>{room.code}</code></div><h3>{room.name}</h3><p>{room.owner.name}</p><div className="room-actions"><button className="portal-primary" onClick={() => onEnterRoom(room)}>{room.status === 'open' ? 'Entrar na sala' : 'Visualizar'}</button>{room.canManage && <button onClick={() => setMembersRoom(room)}>Pessoas</button>}</div></article>) : <div className="empty-rooms">Nenhuma sala disponível ainda.</div>}</div>
        </section>
      </div>
      <footer style={{ textAlign: 'center', padding: '24px 0', marginTop: 'auto', color: '#666' }}>
        <button onClick={() => setLicensesOpen(true)} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: 'inherit', fontSize: '0.9em' }}>Licenças Open Source</button>
      </footer>
    </div>
    {adminOpen && <AdminDashboard onClose={() => setAdminOpen(false)} />}
    {membersRoom && <MembersModal room={membersRoom} onClose={() => setMembersRoom(null)} />}
    {licensesOpen && <LicensesModal onClose={() => setLicensesOpen(false)} />}
  </div>;
}

function RoomBar({ room, user, onLeave }) {
  const [status, setStatus] = useState(room.status === 'closed' ? 'closed' : 'connecting');
  const [count, setCount] = useState(1);
  const [membersOpen, setMembersOpen] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => sessionSync.subscribe(event => {
    if (event.type === 'status') setStatus(event.status);
    if (event.type === 'presence') setCount(event.count);
    if (event.type === 'remote-update') setMessage(`Atualizado por ${event.user?.name || 'outro usuário'}`);
    if (event.type === 'closed') { setStatus('closed'); setMessage('Sessão encerrada. Relatório final disponível para admins.'); }
    if (event.type === 'error') setMessage(event.message);
  }), []);
  useEffect(() => {
    document.body.classList.toggle('room-readonly', status === 'closed');
    return () => document.body.classList.remove('room-readonly');
  }, [status]);
  const content = <><div className="mobile-room-warning"><span className="material-icons" style={{fontSize: 48, marginBottom: 16}}>warning</span><h2>Dispositivo incompatível</h2><p>O painel da sala não é suportado em dispositivos móveis. Acesse por um computador.</p><button className="portal-primary" onClick={onLeave}>Voltar às salas</button></div><div className="room-bar"><span className={`sync-dot ${status}`}></span><div><strong>{room.name}</strong><small>{room.code} · {count} conectado(s){message ? ` · ${message}` : ''}</small></div>{room.canManage && <button onClick={() => setMembersOpen(true)}>Pessoas</button>}<button onClick={onLeave}>Sair da sala</button></div>{membersOpen && <MembersModal room={room} onClose={() => setMembersOpen(false)} />}</>;
  const slot = document.getElementById('room-bar-slot');
  return slot ? createPortal(content, slot) : content;
}

function VisitorBar({ onExit }) {
  const content = <><div className="mobile-room-warning"><span className="material-icons" style={{fontSize: 48, marginBottom: 16}}>warning</span><h2>Dispositivo incompatível</h2><p>O painel da sala não é suportado em dispositivos móveis. Acesse por um computador.</p><button className="portal-primary" onClick={onExit}>Sair do modo visitante</button></div><div className="room-bar visitor-bar"><span className="material-icons visitor-icon">person_outline</span><div><strong>Modo visitante</strong><small>Offline · dados salvos somente neste dispositivo</small></div><button onClick={onExit}>Sair do modo visitante</button></div></>;
  const slot = document.getElementById('room-bar-slot');
  return slot ? createPortal(content, slot) : content;
}

export default function PortalShell() {
  const [visitor, setVisitor] = useState(() => localStorage.getItem('simsd-visitor-mode') === '1');
  const [config, setConfig] = useState(null);
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [room, setRoom] = useState(null);
  useEffect(() => {
    window.SimSDOfflineMode = visitor;
    if (visitor) { setConfig({ oauthConfigured: false, devAuth: false }); setChecked(true); return; }
    Promise.all([api('/api/config'), fetch('/api/me').then(async response => response.ok ? (await response.json()).user : null)])
      .then(([appConfig, currentUser]) => { setConfig(appConfig); setUser(currentUser); setChecked(true); })
      .catch(() => setChecked(true));
  }, [visitor]);
  const enterVisitor = () => { localStorage.setItem('simsd-visitor-mode', '1'); window.SimSDOfflineMode = true; window.SimSDController?.setRoomContext(null); setVisitor(true); };
  const exitVisitor = () => { localStorage.removeItem('simsd-visitor-mode'); window.SimSDOfflineMode = false; location.reload(); };
  const enterRoom = selectedRoom => { setRoom(selectedRoom); sessionSync.open(selectedRoom); };
  const leaveRoom = () => { sessionSync.close(); window.SimSDController?.setRoomContext(null); setRoom(null); };
  const content = useMemo(() => {
    if (!checked || !config) return <div className="portal-overlay portal-loading">Carregando…</div>;
    if (visitor) return <VisitorBar onExit={exitVisitor} />;
    if (!user) return <LoginScreen config={config} onVisitor={enterVisitor} />;
    if (!room) return <Lobby user={user} onEnterRoom={enterRoom} />;
    return <RoomBar room={room} user={user} onLeave={leaveRoom} />;
  }, [checked, config, user, room, visitor]);
  return content;
}
