import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { helpApi, useHelpTickets, HelpTicketList, HelpConversation } from './HelpChat.jsx';
import './help-request.css';

export default function HelpRequest({ inRoom = false, activeRoom, user }) {
  const dialog = useRef(null), sending = useRef(false), attempt = useRef(null);
  const [room, setRoom] = useState(''), [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [open, setOpen] = useState(false), [creating, setCreating] = useState(false), [selected, setSelected] = useState(null);
  const { tickets, unread, error: listError, refresh } = useHelpTickets(activeRoom?.id);
  async function submit(event) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true; setBusy(true); setError('');
    const payload = { room: room.trim(), message: message.trim(), roomId: activeRoom?.id || null };
    if (attempt.current?.signature !== JSON.stringify(payload)) attempt.current = { signature: JSON.stringify(payload), body: { ...payload, clientId: crypto.randomUUID() } };
    try {
      const data = await helpApi('/api/help', { method: 'POST', body: JSON.stringify(attempt.current.body) });
      setSelected(data.ticket.id); setCreating(false); setMessage(''); attempt.current = null; refresh();
    } catch (err) { setError(`${err.message} Se o envio não foi confirmado, tente novamente; o mesmo pedido não será duplicado.`); }
    finally { sending.current = false; setBusy(false); }
  }
  const close = () => { dialog.current.close(); setOpen(false); };
  const headerSlot = inRoom ? document.getElementById('room-help-slot') : null;
  const trigger = <button className={headerSlot ? 'btn-cfg' : 'help-trigger'} data-readonly-allow aria-label={unread ? `Ajuda: ${unread} mensagens não lidas` : 'Pedir ajuda'} onClick={() => { setOpen(true); setError(''); setCreating(!tickets.length); dialog.current.showModal(); }}>
    {headerSlot && <span className="material-icons inline-icon" aria-hidden="true">help_outline</span>}{headerSlot ? 'Ajuda' : 'Pedir ajuda'}{unread > 0 && <span className="help-badge">{unread}</span>}
  </button>;
  return <>{createPortal(trigger, headerSlot || document.body)}{createPortal(<dialog ref={dialog} className="help-dialog chat-dialog" aria-labelledby="help-title" onCancel={event => { if (sending.current) event.preventDefault(); else setOpen(false); }}>
    <div className="help-heading"><h2 id="help-title">Ajuda e atendimento</h2><button type="button" disabled={busy} onClick={close} aria-label="Fechar ajuda">×</button></div>
    <div className="help-dialog-nav"><button disabled={busy} onClick={() => { setCreating(false); setSelected(null); }}>Meus chamados{unread > 0 ? ` (${unread})` : ''}</button><button disabled={busy} onClick={() => { setCreating(true); setSelected(null); }}>Novo pedido</button></div>
    {open && (creating ? <form onSubmit={submit}>
      <p>Informe o número físico da sala. O atendimento poderá responder por aqui.{activeRoom && ` Chamado vinculado a ${activeRoom.name}.`}</p>
      <label htmlFor="help-room">Número da sala</label><input id="help-room" autoFocus required maxLength={80} value={room} disabled={busy} onChange={event => setRoom(event.target.value)} placeholder="Ex.: 204" />
      <label htmlFor="help-message">Mensagem</label><textarea id="help-message" required maxLength={1000} rows={4} value={message} disabled={busy} onChange={event => setMessage(event.target.value)} placeholder="Ex.: Precisamos de ajuda com o projetor." />
      {error && <p className="portal-error" role="alert">{error}</p>}<button className="portal-primary" disabled={busy || !room.trim() || !message.trim()}>{busy ? 'Enviando…' : 'Enviar pedido'}</button>
    </form> : selected ? <HelpConversation key={selected} ticketId={selected} user={user} onChange={refresh} /> : <>{listError && <p className="portal-error" role="alert">{listError}</p>}<HelpTicketList tickets={tickets} selected={selected} onSelect={setSelected} /></>)}
  </dialog>, document.body)}</>;
}
