import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import '../style.css';
import GslTab from './tabs/GslTab.jsx';
import MotionsTab from './tabs/MotionsTab.jsx';
import ModeratedTab from './tabs/ModeratedTab.jsx';
import UnmoderatedTab from './tabs/UnmoderatedTab.jsx';
import SoloSpeakerTab from './tabs/SoloSpeakerTab.jsx';
import VotingTab from './tabs/VotingTab.jsx';
import PresenceTab from './tabs/PresenceTab.jsx';

function SimSDApp() {
  const markup = document.getElementById('app-template').innerHTML;
  return (
    <div
      id="react-app"
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

const root = createRoot(document.getElementById('root'));
flushSync(() => root.render(<SimSDApp />));

const tabs = [
  ['tab-gsl-root', GslTab],
  ['tab-motions-root', MotionsTab],
  ['tab-mod-root', ModeratedTab],
  ['tab-unmod-root', UnmoderatedTab],
  ['tab-solo-root', SoloSpeakerTab],
  ['tab-vote-root', VotingTab],
  ['tab-presence-root', PresenceTab],
];

for (const [hostId, TabComponent] of tabs) {
  const tabRoot = createRoot(document.getElementById(hostId));
  flushSync(() => tabRoot.render(<TabComponent />));
}

await import('../script.js');
