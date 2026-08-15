import React from 'react';

const markup = `
<div class="tab-pane active" id="tab-gsl">
        <div class="gsl-grid">
          <!-- LEFT COLUMN: timer + current speaker + history -->
          <div class="gsl-col-left">
            <!-- Timer card -->
            <div class="card timer-card-box">
              <div class="timer-display" id="gsl-timer">1:00</div>
              <div class="timer-progress"><div class="timer-bar" id="gsl-bar" style="width:100%"></div></div>
              <div class="ctrl-row">
                <button class="cbtn cb-play material-icons" id="btn-gsl-pp" onclick="gslPP()" title="Play/Pause (Espaço)">play_arrow</button>
                <button class="cbtn cb-cfg material-icons"  onclick="openCfg()"             title="Configurações">settings</button>
                <button class="cbtn cb-reset material-icons" onclick="gslReset()"           title="Resetar">replay</button>
                <button class="cbtn cb-stop material-icons" onclick="gslStop()"             title="Parar">stop</button>
              </div>
              <div class="presets">
                <span style="font-size:11px;color:var(--muted)">Tempo:</span>
                <div class="pchip" onclick="gslPreset(30,this)">0:30</div>
                <div class="pchip on" onclick="gslPreset(60,this)">1:00</div>
                <div class="pchip" onclick="gslPreset(90,this)">1:30</div>
                <div class="pchip" onclick="gslPreset(120,this)">2:00</div>
                <div class="pchip" onclick="gslPreset(180,this)">3:00</div>
                <div class="custom-t">
                  <input class="ct-inp" id="ct-sec" type="number" min="5" max="999" placeholder="seg">
                  <button class="ct-ok" onclick="gslCustom()">OK</button>
                </div>
              </div>
            </div>

            <!-- Current speaker -->
            <div class="card">
              <div class="sec-head">
                <span class="sec-title">Orador Atual</span>
                <button class="btn-yield" onclick="toggleYield()" title="Ceder o discurso">Ceder ⇒</button>
                <button class="btn-next" onclick="gslNext()" style="margin-left:8px">Próximo Orador</button>
              </div>
              <div class="cur-row" id="gsl-cur-row">
                <span class="cur-flag material-icons" id="gsl-cur-flag" style="font-size:26px;">account_balance</span>
                <div>
                  <div class="cur-name" id="gsl-cur-name">Nenhum orador</div>
                  <div class="cur-meta" id="gsl-cur-meta"></div>
                </div>
              </div>
              <!-- Yield options (inline, expand under speaker) -->
              <div class="yield-box" id="yield-box" style="display:none">
                <div class="yield-title">Ceder o discurso a:</div>
                <div class="yield-options">
                  <button class="yield-opt yield-chair" onclick="yieldToChair()"><span class="material-icons inline-icon">reply</span>Ceder ao Chair (encerrar)</button>
                  <div class="yield-to-country">
                    <select class="m-inp" id="yield-country-sel" style="flex:1"><option value="">Selecione o país...</option></select>
                    <button class="yield-opt yield-go" onclick="yieldToCountry()">Ceder <span class="material-icons inline-icon">arrow_forward</span></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Speaker history -->
            <div class="card">
              <div class="sec-head">
                <span class="sec-title">Histórico de Oradores</span>
                <button style="background:none;border:none;cursor:pointer;font-size:11px;color:var(--muted);font-family:Candara,Calibri,sans-serif" onclick="clearHistory()">Limpar</button>
              </div>
              <div class="history-list-wrap" id="history-list">
                <div class="empty" style="padding:.75rem"><div class="empty-txt">Nenhum discurso ainda</div></div>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: vertical speakers frame -->
          <div class="gsl-col-right">
            <div class="card speakers-frame">
              <div class="sec-head">
                <span class="sec-title">
                  Próximos Oradores
                  <span id="queue-badge" style="font-size:10px;background:var(--red);color:white;padding:1px 7px;border-radius:10px;margin-left:5px">0</span>
                </span>
              </div>
              <div class="speakers-list-wrap" id="gsl-list">
                <div class="empty"><div class="empty-icon material-icons">reorder</div><div class="empty-txt" id="empty-add-txt">Clique à direita para adicionar</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
`;

export default function GslTab() {
  return <div className="tab-component-root" dangerouslySetInnerHTML={{ __html: markup }} />;
}
