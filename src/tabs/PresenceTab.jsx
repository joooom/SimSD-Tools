import React from 'react';

const markup = `
<div class="tab-pane" id="tab-presence">
        <div style="flex-shrink:0;padding:.875rem .875rem 0">
          <div class="pres-summary">
            <div class="pstat"><div class="pstat-num" id="ps-tot">0</div><div class="pstat-lbl">Total</div></div>
            <div class="pstat"><div class="pstat-num g" id="ps-pres">0</div><div class="pstat-lbl">Presentes</div></div>
            <div class="pstat"><div class="pstat-num o" id="ps-vot">0</div><div class="pstat-lbl">Pres. Votantes</div></div>
            <div class="pstat"><div class="pstat-num r" id="ps-aus">0</div><div class="pstat-lbl">Ausentes</div></div>
            <div class="quorum-box">
              <div class="ql">Maioria Simples: <strong id="q-ms">—</strong></div>
              <div class="ql">Maioria Qualificada: <strong id="q-mq">—</strong></div>
            </div>
            <div class="pres-actions">
              <button class="btn-pres" onclick="setAll('presente')">Todos Presentes</button>
              <button class="btn-pres" onclick="setAll('presente-votante')">Todos Votantes</button>
              <button class="btn-pres" onclick="setAll('ausente')">Todos Ausentes</button>
              <button class="btn-pres" onclick="exportCSV()">↓ CSV</button>
              <button class="btn-pres btn-pres-done" onclick="concluirPresenca()"><span class="material-icons inline-icon">check_circle</span>Concluir Presença</button>
            </div>
          </div>
        </div>
        <div style="flex:1;overflow-y:auto;padding:0 .875rem .875rem;min-height:0">
          <div class="pres-card">
            <table class="ptable">
              <thead id="pres-thead"><tr><th></th><th>País</th><th>Delegado</th><th>Status</th></tr></thead>
              <tbody id="pres-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
`;

export default function PresenceTab() {
  return <div className="tab-component-root" dangerouslySetInnerHTML={{ __html: markup }} />;
}
