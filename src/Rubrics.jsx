import React, { useEffect, useState } from 'react';
import { COMMITTEE_NAMES, EVALUATION_CRITERIA } from './evaluationCriteria.js';
import { PRIORITY_LABELS, rubricLabel, scoreConcept, scoreStars } from './rubricConfig.js';
import './rubrics.css';

async function request(path, body) {
  const response = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Não foi possível gerar as rubricas.');
  return data;
}
const dateLabel = value => value ? new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Data não registrada';

export default function Rubrics() {
  const [sessions, setSessions] = useState([]);
  const [options, setOptions] = useState({ committeeKeys: [], roomIds: [], priority: 'latest', includeGeneral: false, includeUnassessed: false });
  const [report, setReport] = useState(null);
  const [finals, setFinals] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    request('/api/rubrics/options').then(data => { if (active) setSessions(data.sessions); })
      .catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const change = patch => { setOptions(current => ({ ...current, ...patch })); setReport(null); setError(''); };
  const toggleCommittee = key => {
    const committeeKeys = options.committeeKeys.includes(key) ? options.committeeKeys.filter(item => item !== key) : [...options.committeeKeys, key];
    change({ committeeKeys, roomIds: options.roomIds.filter(id => sessions.some(session => session.id === id && committeeKeys.includes(session.committeeKey))) });
  };
  const visibleSessions = sessions.filter(session => options.committeeKeys.includes(session.committeeKey));
  const preview = async () => {
    setBusy(true); setError(''); setReport(null);
    try {
      const fresh = await request('/api/rubrics/options'); setSessions(fresh.sessions);
      const data = await request('/api/rubrics/preview', options); setReport(data.report);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const download = async (format, committeeKey) => {
    setBusy(true); setError('');
    const validKeys = new Set(report.comites.flatMap(committee => committee.delegacoes.map(item => item.key)));
    try {
      const response = await fetch('/api/rubrics/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        ...options, fingerprint: report.fingerprint, format, committeeKey,
        finals: Object.fromEntries(Object.entries(finals).filter(([key]) => validKeys.has(key))),
      }) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.message || 'Falha ao baixar rubricas.'); }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = `rubricas-${committeeKey || 'geral'}.${format}`;
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <section className="rubrics" aria-label="Rubricas de avaliação">
    <h2>Rubricas de avaliação</h2>
    <p>Consolide as avaliações registradas e baixe as rubricas em Word, no formato do gerador. Cada critério recebe sua própria nota prioritária; anotações sem pontuação não recebem uma nota automática.</p>
    <fieldset disabled={loading || busy} className="rubric-selection">
      <legend>Comitês e sessões válidas</legend>
      <div className="rubric-checks">{Object.entries(COMMITTEE_NAMES).map(([key, name]) => <label key={key}><input type="checkbox" checked={options.committeeKeys.includes(key)} onChange={() => toggleCommittee(key)} />{name}</label>)}</div>
      <h3>Sessões incluídas</h3>
      {loading ? <p>Carregando sessões…</p> : !options.committeeKeys.length ? <p>Selecione os comitês para listar as sessões.</p> : !visibleSessions.length ? <p>Nenhuma sessão disponível para os comitês selecionados.</p> : <>
        <div className="rubric-actions"><button onClick={() => change({ roomIds: visibleSessions.map(session => session.id) })}>Selecionar todas as sessões listadas</button><button onClick={() => change({ roomIds: [] })}>Limpar seleção de sessões</button></div>
        <div className="rubric-sessions">{visibleSessions.map(session => <label key={session.id}><input type="checkbox" checked={options.roomIds.includes(session.id)} onChange={() => change({ roomIds: options.roomIds.includes(session.id) ? options.roomIds.filter(id => id !== session.id) : [...options.roomIds, session.id] })} /><span><strong>{COMMITTEE_NAMES[session.committeeKey]} · {session.roomName}</strong><small>{session.name || 'Sessão sem título'} · {session.code} · {session.status === 'closed' ? 'Encerrada' : 'Em andamento'}</small></span></label>)}</div>
      </>}
      <label className="rubric-option"><input type="checkbox" checked={options.includeGeneral} onChange={event => change({ includeGeneral: event.target.checked })} />Incluir também notas fora de sessão dos comitês selecionados</label>
      <label className="rubric-option"><input type="checkbox" checked={options.includeUnassessed} onChange={event => change({ includeUnassessed: event.target.checked })} />Incluir delegações sem avaliação, com campos em branco</label>
      <label className="rubric-priority">Prioridade por critério<select value={options.priority} onChange={event => change({ priority: event.target.value })}>{Object.entries(PRIORITY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <p>A última lançada considera a data de criação da nota. Empates de pontuação usam a mais recente. Campos não avaliados não substituem notas existentes.</p>
      <p>Avaliação geral: 1 a 5 estrelas, conforme a nota. Conceitos do DPO: 1–2 → D; 3 → C; 4 → B; 5 → A.</p>
      <button className="portal-primary" onClick={preview} disabled={!options.committeeKeys.length || (!options.roomIds.length && !options.includeGeneral)}>{busy ? 'Processando…' : 'Gerar prévia das rubricas'}</button>
    </fieldset>
    {error && <p className="portal-error" role="alert">{error}</p>}
    {report && <section className="rubric-preview" aria-label="Prévia das rubricas">
      <h3>Prévia das rubricas</h3>
      <p role="status">{report.delegationCount} delegação(ões) · {report.noteCount} anotação(ões) consideradas · {report.sessions.length} sessão(ões) selecionadas.</p>
      {!report.delegationCount ? <p>Nenhuma avaliação encontrada. Confira as sessões ou inclua delegações sem avaliação.</p> : <>
        <div className="rubric-actions"><button disabled={busy} onClick={() => download('docx')}>Baixar Word de todos os comitês</button><button disabled={busy} onClick={() => download('json')}>Baixar JSON consolidado</button></div>
        <p>Confira a origem das notas e preencha a avaliação final de cada delegação, se desejar. Ela fica como “Não preenchida” quando deixada em branco. Esses textos são incluídos no download, mas não ficam salvos ao sair desta aba.</p>
      </>}
      {report.comites.map(committee => <section key={committee.chave_comite}>
        <div className="rubric-committee-heading"><h3>{committee.nome_comite}</h3><button disabled={busy || !committee.delegacoes.length} onClick={() => download('docx', committee.chave_comite)}>Baixar Word deste comitê</button></div>
        {!committee.delegacoes.length && <p>Nenhuma delegação avaliada na seleção.</p>}
        {committee.delegacoes.map(delegation => <details key={delegation.key} className="rubric-delegation"><summary>{delegation.nome} · {delegation.assessedCount} de {EVALUATION_CRITERIA.length} critérios avaliados</summary>
          <div className="rubric-table-scroll"><table><thead><tr><th>Critério</th><th>Nota escolhida</th><th>Origem</th></tr></thead><tbody>{EVALUATION_CRITERIA.map(criterion => {
            const score = delegation.ratings[criterion.id], evidence = delegation.evidence[criterion.id];
            return <tr key={criterion.id}><th scope="row">{rubricLabel(criterion, committee.chave_comite)}</th><td>{score == null ? 'Não avaliado' : `${score}/5 · ${criterion.parentId ? scoreConcept(score) : scoreStars(score)}`}</td><td>{evidence ? <><span>{evidence.session ? `${evidence.session.roomName} · ${evidence.session.name}` : 'Fora de sessão'} · {dateLabel(evidence.createdAt)}{evidence.author?.name ? ` · ${evidence.author.name}` : ''}</span><small>{evidence.candidates} registro(s) com pontuação</small>{evidence.text && <details><summary>Ver anotação</summary><p>{evidence.text}</p></details>}</> : 'Sem registro'}</td></tr>;
          })}</tbody></table></div>
          <label className="rubric-final">Avaliação final de {delegation.nome}<textarea rows="3" maxLength={500} disabled={busy} value={finals[delegation.key] || ''} onChange={event => setFinals(current => ({ ...current, [delegation.key]: event.target.value }))} placeholder="Preenchimento opcional antes de baixar" /></label>
        </details>)}
      </section>)}
    </section>}
  </section>;
}
