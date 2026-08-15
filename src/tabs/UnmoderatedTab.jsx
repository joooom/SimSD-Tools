import React from 'react';

const markup = `
<div class="tab-pane" id="tab-unmod">
        <div class="timer-frame" style="text-align:center">
          <div class="caucus-main" id="unmod-d" style="font-size:80px">10:00 / 10:00</div>
          <div class="ctrl-row">
            <button class="cbtn cb-play material-icons" id="btn-unmod-pp" onclick="unmodPP()">play_arrow</button>
            <button class="cbtn cb-cfg material-icons" onclick="openCaucus('unmod')">settings</button>
            <button class="cbtn cb-reset material-icons" onclick="unmodReset()">replay</button>
            <button class="cbtn cb-stop material-icons" onclick="unmodReset()">stop</button>
          </div>
        </div>
        <div class="tab-scroll"></div>
      </div>
`;

export default function UnmoderatedTab() {
  return <div className="tab-component-root" dangerouslySetInnerHTML={{ __html: markup }} />;
}
