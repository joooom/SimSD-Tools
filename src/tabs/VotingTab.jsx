import React from 'react';

const markup = `
<div class="tab-pane" id="tab-vote">
        <div class="tab-scroll" style="flex-direction:row;gap:.875rem;overflow:hidden;padding:.875rem">
          <div class="vote-ctrl" style="flex:1;min-width:0">
            <div style="font-size:15px;font-weight:700;color:var(--red)">Painel de Controle</div>
            <input class="ip-inp" id="vote-label" placeholder="Assunto da votação (ex: DR/1/BRA)" style="width:100%">
            <div style="display:flex;gap:7px">
              <button class="cbtn cb-cfg" style="flex:1;height:38px;font-size:13px" onclick="openPanel('vote-panel')"><span class="material-icons inline-icon">settings</span>Config</button>
              <button class="cbtn cb-reset" style="flex:1;height:38px;font-size:13px" onclick="resetVote()"><span class="material-icons inline-icon">replay</span>Reset</button>
            </div>
            <div class="vstats" id="vstats">
              <div class="vs"><div class="vs-num" id="v-fav" style="color:var(--green)">0</div><div class="vs-lbl">A Favor</div></div>
              <div class="vs"><div class="vs-num" id="v-fdr" style="color:#0a5c28">0</div><div class="vs-lbl">Fav.+Dir.</div></div>
              <div class="vs"><div class="vs-num" id="v-con" style="color:var(--red)">0</div><div class="vs-lbl">Contra</div></div>
              <div class="vs"><div class="vs-num" id="v-cdr" style="color:#6b0000">0</div><div class="vs-lbl">Con.+Dir.</div></div>
              <div class="vs"><div class="vs-num" id="v-abs" style="color:var(--muted)">0</div><div class="vs-lbl">Abstenção</div></div>
              <div class="vs"><div class="vs-num" id="v-maj" style="color:var(--gold)">—</div><div class="vs-lbl">Maioria</div></div>
            </div>
            <div class="vote-res-bar"><div class="vote-res-fill" id="v-fill" style="width:0%"></div></div>
            <div class="vote-res-txt" id="v-res" style="color:var(--muted)">—</div>
            <button class="btn-report" onclick="registerVote()" style="margin-top:.25rem"><span class="material-icons inline-icon">how_to_vote</span>Registrar Votação no Histórico</button>
          </div>
          <div class="vote-panel" style="flex:1.8;min-width:0">
            <div style="font-size:14px;font-weight:700;color:var(--red);margin-bottom:.625rem" id="vote-type-lbl">Votação Procedimental</div>
            <div class="vlist" id="vlist"></div>
          </div>
        </div>
      </div>
`;

export default function VotingTab() {
  return <div className="tab-component-root" dangerouslySetInnerHTML={{ __html: markup }} />;
}
