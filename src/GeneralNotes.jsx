import React, { useEffect, useRef, useState } from 'react';
import { COMMITTEE_NAMES, EVALUATION_CRITERIA, NOTE_KINDS, committeeDelegations } from './evaluationCriteria.js';
import './general-notes.css';

const emptyForm = () => ({ committeeKey: 'unodc', participant: '', type: 'dpo', text: '', ratings: {} });
const noteTypes = { ...NOTE_KINDS, general: 'Nota geral da sessão', delegation: 'Nota sobre a delegação', speech: 'Nota sobre o discurso' };
const dateLabel = value => value ? new Date(value).toLocaleString('pt-BR') : 'Data não registrada';

async function request(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json' } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Não foi possível concluir a operação.');
  return data;
}

export default function GeneralNotes() {
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [notes, setNotes] = useState([]);
  const [filters, setFilters] = useState({ committeeKey: '', delegation: '', source: '', search: '' });
  const [format, setFormat] = useState('xml');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const formRef = useRef(null);
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    const timer = setTimeout(() => {
      request(`/api/general-notes?${query}`, { signal: controller.signal })
        .then(data => { if (!controller.signal.aborted) setNotes(data.notes); })
        .catch(err => { if (!controller.signal.aborted) { setError(err.message); setNotes([]); } })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 200);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [query, refresh]);

  const change = (key, value) => setForm(current => ({ ...current, [key]: value, ...(key === 'committeeKey' ? { participant: '' } : {}) }));
  const reset = () => { setEditing(null); setForm(emptyForm()); setFormError(''); };
  const save = async event => {
    event.preventDefault();
    setSaving(true); setFormError(''); setMessage('');
    try {
      await request(`/api/general-notes${editing ? `/${editing.id}` : ''}`, {
        method: editing ? 'PATCH' : 'POST', body: JSON.stringify({ ...form, ...(editing ? { version: editing.version } : {}) }),
      });
      setMessage(editing ? 'Nota atualizada.' : 'Nota salva. Ela já está disponível para Tools e admins.');
      setEditing(null); setForm(current => ({ ...current, text: '', ratings: {} }));
      setRefresh(value => value + 1);
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  };
  const edit = note => {
    setEditing({ id: note.id, version: note.version });
    setForm({ committeeKey: note.committeeKey, participant: note.participant, type: note.type, text: note.text, ratings: note.ratings });
    setFormError(''); setMessage('');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const exportNotes = async () => {
    setExporting(true); setError('');
    try {
      const response = await fetch(`/api/general-notes/export?${query}&format=${format}`);
      if (!response.ok) { const data = await response.json(); throw new Error(data.message || 'Falha na exportação.'); }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url; link.download = `notas-gerais-avaliacoes.${format}`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) { setError(err.message); }
    finally { setExporting(false); }
  };
  const delegationOptions = [...new Set([
    ...(filters.committeeKey ? committeeDelegations(filters.committeeKey) : Object.keys(COMMITTEE_NAMES).flatMap(committeeDelegations)),
    ...notes.filter(note => !filters.committeeKey || note.committeeKey === filters.committeeKey).map(note => note.participant).filter(Boolean),
    ...(filters.delegation ? [filters.delegation] : []),
  ])].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return <section className="general-notes" aria-label="Notas gerais">
    <div className="general-notes-heading"><div><h2>Notas gerais</h2><p>DPOs, avaliações e anotações de todas as sessões, em um só lugar.</p></div><span className="staff-badge">Tools e admins</span></div>
    <div className="general-notes-grid">
      <section className="general-note-form" ref={formRef}>
        <h3>{editing ? 'Editar nota geral' : 'Nova nota fora de sessão'}</h3>
        <p>Selecione o comitê e a delegação. Você pode escrever uma observação, avaliar critérios ou fazer ambos.</p>
        <form onSubmit={save}>
          <fieldset disabled={saving}>
            <label>Comitê da nota<select value={form.committeeKey} onChange={event => change('committeeKey', event.target.value)}>{Object.entries(COMMITTEE_NAMES).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
            <label>Delegação da nota<select required value={form.participant} onChange={event => change('participant', event.target.value)}><option value="">Selecione uma delegação</option>{committeeDelegations(form.committeeKey).map(name => <option key={name}>{name}</option>)}</select></label>
            <label>Tipo de nota<select value={form.type} onChange={event => change('type', event.target.value)}>{Object.entries(NOTE_KINDS).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
            <label>Anotação<textarea rows="5" maxLength={10000} value={form.text} onChange={event => change('text', event.target.value)} placeholder="Observações sobre o DPO ou a atuação da delegação…" /></label>
            <h4>Avaliação de 1 a 5</h4><p>Preencha apenas os critérios observados. “Não avaliado” não conta como zero.</p>
            <div className="criteria-inputs">{EVALUATION_CRITERIA.map(criterion => <label key={criterion.id}>{criterion.label}<select value={form.ratings[criterion.id] ?? ''} onChange={event => setForm(current => ({ ...current, ratings: { ...current.ratings, [criterion.id]: event.target.value ? Number(event.target.value) : null } }))}><option value="">Não avaliado</option>{[1, 2, 3, 4, 5].map(score => <option key={score} value={score}>{score}</option>)}</select></label>)}</div>
            <div className="general-note-actions"><button className="portal-primary" type="submit">{saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Salvar nota e avaliação'}</button>{editing && <button type="button" onClick={reset}>Cancelar edição</button>}</div>
          </fieldset>
        </form>
        {formError && <p className="portal-error" role="alert">{formError}</p>}
        {message && <p className="notes-success" role="status">{message}</p>}
      </section>
      <section className="general-notes-history" aria-label="Consulta centralizada">
        <div className="general-notes-heading"><h3>Consulta centralizada</h3><button onClick={() => setRefresh(value => value + 1)} disabled={loading}>Atualizar notas</button></div>
        <div className="general-notes-filters">
          <label>Filtrar comitê<select value={filters.committeeKey} onChange={event => setFilters(current => ({ ...current, committeeKey: event.target.value, delegation: '' }))}><option value="">Todos os comitês</option>{Object.entries(COMMITTEE_NAMES).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
          <label>Filtrar delegação<select value={filters.delegation} onChange={event => setFilters(current => ({ ...current, delegation: event.target.value }))}><option value="">Todas as delegações</option>{delegationOptions.map(name => <option key={name}>{name}</option>)}</select></label>
          <label>Origem<select value={filters.source} onChange={event => setFilters(current => ({ ...current, source: event.target.value }))}><option value="">Notas gerais e sessões</option><option value="general">Fora de sessão</option><option value="session">Notas das sessões</option></select></label>
          <label>Buscar notas<input type="search" maxLength={200} value={filters.search} onChange={event => setFilters(current => ({ ...current, search: event.target.value }))} placeholder="Texto, autor, sala ou delegação" /></label>
        </div>
        <div className="general-notes-export"><label>Formato de exportação<select value={format} onChange={event => setFormat(event.target.value)}><option value="xml">XML para LLM</option><option value="json">JSON</option></select></label><button onClick={exportNotes} disabled={loading || exporting || Boolean(error)}>{exporting ? 'Exportando…' : 'Exportar notas filtradas'}</button></div>
        <p className="notes-count">{loading ? 'Carregando notas…' : `${notes.length} nota(s) encontrada(s). A exportação inclui as notas e avaliações dos filtros atuais.`}</p>
        {error && <p className="portal-error" role="alert">{error}</p>}
        <div aria-busy={loading} className="central-notes-list">
          {!loading && !error && !notes.length && <p className="empty-rooms">Nenhuma nota encontrada para estes filtros.</p>}
          {notes.map(note => <article key={note.id} className="central-note">
            <div className="central-note-header"><span className={`note-origin ${note.source}`}>{note.source === 'general' ? 'Fora de sessão' : 'Sessão'}</span><span>{noteTypes[note.type] || note.type}</span>{note.canEdit && <button disabled={saving} onClick={() => edit(note)}>Editar</button>}</div>
            <h4>{note.committee} · {note.participant || 'Nota geral da sessão'}</h4>
            <p className="note-metadata">{dateLabel(note.createdAt)} · {note.author?.name || 'Autoria não registrada'}{note.session ? ` · ${note.session.roomName} · ${note.session.name}` : ''}</p>
            {note.updatedAt && note.updatedAt !== note.createdAt && <p className="note-metadata">Editada em {dateLabel(note.updatedAt)}</p>}
            {note.speech && <p className="note-metadata">Discurso: {({ gsl: 'Lista geral', mod: 'Moderado', solo: 'Orador único' })[note.speech.mode] || note.speech.mode}{note.speech.position ? ` · posição ${note.speech.position}` : ''}</p>}
            {note.text && <p className="central-note-text">{note.text}</p>}
            <dl className="criteria-scores">{EVALUATION_CRITERIA.filter(criterion => note.ratings?.[criterion.id] != null).map(criterion => <div key={criterion.id}><dt>{criterion.label}</dt><dd>{note.ratings[criterion.id]} / 5</dd></div>)}</dl>
          </article>)}
        </div>
      </section>
    </div>
  </section>;
}
