import React, { useState } from 'react';

async function request(action, data) {
  const response = await fetch(`/api/admin/pending-import/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Não foi possível importar o arquivo.');
  return result;
}

export default function PendingImport({ onImported }) {
  const [backup, setBackup] = useState(null);
  const [preview, setPreview] = useState(null);
  const [preference, setPreference] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function loadFile(event) {
    const file = event.target.files?.[0];
    setBackup(null); setPreview(null); setPreference(''); setMessage(''); setError('');
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 12_000_000) throw new Error('O arquivo deve ter no máximo 12 MB.');
      let data;
      try { data = JSON.parse((await file.text()).replace(/^\uFEFF/, '')); }
      catch { throw new Error('Este arquivo não contém um JSON válido.'); }
      setBackup(data);
      setPreview(await request('preview', { backup: data }));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function analyze() {
    setBusy(true); setError(''); setPreview(null); setPreference('');
    try { setPreview(await request('preview', { backup })); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function apply() {
    setBusy(true); setError('');
    try {
      const result = await request('apply', { backup, token: preview.token, preference: preference || null });
      setMessage(`Alterações importadas em ${result.room.name}.`); setPreview(null); setBackup(null); onImported();
    } catch (err) { setError(err.message); setPreview(null); }
    finally { setBusy(false); }
  }
  return <section className="portal-modal" style={{ width: '100%', boxSizing: 'border-box', marginBottom: 20 }} aria-label="Importar alterações pendentes">
    <h2>Importar alterações pendentes</h2>
    <p>Selecione o JSON de “Baixar cópia local”. As alterações serão combinadas com os dados atuais da sala original. Salas encerradas precisam ser reabertas.</p>
    <input aria-label="Arquivo JSON de alterações pendentes" type="file" accept=".json,application/json" disabled={busy} onChange={loadFile} />
    {busy && <p role="status">Processando…</p>}
    {error && <p className="portal-error" role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {backup && <button disabled={busy} onClick={analyze}>Analisar novamente</button>}
    {preview && <div>
      <h3>{preview.room.name} · {preview.room.code}</h3>
      <p>Notas: {preview.counts.notesBefore} → {preview.counts.notesAfter}. Acontecimentos: {preview.counts.eventsBefore} → {preview.counts.eventsAfter}.</p>
      {preview.conflicts.length > 0 ? <>
        <p>{preview.conflicts.length} conflito(s). A escolha abaixo afeta apenas os campos conflitantes.</p>
        <div style={{ maxHeight: 220, overflow: 'auto' }}>{preview.conflicts.map((conflict, index) => <details key={index}><summary>{conflict.path || 'Estado da sessão'}</summary><p>Arquivo: {JSON.stringify(conflict.local) ?? 'Excluído'}</p><p>Sala: {JSON.stringify(conflict.remote) ?? 'Excluído'}</p></details>)}</div>
        <label>Resolver conflitos <select value={preference} disabled={busy} onChange={event => setPreference(event.target.value)}><option value="">Selecione</option><option value="local">Usar valores do arquivo</option><option value="remote">Manter valores da sala</option></select></label>
      </> : <p>Nenhum conflito encontrado.</p>}
      <button className="portal-primary" disabled={busy || (preview.conflicts.length > 0 && !preference)} onClick={apply}>Aplicar alterações na sala</button>
    </div>}
  </section>;
}
