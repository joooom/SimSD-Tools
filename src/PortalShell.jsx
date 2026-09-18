import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { sessionSync } from './sessionSync.js';
const logoUrl = '/simsd-square.svg';
import './collaboration.css';
import licensesText from './opensource-licenses.md?raw';
import GeneralNotes from './GeneralNotes.jsx';
import Rubrics from './Rubrics.jsx';
import HelpRequest from './HelpRequest.jsx';
import { AdminHelp, useHelpTickets } from './HelpChat.jsx';
import PendingImport from './PendingImport.jsx';
import { COMMITTEE_NAMES } from './evaluationCriteria.js';
import './admin.css';
import { createNavigation, parseRoute, restoredRoomTab } from './navigation.js';
let navigation;
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

async function downloadLlmReport(room) {
  if (sessionSync.room?.id === room.id) await sessionSync.flushPending();
  const response = await fetch(`/api/admin/rooms/${room.id}/llm-report`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Não foi possível exportar o relatório.');
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio-avaliativo-llm-${room.code}.xml`;
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
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
          ? <a className="portal-primary simsd-login" onClick={() => { try { sessionStorage.setItem('simsd-return-route', navigation.getSnapshot()); } catch {} }} href="/auth/login"><span className="material-icons">login</span>Continuar com SimSD</a>
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

function AdminDashboard({ onClose, section, setSection, user, ticketId }) {
  const help = useHelpTickets();
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [committeeFilter, setCommitteeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingRoom, setPendingRoom] = useState(null);
  const [error, setError] = useState('');
  const liveReportTimers = useRef(new Set());
  const reopenRoom = async room => {
    setPendingRoom(room.id); setError('');
    try { await api(`/api/rooms/${room.id}/reopen`, { method: 'POST' }); await load(); }
    catch (err) { setError(err.message); }
    finally { setPendingRoom(null); }
  };
  const load = useCallback(() => api('/api/admin/rooms').then(data => setRooms(data.rooms)).catch(err => setError(err.message)).finally(() => setLoading(false)), []);
  const deleteRoom = async (room) => {
    if (!confirm(`Tem certeza que deseja deletar a sala "${room.name}"? Esta ação não pode ser desfeita.`)) return;
    setPendingRoom(room.id); setError('');
    try {
      await api(`/api/admin/rooms/${room.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    } finally { setPendingRoom(null); }
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
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const visibleRooms = rooms.filter(room => (!statusFilter || room.status === statusFilter) && (!committeeFilter || room.committeeKey === committeeFilter) && normalize(`${room.name} ${room.code} ${room.owner.name} ${COMMITTEE_NAMES[room.committeeKey] || ''}`).includes(normalize(search.trim())));
  const openCount = rooms.filter(room => room.status === 'open').length;
  return <div className="portal-overlay admin-overlay">
    <div className="admin-shell">
      <div className="admin-head"><div><span className="admin-eyebrow">SIMSD · ADMINISTRAÇÃO</span><h1>Painel administrativo</h1><p>Salas, relatórios e recuperação de alterações em um só lugar.</p></div><button onClick={onClose}><span className="material-icons" aria-hidden="true">arrow_back</span>Voltar às salas</button></div>
      <div className="admin-overview" aria-label="Resumo das salas">{[['', 'Todas as salas', rooms.length, 'meeting_room'], ['open', 'Em andamento', openCount, 'sensors'], ['closed', 'Encerradas', rooms.length - openCount, 'task_alt']].map(([value, label, count, icon]) => <button key={value} className={section === 'rooms' && statusFilter === value ? 'selected' : ''} aria-pressed={section === 'rooms' && statusFilter === value} onClick={() => { setSection('rooms'); setStatusFilter(value); }}><span className="material-icons" aria-hidden="true">{icon}</span><span>{label}<strong>{loading ? '—' : count}</strong></span></button>)}</div>
      <nav className="admin-nav" aria-label="Áreas administrativas"><button aria-pressed={section === 'rooms'} onClick={() => setSection('rooms')}>Gerenciar salas</button><button aria-pressed={section === 'import'} onClick={() => setSection('import')}><span className="material-icons" aria-hidden="true">upload_file</span>Importar pendências</button><button aria-pressed={section === 'help'} onClick={() => setSection('help')}><span className="material-icons" aria-hidden="true">support_agent</span>Pedidos de ajuda{help.unread > 0 && <span className="help-badge">{help.unread}</span>}</button></nav>
      {error && <div className="portal-error" role="alert">{error}<button onClick={() => { setError(''); load(); }}>Tentar novamente</button></div>}
      {section === 'help' && <AdminHelp tickets={help.tickets} error={help.error} user={user} selected={ticketId} onSelect={id => navigation.navigate(`#/admin/ajuda/${id}`)} refresh={help.refresh} />}
      <div hidden={section !== 'import'} className="admin-import-area"><PendingImport onImported={load} /></div>
      <section hidden={section !== 'rooms'} aria-label="Gerenciar salas">
        <div className="admin-toolbar"><label className="admin-search">Buscar sala<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome, código ou responsável" /></label><label>Comitê<select value={committeeFilter} onChange={event => setCommitteeFilter(event.target.value)}><option value="">Todos os comitês</option>{Object.entries(COMMITTEE_NAMES).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label><label>Status<select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">Todos</option><option value="open">Em andamento</option><option value="closed">Encerradas</option></select></label></div>
        <div className="admin-results"><span>{loading ? 'Carregando salas…' : `${visibleRooms.length} sala(s) encontrada(s)`}</span><span>Atualização automática · 5 s</span></div>
        {!loading && !visibleRooms.length && <div className="admin-empty"><span className="material-icons" aria-hidden="true">search_off</span><h2>{rooms.length ? 'Nenhuma sala corresponde à busca' : 'Nenhuma sala criada ainda'}</h2><p>{rooms.length ? 'Tente outro nome ou ajuste os filtros.' : 'As salas aparecerão aqui assim que forem criadas.'}</p>{rooms.length > 0 && <button onClick={() => { setSearch(''); setStatusFilter(''); setCommitteeFilter(''); }}>Limpar filtros</button>}</div>}
        <div className="admin-room-grid">{visibleRooms.map(room => <article key={room.id} aria-label={room.name}>
          <div className="admin-card-top"><span className={`room-state ${room.status}`}>{room.status === 'open' ? 'Em andamento' : 'Encerrada'}</span><code title="Código da sala">{room.code}</code></div>
          <span className="admin-committee">{COMMITTEE_NAMES[room.committeeKey] || room.committeeKey}</span><h2>{room.name}</h2>
          <dl className="admin-card-meta"><div><dt>Responsável</dt><dd>{room.owner.name}</dd></div><div><dt>Participantes</dt><dd>{room.memberCount}</dd></div></dl>
          <div className="admin-card-actions"><button className="portal-primary" onClick={() => openReport(room, room.status === 'closed' ? 'final' : 'partial')}><span className="material-icons" aria-hidden="true">description</span>{room.status === 'closed' ? 'Abrir relatório final' : 'Abrir relatório ao vivo'}</button><button onClick={() => downloadLlmReport(room).catch(err => setError(err.message))}>Baixar XML para avaliação</button></div>
          <div className="admin-card-footer">{room.status === 'closed' ? <button disabled={pendingRoom === room.id} onClick={() => reopenRoom(room)}>{pendingRoom === room.id ? 'Aguarde…' : 'Reabrir sala'}</button> : <span className="admin-live-label">Sessão em andamento</span>}<details className="admin-more"><summary>Mais ações</summary><div>{room.status === 'closed' && <button onClick={() => openReport(room, 'partial')}>Relatório parcial</button>}<button className="admin-danger" disabled={pendingRoom === room.id} onClick={() => deleteRoom(room)}>Excluir sala</button></div></details></div>
        </article>)}</div>
      </section>
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
    {room.status !== 'closed' && <form onSubmit={add}><input value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="E-mail, login ou ID do portal" required /><button className="portal-primary">Adicionar</button></form>}
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

function Lobby({ user, onEnterRoom, route }) {
  const area = ['notes', 'rubrics'].includes(route.page) ? route.page : 'rooms';
  const setArea = area => navigation.navigate({ rooms: '#/salas', notes: '#/notas', rubrics: '#/rubricas' }[area]);
  const adminOpen = route.page === 'admin' && user.role === 'admin';
  const setAdminOpen = open => navigation.navigate(open ? '#/admin/salas' : '#/salas');
  const canUseGeneralNotes = ['admin', 'simsd_tools'].includes(user.role);
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState('');
  const [committeeKey, setCommitteeKey] = useState('unodc');
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
      {canUseGeneralNotes && <nav className="lobby-area-nav" aria-label="Áreas do painel"><button aria-pressed={area === 'rooms'} onClick={() => setArea('rooms')}>Salas</button><button aria-pressed={area === 'notes'} onClick={() => setArea('notes')}>Notas gerais</button><button aria-pressed={area === 'rubrics'} onClick={() => setArea('rubrics')}>Rubricas</button></nav>}
      {canUseGeneralNotes && area === 'notes' && <GeneralNotes />}
      {canUseGeneralNotes && area === 'rubrics' && <Rubrics />}
      {area === 'rooms' && <div className="lobby-columns">
        {user.role !== 'student' && <section className="create-room"><h2>Criar uma sala</h2><form onSubmit={createRoom}><label>Nome da sessão<input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: UNESCO — Sessão 1" required /></label><label>Comitê<select value={committeeKey} onChange={e => setCommitteeKey(e.target.value)}><option value="camara">Câmara dos Deputados</option><option value="unodc">UNODC</option><option value="oea">OEA</option><option value="unesco">UNESCO</option></select></label><button className="portal-primary">Criar e entrar</button></form></section>}
        <section className="rooms-list" style={{ gridColumn: user.role === 'student' ? '1 / -1' : undefined }}><div className="section-head"><div><h2>Salas disponíveis</h2><p>{user.role === 'simsd_tools' ? 'Você pode entrar em qualquer sala aberta.' : 'Salas criadas por você ou para as quais foi adicionado.'}</p></div><button onClick={load}>Atualizar</button></div>
          <div className="room-list-grid">{rooms.length ? rooms.map(room => <article key={room.id}><div className="room-card-head"><span className={`room-state ${room.status}`}>{room.status === 'open' ? 'Aberta' : 'Encerrada'}</span><code>{room.code}</code></div><h3>{room.name}</h3><p>{room.owner.name}</p><div className="room-actions"><button className="portal-primary" onClick={() => onEnterRoom(room)}>{room.status === 'open' ? 'Entrar na sala' : 'Visualizar'}</button>{room.canManage && <button onClick={() => setMembersRoom(room)}>Pessoas</button>}</div></article>) : <div className="empty-rooms">Nenhuma sala disponível ainda.</div>}</div>
        </section>
      </div>}
      <footer style={{ textAlign: 'center', padding: '24px 0', marginTop: 'auto', color: '#666' }}>
        <button onClick={() => setLicensesOpen(true)} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: 'inherit', fontSize: '0.9em' }}>Licenças Open Source</button>
      </footer>
    </div>
    {adminOpen && <AdminDashboard onClose={() => setAdminOpen(false)} user={user} ticketId={route.ticketId} section={route.section || 'rooms'} setSection={section => navigation.navigate({ import: '#/admin/pendencias', help: '#/admin/ajuda', rooms: '#/admin/salas' }[section])} />}
    {membersRoom && <MembersModal room={membersRoom} onClose={() => setMembersRoom(null)} />}
    {licensesOpen && <LicensesModal onClose={() => setLicensesOpen(false)} />}
  </div>;
}

function RoomBar({ room, user, onLeave }) {
  const [authRequired, setAuthRequired] = useState(false);
  const [status, setStatus] = useState(sessionSync.status);
  const [pending, setPending] = useState(sessionSync.showRecoveryActions);
  const [conflicts, setConflicts] = useState(sessionSync.conflict?.conflicts || []);
  const [count, setCount] = useState(1);
  const [membersOpen, setMembersOpen] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => sessionSync.subscribe(event => {
    setPending(sessionSync.showRecoveryActions);
    setConflicts(sessionSync.conflict?.conflicts || []);
    if (event.type === 'status') {
      setStatus(event.status);
      if (event.status === 'connected') { setMessage('Conectado ao vivo.'); setAuthRequired(false); }
      if (event.status === 'disconnected') { setCount(0); setMessage('Reconectando à sala…'); }
      if (event.status === 'connecting') setMessage('Conectando à sala…');
    }
    if (event.type === 'presence') setCount(event.count);
    if (event.type === 'saved' && sessionSync.status === 'connected') setMessage('Conectado ao vivo.');
    if (event.type === 'remote-update') setMessage(`Atualizado por ${event.user?.name || 'outro usuário'}`);
    if (event.type === 'closed') { setStatus('closed'); setMessage(event.pending ? 'Sala encerrada com alterações não confirmadas. Baixe uma cópia antes de sair.' : 'Sessão encerrada. Relatório final disponível para admins.'); }
    if (event.type === 'reopened') { setStatus(sessionSync.status); setMessage('Sala reaberta pelo admin.'); }
    if (event.type === 'error') { setMessage(event.message); if (event.code === 'auth_required') setAuthRequired(true); }
  }), []);

  const content = <><div className="mobile-room-warning"><span className="material-icons" style={{fontSize: 48, marginBottom: 16}}>warning</span><h2>Dispositivo incompatível</h2><p>O painel da sala não é suportado em dispositivos móveis. Acesse por um computador.</p><button className="portal-primary" onClick={onLeave}>Voltar às salas</button></div><div className="room-bar"><span className={`sync-dot ${status}`}></span><div><strong>{room.name}</strong><small>{room.code} · {count} conectado(s){message ? ` · ${message}` : ''}</small></div>{user.role === 'admin' && sessionSync.room?.status === 'closed' && <button onClick={async () => { try { await api(`/api/rooms/${room.id}/reopen`, { method: 'POST' }); } catch (err) { setMessage(err.message); } }}>Reabrir sala</button>}{room.canManage && <button onClick={() => setMembersOpen(true)}>Pessoas</button>}<button onClick={onLeave}>Sair da sala</button></div>{membersOpen && <MembersModal room={room} onClose={() => setMembersOpen(false)} />}</>;
  const syncControls = <>
    {authRequired && <div className="portal-modal-backdrop"><div className="portal-modal" role="dialog" aria-modal="true" aria-label="Entrar novamente"><h2>É necessário entrar novamente</h2><p>Abra o login em outra aba. Mantenha esta sala aberta para preservar as alterações; ela tentará reconectar automaticamente depois do login. Se o acesso à sala foi removido, peça ao responsável para restaurá-lo.</p><a className="portal-primary" href="/auth/login" target="_blank" rel="noopener noreferrer">Abrir login em outra aba</a><button onClick={() => setAuthRequired(false)}>Voltar à sala</button>{sessionSync.dirty && <button onClick={() => sessionSync.downloadPending()}>Baixar cópia das alterações</button>}</div></div>}
    {pending && <div className="sync-pending" role="status">{sessionSync.persisted && sessionSync.showLocalWarning ? 'Alterações guardadas neste dispositivo' : 'Alterações não confirmadas — baixe uma cópia antes de sair'}<button onClick={() => sessionSync.downloadPending()}>Baixar cópia local</button><button onClick={() => onLeave({ discardPending: true })}>Descartar pendências e sair</button></div>}
    {conflicts.length > 0 && <div className="portal-modal-backdrop"><div className="portal-modal sync-conflicts" role="dialog" aria-modal="true" aria-label="Conflitos de sincronização">
      <h2>Alterações simultâneas</h2><p>A sala e este dispositivo alteraram os mesmos dados. As demais alterações serão combinadas automaticamente. Escolha quais valores usar nos conflitos abaixo.</p>
      <div className="sync-conflict-list">{conflicts.map((conflict, index) => <div key={index}><strong>{({ notes: 'Nota', events: 'Acontecimento', config: 'Configuração', agenda: 'Agenda', presence: 'Presença', votes: 'Voto', motions: 'Moção', speakers: 'Lista de oradores', timer: 'Cronômetro', speeches: 'Discursos', speakTime: 'Tempo de fala' })[conflict.path.split('.')[0]] || 'Dados da sessão'}</strong><p>Meu valor: {typeof conflict.local === 'string' ? conflict.local : JSON.stringify(conflict.local) ?? 'Excluído'}</p><p>Valor da sala: {typeof conflict.remote === 'string' ? conflict.remote : JSON.stringify(conflict.remote) ?? 'Excluído'}</p></div>)}</div>
      <div className="room-actions"><button onClick={() => sessionSync.downloadPending()}>Baixar cópia local</button><button onClick={() => sessionSync.resolveConflict('remote')}>Usar valores da sala nos conflitos</button><button onClick={() => sessionSync.resolveConflict('local')}>Usar meus valores nos conflitos</button></div>
    </div></div>}
  </>;
  const slot = document.getElementById('room-bar-slot');
  return <>{slot ? createPortal(content, slot) : content}{createPortal(syncControls, document.body)}</>;
}

function VisitorBar({ onExit }) {
  const content = <><div className="mobile-room-warning"><span className="material-icons" style={{fontSize: 48, marginBottom: 16}}>warning</span><h2>Dispositivo incompatível</h2><p>O painel da sala não é suportado em dispositivos móveis. Acesse por um computador.</p><button className="portal-primary" onClick={onExit}>Sair do modo visitante</button></div><div className="room-bar visitor-bar"><span className="material-icons visitor-icon">person_outline</span><div><strong>Modo visitante</strong><small>Offline · dados salvos somente neste dispositivo</small></div><button onClick={onExit}>Sair do modo visitante</button></div></>;
  const slot = document.getElementById('room-bar-slot');
  return slot ? createPortal(content, slot) : content;
}

async function prepareRoomExit() {
  if (!sessionSync.room) return true;
  try {
    if (sessionSync.dirty && (!sessionSync.ready || sessionSync.conflict || sessionSync.room.status === 'closed')) {
      if (!sessionSync.persist()) throw new Error('Não foi possível guardar a fila. Baixe a cópia local antes de sair.');
    } else await sessionSync.flushPending();
    return true;
  } catch (error) { alert(error.message); return false; }
}

export default function PortalShell() {
  navigation ||= createNavigation(window);
  const hash = useSyncExternalStore(navigation.subscribe, navigation.getSnapshot);
  const route = parseRoute(hash);
  const roomId = route.page === 'room' ? route.roomId : null;
  const [visitor, setVisitor] = useState(() => localStorage.getItem('simsd-visitor-mode') === '1');
  const [config, setConfig] = useState(null);
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [room, setRoom] = useState(null);
  const [roomError, setRoomError] = useState('');
  const [retry, setRetry] = useState(0);
  const restoringTab = useRef(false);
  const initializedRoom = useRef(null);

  useEffect(() => navigation.setGuard(async next => {
    if (sessionSync.room && next.roomId !== sessionSync.room.id) return prepareRoomExit();
    return true;
  }), []);

  useEffect(() => {
    window.SimSDOfflineMode = visitor;
    if (visitor) { setConfig({ oauthConfigured: false, devAuth: false }); setChecked(true); return; }
    Promise.all([api('/api/config'), fetch('/api/me').then(async response => response.ok ? (await response.json()).user : null)])
      .then(([appConfig, currentUser]) => {
        setConfig(appConfig); setUser(currentUser); setChecked(true);
        if (currentUser) {
          try {
            const returnRoute = sessionStorage.getItem('simsd-return-route');
            sessionStorage.removeItem('simsd-return-route');
            if (returnRoute?.startsWith('#/')) navigation.navigate(returnRoute, { replace: true });
          } catch {}
        }
      })
      .catch(() => { setLoadError('Não foi possível carregar o app. Verifique a conexão e tente novamente.'); setChecked(true); });
  }, [visitor]);

  useEffect(() => {
    if (!user || visitor) return;
    const restricted = (route.page === 'admin' && user.role !== 'admin') ||
      (['notes', 'rubrics'].includes(route.page) && !['admin', 'simsd_tools'].includes(user.role)) || route.page === 'visitor';
    if (restricted) navigation.navigate('#/salas', { replace: true });
  }, [hash, user, visitor]);

  // Changing only the tab never tears down or reopens the websocket.
  useEffect(() => {
    if (!user || visitor) return;
    let cancelled = false;
    setRoomError(''); setRoom(null); initializedRoom.current = null;
    if (sessionSync.room) sessionSync.close();
    window.SimSDController?.setRoomContext(null);
    if (roomId) api(`/api/rooms/${roomId}`).then(data => {
      if (cancelled) return;
      setRoom(data.room);
      sessionSync.open(data.room, { userId: user.id });
    }).catch(error => { if (!cancelled) setRoomError(error.message); });
    return () => { cancelled = true; };
  }, [roomId, user?.id, visitor, retry]);

  useEffect(() => {
    const selectTab = tab => {
      if (!tab || document.getElementById(`tb-${tab}`)?.classList.contains('on')) return;
      restoringTab.current = true;
      try { window.switchTab?.(tab); } finally { restoringTab.current = false; }
    };
    const syncTab = () => {
      const current = parseRoute(navigation.getSnapshot());
      if (current.page !== 'room' || sessionSync.room?.id !== current.roomId || initializedRoom.current === current.roomId) return;
      initializedRoom.current = current.roomId;
      const controller = window.SimSDController;
      const tab = restoredRoomTab(current.tab, controller?.projection().tab, {
        independentTabs: controller?.snapshot()?.config?.independentTabs === true,
        closed: sessionSync.room.status === 'closed',
      });
      selectTab(tab);
      navigation.navigate(`#/sala/${current.roomId}/${tab}`, { replace: true });
    };
    const unsubscribe = sessionSync.subscribe(event => {
      if (event.type === 'closed' || event.type === 'status' && event.status === 'connected') syncTab();
    });
    window.SimSDNavigation = {
      tabChanged(tab, remote) {
        if (restoringTab.current) return;
        const current = parseRoute(navigation.getSnapshot());
        if (current.page === 'room' && initializedRoom.current === current.roomId) {
          navigation.navigate(`#/sala/${current.roomId}/${tab}`, { replace: remote, passive: remote });
        } else if (visitor) navigation.navigate(`#/visitante/${tab}`, { replace: remote, passive: remote });
      },
    };
    if (visitor && route.page === 'visitor') selectTab(route.tab);
    if (roomId && initializedRoom.current === roomId) selectTab(route.tab);
    return () => { unsubscribe(); delete window.SimSDNavigation; };
  }, [hash, visitor]);

  const enterVisitor = () => {
    localStorage.setItem('simsd-visitor-mode', '1'); window.SimSDOfflineMode = true;
    window.SimSDController?.setRoomContext(null); setVisitor(true);
    navigation.navigate('#/visitante', { replace: true });
  };
  const exitVisitor = () => {
    localStorage.removeItem('simsd-visitor-mode'); window.SimSDOfflineMode = false;
    history.replaceState(history.state, '', '#/salas'); location.reload();
  };
  const enterRoom = selectedRoom => navigation.navigate(`#/sala/${selectedRoom.id}`);
  const leaveRoom = async (options = {}) => {
    if (options.discardPending === true) {
      if (!window.confirm('Descartar as alterações locais não confirmadas e sair? Baixe uma cópia antes se quiser guardá-las. Dados já recebidos pelo servidor não serão apagados.')) return;
      sessionSync.discardPending();
    }
    await navigation.navigate('#/salas');
  };
  let content;
  if (loadError) content = <div className="portal-overlay portal-loading"><p role="alert">{loadError}</p><button onClick={() => location.reload()}>Tentar novamente</button></div>;
  else if (!checked || !config) content = <div className="portal-overlay portal-loading">Carregando…</div>;
  else if (visitor) content = <VisitorBar onExit={exitVisitor} />;
  else if (!user) content = <LoginScreen config={config} onVisitor={enterVisitor} />;
  else if (roomId && (!room || room.id !== roomId)) content = <div className="portal-overlay portal-loading"><p role={roomError ? 'alert' : undefined}>{roomError || 'Abrindo sala…'}</p>{roomError && <><button onClick={() => setRetry(value => value + 1)}>Tentar novamente</button><button onClick={() => navigation.navigate('#/salas')}>Voltar às salas</button></>}</div>;
  else if (roomId) content = <RoomBar key={`room-bar:${room.id}`} room={room} user={user} onLeave={leaveRoom} />;
  else content = <Lobby user={user} route={route} onEnterRoom={enterRoom} />;
  return <>{content}{user && !visitor && (!roomId || room?.id === roomId) && <HelpRequest key={`help:${roomId || 'lobby'}`} user={user} activeRoom={roomId ? room : null} inRoom={Boolean(roomId && room)} />}</>;
}
