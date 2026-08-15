import React from 'react';

const markup = `
<div class="tab-pane" id="tab-mod">
        <div class="timer-frame">
          <div class="caucus-sub" id="mod-total-d">15:00 / 15:00</div>
          <div class="caucus-main" id="mod-spk-d">1:00 / 1:00</div>
          <div class="ctrl-row">
            <button class="cbtn cb-play material-icons" id="btn-mod-pp" onclick="modPP()">play_arrow</button>
            <button class="cbtn cb-cfg material-icons" onclick="openCaucus('mod')">settings</button>
            <button class="cbtn cb-reset material-icons" onclick="modReset()">replay</button>
            <button class="cbtn cb-stop material-icons" onclick="modNext()">skip_next</button>
          </div>
        </div>
        <div class="tab-scroll">
          <div class="card">
            <div class="sec-head">
              <span class="sec-title">Orador Atual</span>
              <button class="btn-next" onclick="modNext()">Próximo Orador</button>
            </div>
            <div class="cur-row">
              <span class="cur-flag material-icons" id="mod-cur-flag" style="font-size:26px;">public</span>
              <div><div class="cur-name" id="mod-cur-name">Adicionar oradores à direita</div></div>
            </div>
          </div>
          <div class="card" style="flex:1;display:flex;flex-direction:column;gap:.5rem">
            <div class="sec-head"><span class="sec-title">Próximos Oradores</span></div>
            <div class="speakers-list-wrap" id="mod-list">
              <div class="empty"><div class="empty-icon material-icons">reorder</div><div class="empty-txt">Lista vazia</div></div>
            </div>
          </div>
        </div>
      </div>
`;

export default function ModeratedTab() {
  return <div className="tab-component-root" dangerouslySetInnerHTML={{ __html: markup }} />;
}
