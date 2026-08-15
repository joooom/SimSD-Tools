import React from 'react';

const markup = `
<div class="tab-pane" id="tab-solo">
        <div class="timer-frame">
          <div class="timer-display" id="solo-timer" style="font-size:68px">1:00</div>
          <div class="timer-progress"><div class="timer-bar" id="solo-bar" style="width:100%"></div></div>
          <div class="ctrl-row" style="grid-template-columns:1fr 1fr">
            <button class="cbtn cb-play material-icons" id="btn-solo-pp" onclick="soloPP()">play_arrow</button>
            <button class="cbtn cb-reset material-icons" onclick="soloReset()">replay</button>
          </div>
        </div>
        <div class="tab-scroll">
          <div class="card">
            <div class="sec-head"><span class="sec-title">Selecionar Orador Único</span></div>
            <select class="m-inp" id="solo-sel" style="width:100%;margin-bottom:.75rem"><option value="">Selecione o país...</option></select>
            <div id="solo-cur-row" style="display:none">
              <div class="cur-row">
                <span class="cur-flag material-icons" id="solo-flag" style="font-size:26px;">flag</span>
                <div><div class="cur-name" id="solo-name">—</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
`;

export default function SoloSpeakerTab() {
  return <div className="tab-component-root" dangerouslySetInnerHTML={{ __html: markup }} />;
}
