import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './help-request.css';

export default function HelpRequest({ inRoom = false }) {
  const dialog = useRef(null);
  const sending = useRef(false);
  const [room, setRoom] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/help', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, message }), signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Não foi possível confirmar o envio.');
      setSent(true); setMessage('');
    } catch (err) {
      setError(err.name === 'TimeoutError' || err instanceof TypeError
        ? 'Não foi possível confirmar o envio. Verifique sua conexão antes de tentar novamente.' : err.message);
    } finally { sending.current = false; setBusy(false); }
  }

  const headerSlot = inRoom ? document.getElementById('room-help-slot') : null;
  const trigger = <button className={headerSlot ? 'btn-cfg' : 'help-trigger'} data-readonly-allow aria-label="Pedir ajuda" onClick={() => { setSent(false); setError(''); dialog.current.showModal(); }}>
    {headerSlot && <span className="material-icons inline-icon" aria-hidden="true">help_outline</span>}{headerSlot ? 'Ajuda' : 'Pedir ajuda'}
  </button>;

  return <>{createPortal(trigger, headerSlot || document.body)}{createPortal(<>
    <dialog ref={dialog} className="help-dialog" aria-labelledby="help-title" onCancel={event => { if (sending.current) event.preventDefault(); }}>
      <div className="help-heading"><h2 id="help-title">Pedir ajuda</h2><button type="button" disabled={busy} onClick={() => dialog.current.close()} aria-label="Fechar ajuda">×</button></div>
      {sent ? <div role="status"><p>Pedido de ajuda enviado!</p><button className="portal-primary" onClick={() => dialog.current.close()}>Concluir</button></div> : <form onSubmit={submit}>
        <p>Informe o número da sala e descreva brevemente o que precisa.</p>
        <label htmlFor="help-room">Número da sala</label>
        <input id="help-room" autoFocus required maxLength={80} value={room} disabled={busy} onChange={event => setRoom(event.target.value)} placeholder="Ex.: 204" />
        <label htmlFor="help-message">Mensagem</label>
        <textarea id="help-message" required maxLength={1000} rows={4} value={message} disabled={busy} onChange={event => setMessage(event.target.value)} placeholder="Ex.: Precisamos de ajuda com o projetor." />
        {error && <p className="portal-error" role="alert">{error}</p>}
        <button className="portal-primary" type="submit" disabled={busy || !room.trim() || !message.trim()}>{busy ? 'Enviando…' : 'Enviar pedido'}</button>
      </form>}
    </dialog>
  </>, document.body)}</>;
}
