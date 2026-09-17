import React, { useEffect, useRef, useState } from 'react';
import './help-chat.css';

export const helpStatus = { new: 'Novo', active: 'Em atendimento', resolved: 'Resolvido' };
export async function helpApi(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json' }, signal: options.signal || AbortSignal.timeout(15000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.message || 'Não foi possível acessar o atendimento.'), { status: response.status });
  return data;
}
export function useHelpTickets(roomId) {
  const [tickets, setTickets] = useState([]), [error, setError] = useState(''), [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false, timer;
    const controller = new AbortController();
    async function poll() {
      try {
        const data = await helpApi(`/api/help${roomId ? `?roomId=${encodeURIComponent(roomId)}` : ''}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
        if (!cancelled) { setTickets(data.tickets); setError(''); }
      } catch (err) { if (!cancelled) setError(err.message || 'Sem conexão com o atendimento.'); }
      if (!cancelled) timer = setTimeout(poll, 3000);
    }
    poll();
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [roomId, version]);
  return { tickets, error, refresh: () => setVersion(value => value + 1), unread: tickets.reduce((sum, ticket) => sum + ticket.unread, 0) };
}

export function HelpTicketList({ tickets, selected, onSelect }) {
  return <div className="help-ticket-list">{!tickets.length && <p>Nenhum chamado encontrado.</p>}{tickets.map(ticket => <button key={ticket.id} type="button" aria-pressed={selected === ticket.id} onClick={() => onSelect(ticket.id)}>
    <span><strong>Sala {ticket.room}</strong><span className={`help-status ${ticket.status}`}>{helpStatus[ticket.status]}</span></span>
    {ticket.roomName && <small>{ticket.roomName}</small>}<p>{ticket.lastMessage}</p>
    <span><small>{new Date(ticket.updatedAt).toLocaleString('pt-BR')}</small>{ticket.unread > 0 && <b className="help-badge">{ticket.unread} nova(s)</b>}</span>
  </button>)}</div>;
}

export function HelpConversation({ ticketId, user, onChange }) {
  const [ticket, setTicket] = useState(null), [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [connectionError, setConnectionError] = useState('');
  const [hasOlder, setHasOlder] = useState(false), [olderBusy, setOlderBusy] = useState(false);
  const cursor = useRef(0), readCursor = useRef(0), initial = useRef(true), sending = useRef(false), attempt = useRef(null), scroller = useRef(null), stickBottom = useRef(true), alive = useRef(true);
  const change = useRef(onChange); change.current = onChange;
  const merge = rows => setMessages(previous => [...new Map([...previous, ...rows].map(row => [row.id, row])).values()].sort((a, b) => a.id - b.id));
  useEffect(() => {
    alive.current = true;
    let cancelled = false, timer;
    const controller = new AbortController();
    async function poll() {
      try {
        const data = await helpApi(`/api/help/${ticketId}${cursor.current ? `?after=${cursor.current}` : ''}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
        if (cancelled) return;
        setTicket(data.ticket); merge(data.messages); setConnectionError('');
        if (initial.current) { setHasOlder(data.hasMore); initial.current = false; }
        if (data.messages.length) cursor.current = data.messages.at(-1).id;
        if (cursor.current > readCursor.current && document.visibilityState === 'visible' && document.hasFocus() && stickBottom.current) {
          const lastSeen = cursor.current;
          await helpApi(`/api/help/${ticketId}/read`, { method: 'POST', body: JSON.stringify({ messageId: lastSeen }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
          readCursor.current = lastSeen; if (!cancelled) change.current?.();
        }
      } catch (err) {
        if (!cancelled) setConnectionError(err.status === 401 ? 'Seu login expirou. Entre novamente no app para continuar o atendimento.' : err.status ? err.message : 'Conexão indisponível. Tentando novamente; seu texto permanece no campo.');
        if ([403, 404].includes(err.status)) return;
      }
      if (!cancelled) timer = setTimeout(poll, 2500);
    }
    poll();
    return () => { alive.current = false; cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [ticketId]);
  useEffect(() => { if (stickBottom.current && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [messages]);
  async function send(event) {
    event.preventDefault();
    if (sending.current || !draft.trim()) return;
    sending.current = true; setBusy(true); setError('');
    if (attempt.current?.message !== draft.trim()) attempt.current = { clientId: crypto.randomUUID(), message: draft.trim() };
    try {
      const data = await helpApi(`/api/help/${ticketId}/messages`, { method: 'POST', body: JSON.stringify(attempt.current) });
      if (!alive.current) return;
      stickBottom.current = true; merge([data.message]); setDraft(''); attempt.current = null; change.current?.();
    } catch (err) { if (alive.current) setError(`${err.message} Você pode tentar enviar novamente.`); }
    finally { sending.current = false; if (alive.current) setBusy(false); }
  }
  async function status(value) {
    if (sending.current) return;
    sending.current = true; setBusy(true); setError('');
    try {
      const data = await helpApi(`/api/help/${ticketId}`, { method: 'PATCH', body: JSON.stringify({ status: value }) });
      if (alive.current) { setTicket(data.ticket); change.current?.(); }
    } catch (err) { if (alive.current) setError(err.message); }
    finally { sending.current = false; if (alive.current) setBusy(false); }
  }
  async function older() {
    setOlderBusy(true);
    try {
      const data = await helpApi(`/api/help/${ticketId}?before=${messages[0].id}`);
      if (!alive.current) return;
      stickBottom.current = false; merge(data.messages); setHasOlder(data.hasMore);
    } catch (err) { if (alive.current) setError(err.message); }
    finally { if (alive.current) setOlderBusy(false); }
  }
  return <section className="help-conversation" aria-label="Conversa do chamado">
    <header><div><h3>{ticket ? `Sala ${ticket.room}` : 'Carregando conversa…'}</h3>{ticket && <span className={`help-status ${ticket.status}`}>{helpStatus[ticket.status]}</span>}</div><div className="help-status-actions">
      {ticket?.status === 'resolved' ? <button disabled={busy} onClick={() => status('new')}>Reabrir chamado</button> : user.role === 'admin' && ticket && <>{ticket.status === 'new' && <button disabled={busy} onClick={() => status('active')}>Iniciar atendimento</button>}<button disabled={busy} onClick={() => status('resolved')}>Marcar resolvido</button></>}
    </div></header>
    {ticket?.webhookStatus === 'failed' && <p className="help-notice">Chamado salvo no painel. A notificação externa não foi entregue.</p>}
    {ticket?.webhookStatus === 'pending' && <p className="help-notice">Chamado salvo. A notificação externa ainda não foi confirmada.</p>}
    {connectionError && <p className="portal-error" role="status">{connectionError}</p>}
    <div className="help-messages" ref={scroller} role="log" aria-label="Mensagens do chamado" aria-live="polite" onScroll={() => { const el = scroller.current; stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; }}>
      {hasOlder && <button disabled={olderBusy} onClick={older}>{olderBusy ? 'Carregando…' : 'Ver mensagens anteriores'}</button>}
      {messages.map(message => <article key={message.id} className={message.senderId === user.id ? 'mine' : ''}><strong>{message.senderName}{message.admin ? ' · Admin' : ''}</strong><p>{message.message}</p><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString('pt-BR')}</time></article>)}
    </div>
    {error && <p className="portal-error" role="alert">{error}</p>}
    {ticket?.status !== 'resolved' ? <form onSubmit={send}><label htmlFor={`chat-${ticketId}`}>Mensagem para {user.role === 'admin' ? 'a sala' : 'o atendimento'}</label><textarea id={`chat-${ticketId}`} rows={3} maxLength={2000} required value={draft} disabled={busy} onChange={event => setDraft(event.target.value)} placeholder="Escreva sua mensagem…" /><button className="portal-primary" disabled={busy || !ticket || !draft.trim()}>{busy ? 'Enviando…' : 'Enviar mensagem'}</button></form> : <p>Chamado resolvido. Reabra para continuar a conversa.</p>}
  </section>;
}

export function AdminHelp({ tickets, error, user, selected, onSelect, refresh }) {
  const [filter, setFilter] = useState('open'), [search, setSearch] = useState('');
  const visible = tickets.filter(ticket => (filter === 'all' || (filter === 'open' ? ticket.status !== 'resolved' : ticket.status === filter)) && `${ticket.room} ${ticket.roomName || ''} ${ticket.lastMessage}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <section aria-label="Pedidos de ajuda"><div className="help-admin-head"><div><h2>Pedidos de ajuda</h2><p>Converse com as salas e acompanhe o atendimento. Atualização automática.</p></div><button onClick={refresh}>Atualizar</button></div>
    {error && <p role="alert" className="portal-error">{error}</p>}
    <div className="help-filters"><label>Buscar chamado<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Sala ou mensagem" /></label><label>Status<select value={filter} onChange={event => setFilter(event.target.value)}><option value="open">Em aberto</option><option value="all">Todos</option>{Object.entries(helpStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <div className="help-workspace"><HelpTicketList tickets={visible} selected={selected} onSelect={onSelect} />{selected ? <HelpConversation key={selected} ticketId={selected} user={user} onChange={refresh} /> : <div className="help-empty">Selecione um chamado para conversar com a sala.</div>}</div>
  </section>;
}
