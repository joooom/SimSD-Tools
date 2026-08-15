import React from 'react';

const markup = `
<div class="tab-pane" id="tab-motions">
        <div class="tab-scroll">
          <div class="mo-form">
            <div class="mo-form-title">Nova Moção</div>
            <div class="mo-row">
              <div class="mf" style="flex:1.3"><label>Tipo</label>
                <select class="m-inp" id="mo-type">
                  <option value="unmod">Sessão Não-Moderada</option>
                  <option value="mod">Sessão Moderada</option>
                  <option value="vote">Votação de Documento</option>
                  <option value="recess">Recesso</option>
                  <option value="other">Outra</option>
                </select>
              </div>
              <div class="mf" style="flex:1.2"><label>Proponente</label>
                <select class="m-inp" id="mo-prop"><option value="">País...</option></select>
              </div>
              <div class="mf" style="flex:.65"><label>Duração (min)</label><input class="m-inp" type="number" id="mo-dur" placeholder="ex: 10"></div>
              <div class="mf" style="flex:.65"><label>Tempo/Orador (s)</label><input class="m-inp" type="number" id="mo-spk" placeholder="ex: 60"></div>
              <div class="mf" style="flex:0;justify-content:flex-end"><label>&nbsp;</label><button class="btn-add-mo" onclick="addMotion()"><span class="material-icons inline-icon">add</span>Adicionar</button></div>
            </div>
          </div>
          <div class="mo-list" id="mo-list">
            <div class="empty" id="mo-empty"><div class="empty-icon material-icons">layers_clear</div><div class="empty-txt">Nenhuma moção</div></div>
          </div>
        </div>
      </div>
`;

export default function MotionsTab() {
  return <div className="tab-component-root" dangerouslySetInnerHTML={{ __html: markup }} />;
}
