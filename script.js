/* ══════════════════════════════════════════════════════
   ALL 193 UN COUNTRIES  (code, flag, region)
   ══════════════════════════════════════════════════════ */
const CTRY=[
  {c:'Afeganistão',o:'Emirado Islâmico do Afeganistão',f:'🇦🇫',r:'asia',i:'af'},
  {c:'África do Sul',o:'República da África do Sul',f:'🇿🇦',r:'africa',i:'za'},
  {c:'Alemanha',o:'República Federal da Alemanha',f:'🇩🇪',r:'europe',i:'de'},
  {c:'Arábia Saudita',o:'Reino da Arábia Saudita',f:'🇸🇦',r:'mideast',i:'sa'},
  {c:'Argentina',o:'República Argentina',f:'🇦🇷',r:'americas',i:'ar'},
  {c:'Austrália',o:'Comunidade da Austrália',f:'🇦🇺',r:'asia',i:'au'},
  {c:'Bolívia',o:'Estado Plurinacional da Bolívia',f:'🇧🇴',r:'americas',i:'bo'},
  {c:'Brasil',o:'República Federativa do Brasil',f:'🇧🇷',r:'americas',i:'br'},
  {c:'Canadá',o:'Canadá',f:'🇨🇦',r:'americas',i:'ca'},
  {c:'Chile',o:'República do Chile',f:'🇨🇱',r:'americas',i:'cl'},
  {c:'China',o:'República Popular da China',f:'🇨🇳',r:'asia',i:'cn'},
  {c:'Colômbia',o:'República da Colômbia',f:'🇨🇴',r:'americas',i:'co'},
  {c:'Coreia do Sul',o:'República da Coreia',f:'🇰🇷',r:'asia',i:'kr'},
  {c:'Costa Rica',o:'República da Costa Rica',f:'🇨🇷',r:'americas',i:'cr'},
  {c:'Egito',o:'República Árabe do Egito',f:'🇪🇬',r:'africa',i:'eg'},
  {c:'El Salvador',o:'República de El Salvador',f:'🇸🇻',r:'americas',i:'sv'},
  {c:'Emirados Árabes Unidos',o:'Emirados Árabes Unidos',f:'🇦🇪',r:'mideast',i:'ae'},
  {c:'Equador',o:'República do Equador',f:'🇪🇨',r:'americas',i:'ec'},
  {c:'Espanha',o:'Reino de Espanha',f:'🇪🇸',r:'europe',i:'es'},
  {c:'Estados Unidos',o:'Estados Unidos da América',f:'🇺🇸',r:'americas',i:'us'},
  {c:'Estônia',o:'República da Estônia',f:'🇪🇪',r:'europe',i:'ee'},
  {c:'Filipinas',o:'República das Filipinas',f:'🇵🇭',r:'asia',i:'ph'},
  {c:'Finlândia',o:'República da Finlândia',f:'🇫🇮',r:'europe',i:'fi'},
  {c:'França',o:'República Francesa',f:'🇫🇷',r:'europe',i:'fr'},
  {c:'Guatemala',o:'República da Guatemala',f:'🇬🇹',r:'americas',i:'gt'},
  {c:'Guiana',o:'República Cooperativa da Guiana',f:'🇬🇾',r:'americas',i:'gy'},
  {c:'Haiti',o:'República do Haiti',f:'🇭🇹',r:'americas',i:'ht'},
  {c:'Honduras',o:'República de Honduras',f:'🇭🇳',r:'americas',i:'hn'},
  {c:'Índia',o:'República da Índia',f:'🇮🇳',r:'asia',i:'in'},
  {c:'Indonésia',o:'República da Indonésia',f:'🇮🇩',r:'asia',i:'id'},
  {c:'Irã',o:'República Islâmica do Irã',f:'🇮🇷',r:'mideast',i:'ir'},
  {c:'Israel',o:'Estado de Israel',f:'🇮🇱',r:'mideast',i:'il'},
  {c:'Itália',o:'República Italiana',f:'🇮🇹',r:'europe',i:'it'},
  {c:'Jamaica',o:'Jamaica',f:'🇯🇲',r:'americas',i:'jm'},
  {c:'Japão',o:'Estado do Japão',f:'🇯🇵',r:'asia',i:'jp'},
  {c:'Marrocos',o:'Reino de Marrocos',f:'🇲🇦',r:'africa',i:'ma'},
  {c:'México',o:'Estados Unidos Mexicanos',f:'🇲🇽',r:'americas',i:'mx'},
  {c:'Nicarágua',o:'República da Nicarágua',f:'🇳🇮',r:'americas',i:'ni'},
  {c:'Nigéria',o:'República Federal da Nigéria',f:'🇳🇬',r:'africa',i:'ng'},
  {c:'Países Baixos',o:'Reino dos Países Baixos',f:'🇳🇱',r:'europe',i:'nl'},
  {c:'Panamá',o:'República do Panamá',f:'🇵🇦',r:'americas',i:'pa'},
  {c:'Paraguai',o:'República do Paraguai',f:'🇵🇾',r:'americas',i:'py'},
  {c:'Peru',o:'República do Peru',f:'🇵🇪',r:'americas',i:'pe'},
  {c:'Portugal',o:'República Portuguesa',f:'🇵🇹',r:'europe',i:'pt'},
  {c:'Quênia',o:'República do Quênia',f:'🇰🇪',r:'africa',i:'ke'},
  {c:'Reino Unido',o:'Reino Unido da Grã-Bretanha e Irlanda do Norte',f:'🇬🇧',r:'europe',i:'gb'},
  {c:'República Dominicana',o:'República Dominicana',f:'🇩🇴',r:'americas',i:'do'},
  {c:'Rússia',o:'Federação Russa',f:'🇷🇺',r:'europe',i:'ru'},
  {c:'Singapura',o:'República de Singapura',f:'🇸🇬',r:'asia',i:'sg'},
  {c:'Suécia',o:'Reino da Suécia',f:'🇸🇪',r:'europe',i:'se'},
  {c:'Suriname',o:'República do Suriname',f:'🇸🇷',r:'americas',i:'sr'},
  {c:'Tailândia',o:'Reino da Tailândia',f:'🇹🇭',r:'asia',i:'th'},
  {c:'Trinidad e Tobago',o:'República de Trinidad e Tobago',f:'🇹🇹',r:'americas',i:'tt'},
  {c:'Turquia',o:'República da Turquia',f:'🇹🇷',r:'europe',i:'tr'},
  {c:'Uruguai',o:'República Oriental do Uruguai',f:'🇺🇾',r:'americas',i:'uy'},
  {c:'Venezuela',o:'República Bolivariana da Venezuela',f:'🇻🇪',r:'americas',i:'ve'}
];
const CSNU_MEMBERS=['China','Estados Unidos','França','Reino Unido','Rússia','Brasil','Índia','Quênia','México','Emirados Árabes Unidos'];

/* ══════════════════════════════════════════════════════
   CÂMARA DOS DEPUTADOS — representações
   voto: true = com direito de voto; cat = categoria
   ══════════════════════════════════════════════════════ */
const CAMARA=[
  {c:'Dep. Aguinaldo Ribeiro',sub:'PP',voto:true,cat:'Parlamentar'},
  {c:'Dep. Augusto Coutinho',sub:'Republicanos',voto:true,cat:'Parlamentar'},
  {c:'Dep. Baleia Rossi',sub:'MDB',voto:true,cat:'Parlamentar'},
  {c:'Dep. Carlos Jordy',sub:'PL',voto:true,cat:'Parlamentar'},
  {c:'Dep. Coronel Meira',sub:'PL',voto:true,cat:'Parlamentar'},
  {c:'Dep. Dani Cunha',sub:'PL',voto:true,cat:'Parlamentar'},
  {c:'Dep. Elmar Nascimento',sub:'União Brasil',voto:true,cat:'Parlamentar'},
  {c:'Dep. Isnaldo Bulhões',sub:'MDB',voto:true,cat:'Parlamentar'},
  {c:'Dep. Julia Zanatta',sub:'PL',voto:true,cat:'Parlamentar'},
  {c:'Dep. Lindbergh Farias',sub:'PT',voto:true,cat:'Parlamentar'},
  {c:'Dep. Luiz Gastão',sub:'PSD',voto:true,cat:'Parlamentar'},
  {c:'Dep. Marcel Van Hattem',sub:'Novo',voto:true,cat:'Parlamentar'},
  {c:'Dep. Nikolas Ferreira',sub:'PL',voto:true,cat:'Parlamentar'},
  {c:'Dep. Paulo Teixeira',sub:'PT',voto:true,cat:'Parlamentar'},
  {c:'Dep. Reimont',sub:'PT',voto:true,cat:'Parlamentar'},
  {c:'Dep. Sâmia Bomfim',sub:'PSOL',voto:true,cat:'Parlamentar'},
  {c:'Dep. Talíria Petrone',sub:'PSOL',voto:true,cat:'Parlamentar'},
  {c:'Gov. Federal - Luiz Marinho',sub:'Ministro do Trabalho e Emprego',voto:false,cat:'Governo Federal'},
  {c:'Plataforma digital - iFood',sub:'Plataforma digital',voto:false,cat:'Plataforma Digital'},
  {c:'Plataforma digital - Uber',sub:'Plataforma digital',voto:false,cat:'Plataforma Digital'},
  {c:'Soc. Civil - Amobitec',sub:'Associação Brasileira de Mobilidade e Tecnologia',voto:false,cat:'Sociedade Civil'},
  {c:'Soc. Civil - ANEA',sub:'Aliança Nacional dos Entregadores por Aplicativos',voto:false,cat:'Sociedade Civil'},
  {c:'Soc. Civil - Breque Nacional',sub:'Movimento nacional de entregadores e motoboys',voto:false,cat:'Sociedade Civil'},
  {c:'Soc. Civil - CUT',sub:'Central Única dos Trabalhadores',voto:false,cat:'Sociedade Civil'},
  {c:'Soc. Civil - FENASMAPP',sub:'Federação Nacional dos Sindicatos de Motoristas por Aplicativos',voto:false,cat:'Sociedade Civil'}
];

/* Committee registry — defines the 4 committees and their data source */
const COMMITTEES={
  camara:{
    name:'Câmara dos Deputados',
    theme:'PLP 152/2025 — Regulamentação do Trabalho por Aplicativos no Brasil',
    type:'camara'
  },
  unodc:{
    name:'UNODC',
    theme:'Vulnerabilidade Juvenil e Expansão do Uso de Drogas: O Crescente Uso de Cannabis',
    type:'onu'
  },
  oea:{
    name:'OEA',
    theme:'Segurança regional nas Américas: desafios do crime organizado transnacional, intervenções externas e cooperação interamericana',
    type:'onu'
  },
  unesco:{
    name:'UNESCO',
    theme:'Impactos Educacionais do uso de IAs na Formação e Desenvolvimento da Juventude',
    type:'onu'
  }
};

/* ══════════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════════ */
let S={
  config:{conference:'SimSD 2026',committee:'CSNU',session:'1ª Sessão',defaultTime:60,warnTime:15},
  committeeCountries:[],
  presence:{}, speeches:{}, speakTime:{},
  speakers:[],curIdx:0,history:[],turnStartSec:60,
  timer:{sec:60,total:60,running:false,iv:null},
  motions:[],
  votes:{},voteConfig:{type:'procedimental',majority:'simples'},
  voteHistory:[],
  customNames:{},
  presenceConfirmed:false,
  sessionEnded:false,
  agenda:'nenhuma agenda foi adotada',
  activeTab:'gsl',
  mod:{totalSec:900,totalTotal:900,spkSec:60,spkTotal:60,running:false,iv:null,spks:[],cur:0},
  unmod:{sec:600,total:600,running:false,iv:null},
  solo:{sec:60,total:60,running:false,iv:null,code:'',flag:''},
  caucusTarget:'mod',
  setupDone:false,
  committeeKey:null,
  committeeType:'onu',
  regionFilter:'all',
  selectedSetup:new Set(),
};

function load(){
  try{
    const d=localStorage.getItem('simsd-v4');
    if(d){
      const p=JSON.parse(d);
      // Preserve default nested objects, then overlay saved values (deep-safe).
      const defConfig={...S.config}, defTimer={...S.timer}, defMod={...S.mod},
            defUnmod={...S.unmod}, defSolo={...S.solo}, defVoteConfig={...S.voteConfig};
      Object.assign(S,p);
      // Re-merge nested objects so newly-added fields are never lost to stale saves.
      S.config={...defConfig,...(p.config||{})};
      S.timer={...defTimer,...(p.timer||{})};
      S.mod={...defMod,...(p.mod||{})};
      S.unmod={...defUnmod,...(p.unmod||{})};
      S.solo={...defSolo,...(p.solo||{})};
      S.voteConfig={...defVoteConfig,...(p.voteConfig||{})};
      // Guarantee collections exist.
      S.presence=S.presence||{}; S.speeches=S.speeches||{}; S.speakTime=S.speakTime||{};
      S.votes=S.votes||{}; S.motions=S.motions||[]; S.history=S.history||[];
      S.speakers=S.speakers||[]; S.voteHistory=S.voteHistory||[];
      S.committeeCountries=S.committeeCountries||[];
      if(!Array.isArray(S.mod.spks))S.mod.spks=[];
      if(typeof S.mod.cur!=='number')S.mod.cur=0;
      if(typeof S.curIdx!=='number')S.curIdx=0;
      S.selectedSetup=new Set(p.selectedSetupArr||[]);
      ['timer','mod','unmod','solo'].forEach(k=>{if(S[k]){S[k].running=false;S[k].iv=null;}});
    }
  }catch(e){}
}
function save(){
  try{
    const cp={...S,
      selectedSetupArr:[...S.selectedSetup],
      timer:{...S.timer,running:false,iv:null},
      mod:{...S.mod,running:false,iv:null},
      unmod:{...S.unmod,running:false,iv:null},
      solo:{...S.solo,running:false,iv:null}
    };
    localStorage.setItem('simsd-v4',JSON.stringify(cp));
  }catch(e){}
}
function fmt(s){const m=Math.floor(Math.max(0,s)/60),x=Math.max(0,s)%60;return`${m}:${String(x).padStart(2,'0')}`;}

// Returns a flag IMAGE (reliable on Windows where emoji flags don't render).
// Fallback to emoji is handled globally by the 'error' listener below — this
// keeps the generated HTML clean (no fragile escaped quotes in onerror).
function isoOf(name){const c=CTRY.find(x=>x.c===name);return c?c.i:null;}
/* Find a participant by name. Works for BOTH ONU countries and Câmara representations.
   Searches the active committee roster first (covers Câmara), falls back to CTRY. */
function rosterFind(code){
  if(S.committeeCountries&&S.committeeCountries.length){
    const m=S.committeeCountries.find(x=>x.c===code);
    if(m)return m;
  }
  return CTRY.find(x=>x.c===code)||null;
}
/* Display name for a participant code. Câmara editable rows store a custom
   label in S.customNames; everything else uses disp || code. */
function dispName(code){
  if(S.customNames && S.customNames[code]) return S.customNames[code];
  const m=rosterFind(code);
  return (m && (m.disp||m.c)) || code;
}
// Committee-aware wording: returns Câmara term when in Câmara, else ONU term.
function isCamaraCte(){ return S.committeeType==='camara'; }
function termRep(cap){ return isCamaraCte()?(cap?'Representação':'representação'):(cap?'País':'país'); }
function termReps(cap){ return isCamaraCte()?(cap?'Representações':'representações'):(cap?'Países':'países'); }
function selectPrompt(){ return isCamaraCte()?'Selecione a representação...':'Selecione o país...'; }
// Custom flag overrides (countries flagcdn doesn't serve the desired variant for)
const FLAG_OVERRIDE={'af':'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MCA0MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIGZpbGw9IiNmZmZmZmYiLz48dGV4dCB4PSIzMCIgeT0iMTgiIGZvbnQtZmFtaWx5PSInTm90byBOYXNraCBBcmFiaWMnLCdBbWlyaScsJ1NjaGVoZXJhemFkZSBOZXcnLCdBcmlhbCcsc2VyaWYiIGZvbnQtc2l6ZT0iOC41IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMDAwMDAwIiBmb250LXdlaWdodD0iNzAwIiB0ZXh0TGVuZ3RoPSI0OCIgbGVuZ3RoQWRqdXN0PSJzcGFjaW5nQW5kR2x5cGhzIj7ZhNinINil2YTZhyDYpdmE2Kcg2KfZhNmE2Yc8L3RleHQ+PHRleHQgeD0iMzAiIHk9IjMwIiBmb250LWZhbWlseT0iJ05vdG8gTmFza2ggQXJhYmljJywnQW1pcmknLCdTY2hlaGVyYXphZGUgTmV3JywnQXJpYWwnLHNlcmlmIiBmb250LXNpemU9IjcuNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzAwMDAwMCIgZm9udC13ZWlnaHQ9IjcwMCIgdGV4dExlbmd0aD0iNDQiIGxlbmd0aEFkanVzdD0ic3BhY2luZ0FuZEdseXBocyI+2YXYrdmF2K8g2LHYs9mI2YQg2KfZhNmE2Yc8L3RleHQ+PC9zdmc+Cg=='};

function flagImg(country,flag,iso,size){
  size=size||22;
  const code=iso||isoOf(country)||'';
  const fb=flag||'🏳️';
  if(!code){
    if(fb==='🏛️') return `<span class="material-icons" style="font-size:${size}px;vertical-align:middle;">account_balance</span>`;
    if(fb==='🌐') return `<span class="material-icons" style="font-size:${size}px;vertical-align:middle;">public</span>`;
    if(fb==='🏳️') return `<span class="material-icons" style="font-size:${size}px;vertical-align:middle;">flag</span>`;
    return `<span class="flag-emoji" style="font-size:${size}px">${fb}</span>`;
  }
  const w=Math.round(size*1.45);
  const src=FLAG_OVERRIDE[code]||`https://flagcdn.com/h40/${code}.png`;
  return `<img class="flagimg" src="${src}" `+
    `data-fallback="${fb}" data-size="${size}" `+
    `style="width:${w}px;height:${size}px;border-radius:3px;object-fit:cover;box-shadow:0 0 0 1px rgba(0,0,0,.08);vertical-align:middle">`;
}

// Global, safe image-error fallback: replaces broken flag image with emoji span or Material Icon.
document.addEventListener('error', function(e){
  const img=e.target;
  if(img && img.tagName==='IMG' && img.classList.contains('flagimg') && !img.dataset.failed){
    img.dataset.failed='1';
    const size=img.dataset.size||'22';
    const fb=img.dataset.fallback||'🏳️';
    
    let replacement;
    if(fb==='🏛️'){
      replacement=document.createElement('span');
      replacement.className='material-icons';
      replacement.style.fontSize=size+'px';
      replacement.style.verticalAlign='middle';
      replacement.textContent='account_balance';
    } else if(fb==='🌐'){
      replacement=document.createElement('span');
      replacement.className='material-icons';
      replacement.style.fontSize=size+'px';
      replacement.style.verticalAlign='middle';
      replacement.textContent='public';
    } else if(fb==='🏳️'){
      replacement=document.createElement('span');
      replacement.className='material-icons';
      replacement.style.fontSize=size+'px';
      replacement.style.verticalAlign='middle';
      replacement.textContent='flag';
    } else {
      replacement=document.createElement('span');
      replacement.className='flag-emoji';
      replacement.style.fontSize=size+'px';
      replacement.textContent=fb;
    }
    
    if(img.parentNode)img.parentNode.replaceChild(replacement,img);
  }
}, true);

/* ══════════════════════════════════════════════════════
   SETUP
   ══════════════════════════════════════════════════════ */
let regionFilterActive='all';

// Returns the active roster (list of selectable participants) for the chosen committee.
// Normalizes to a common shape used across the setup UI.
function activeRoster(){
  if(S.committeeType==='camara'){
    return CAMARA.map(m=>({c:m.c, disp:m.disp||m.c, f:'🏛️', i:null, r:'camara', voto:m.voto, sub:m.sub, cat:m.cat, editable:!!m.editable}));
  }
  return CTRY.map(c=>({c:c.c, f:c.f, i:c.i, r:c.r, voto:true, sub:c.o||null, cat:null}));
}

function chooseCommittee(key){
  const cm=COMMITTEES[key];if(!cm)return;
  S.committeeKey=key;
  S.committeeType=cm.type;
  S.config.committee=cm.name;
  // Pre-fill setup fields
  document.getElementById('s-committee').value=cm.name;
  document.getElementById('setup-title').textContent=cm.name;
  document.getElementById('setup-theme').textContent='Tema: '+cm.theme;
  // Clear any previous selection
  S.selectedSetup=new Set();
  regionFilterActive='all';
  // Configure the selection UI for the committee type
  const isCamara=cm.type==='camara';
  document.getElementById('region-pills').style.display=isCamara?'none':'';
  document.getElementById('selection-title').innerHTML=isCamara?'<span class="material-icons inline-icon">account_balance</span>Representações do Comitê':'<span class="material-icons inline-icon">public</span>Países do Comitê';
  document.getElementById('country-search').placeholder=isCamara?'Buscar representação...':'Buscar país...';
  const chipAll=document.getElementById('chip-all');
  chipAll.textContent=isCamara?'Selecionar todas':'Selecionar todos';
  // Show setup screen
  document.getElementById('committee-screen').classList.add('hidden');
  document.getElementById('setup-screen').classList.remove('hidden');
  renderCountryGrid();
  save();
}
function backToCommittee(){
  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('committee-screen').classList.remove('hidden');
}

function renderCountryGrid(){
  const search=(document.getElementById('country-search')?.value||'').toLowerCase();
  const grid=document.getElementById('country-grid');if(!grid)return;
  const roster=activeRoster();
  const isCamara=S.committeeType==='camara';
  const filtered=roster.filter(c=>{
    const matchR=isCamara||regionFilterActive==='all'||c.r===regionFilterActive;
    const matchS=c.c.toLowerCase().includes(search)||(c.sub&&c.sub.toLowerCase().includes(search));
    return matchR&&matchS;
  });
  grid.innerHTML=filtered.map(c=>{
    const sub=c.sub?`<small>${c.sub}</small>`:'';
    const novote=isCamara&&!c.voto?'<span class="novote-tag">sem voto</span>':'';
    const flag=isCamara?flagImg(c.c,'🏛️',null,16):flagImg(c.c,c.f,c.i,16);
    const label=c.disp||c.c;
    return `<div class="ctry-chip ${S.selectedSetup.has(c.c)?'sel':''}" onclick="toggleSetup('${c.c.replace(/\\/g,"\\\\").replace(/'/g,"\\'")}')" style="${isCamara?'min-height:46px':''}">
      <span class="cf">${flag}</span>
      <span class="cn">${label}${novote}${sub}</span>
    </div>`;
  }).join('');
  document.getElementById('sel-count').textContent=S.selectedSetup.size;
  const totEl=document.getElementById('total-countries');if(totEl)totEl.textContent=roster.length;
  const btn=document.getElementById('btn-start-session');
  btn.disabled=S.selectedSetup.size===0;
  const unit=isCamara?'representaç':'país';
  document.getElementById('setup-note').textContent=
    S.selectedSetup.size===0?(isCamara?'Selecione pelo menos 1 representação para começar':'Selecione pelo menos 1 país para começar'):
    (isCamara?`${S.selectedSetup.size} ${S.selectedSetup.size===1?'representação selecionada':'representações selecionadas'}`
             :`${S.selectedSetup.size} ${S.selectedSetup.size===1?'país selecionado':'países selecionados'}`);
}
function filterRegion(r,el){
  regionFilterActive=r;
  document.querySelectorAll('.rpill').forEach(p=>p.classList.remove('on'));
  el.classList.add('on');
  renderCountryGrid();
}
function toggleSetup(code){
  if(S.selectedSetup.has(code))S.selectedSetup.delete(code);
  else S.selectedSetup.add(code);
  renderCountryGrid();
}
function selectVisible(){
  const search=(document.getElementById('country-search')?.value||'').toLowerCase();
  const isCamara=S.committeeType==='camara';
  activeRoster().filter(c=>(isCamara||regionFilterActive==='all'||c.r===regionFilterActive)&&(c.c.toLowerCase().includes(search)||(c.sub&&c.sub.toLowerCase().includes(search))))
    .forEach(c=>S.selectedSetup.add(c.c));
  renderCountryGrid();
}
function deselectAll(){S.selectedSetup.clear();renderCountryGrid();}
function selectCSNU(){
  if(S.committeeType==='camara')return; // CSNU não se aplica à Câmara
  const valid=new Set(activeRoster().map(c=>c.c));
  CSNU_MEMBERS.forEach(c=>{ if(valid.has(c))S.selectedSetup.add(c); });
  renderCountryGrid();
}
function selectALL193(){activeRoster().forEach(c=>S.selectedSetup.add(c.c));renderCountryGrid();}

function startSession(){
  if(S.selectedSetup.size===0)return;
  const roster=activeRoster();
  S.committeeCountries=roster.filter(c=>S.selectedSetup.has(c.c));
  S.config.conference=document.getElementById('s-conf').value.trim()||'SimSD 2026';
  S.config.committee=document.getElementById('s-committee').value.trim()||'Comitê';
  S.config.session=document.getElementById('s-session').value.trim()||'1ª Sessão';
  S.config.defaultTime=parseInt(document.getElementById('s-time').value)||60;
  S.config.warnTime=parseInt(document.getElementById('s-warn').value)||15;
  // Reset all session-scoped data so leftovers from a previous committee/session
  // never leak into the new one.
  stopAll();
  S.presence={};
  S.speeches={};
  S.speakTime={};
  S.speakers=[]; S.curIdx=0; S.turnStartSec=S.config.defaultTime;
  S.history=[];
  S.motions=[];
  S.votes={}; S.voteHistory=[];
  S.customNames={};
  S.mod={totalSec:900,totalTotal:900,spkSec:60,spkTotal:60,running:false,iv:null,spks:[],cur:0};
  S.unmod={sec:600,total:600,running:false,iv:null};
  S.timer={sec:S.config.defaultTime,total:S.config.defaultTime,running:false,iv:null};
  // Presence default: voting members present-voting; non-voting present (no vote)
  S.committeeCountries.forEach(c=>{
    S.presence[c.c]=(c.voto===false)?'presente':'ausente';
    S.speeches[c.c]=0;
  });
  S.setupDone=true;
  S.activeTab='presence';
  S.presenceConfirmed=false;
  S.sessionEnded=false;
  // Offer to resume the speaker order from a previously ended session of this committee
  try{
    const snaps=loadOrderSnapshots();
    const key=S.committeeKey||S.committeeType||'comite';
    const snap=snaps[key];
    if(snap && snap.speakers && snap.speakers.length){
      const valid=new Set(S.committeeCountries.map(c=>c.c));
      const restored=snap.speakers.filter(s=>valid.has(s.c));
      if(restored.length && confirm('Há uma ordem de discursos registrada de uma sessão anterior deste comitê ('+restored.length+' orador(es)). Deseja continuar a partir dela?')){
        S.speakers=restored.map(s=>{const m=rosterFind(s.c)||{};return {c:s.c,f:m.f||s.f,i:m.i||s.i};});
        S.curIdx=Math.min(snap.curIdx||0, Math.max(0,S.speakers.length-1));
      }
    }
  }catch(e){}
  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('committee-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.add('visible');
  initApp();
  save();
}
function goSetup(){
  stopAll();
  document.getElementById('app-screen').classList.remove('visible');
  document.getElementById('setup-screen').classList.remove('hidden');
  renderCountryGrid();
}
function stopAll(){
  ['timer','mod','unmod','solo'].forEach(k=>{if(S[k]&&S[k].running){clearInterval(S[k].iv);S[k].running=false;}});
  document.getElementById('btn-gsl-pp').textContent='play_arrow';
  document.getElementById('btn-mod-pp').textContent='play_arrow';
  document.getElementById('btn-unmod-pp').textContent='play_arrow';
  document.getElementById('btn-solo-pp').textContent='play_arrow';
}
/* Persist the current speaker order keyed by committee so a future session of the
   same committee can resume from where it left off. Snapshots are stored separately
   from the live state, so resetting/starting a new session won't erase them. */
const ORDER_KEY='simsd-order-snapshots';
function loadOrderSnapshots(){
  try{ return JSON.parse(localStorage.getItem(ORDER_KEY)||'{}'); }catch(e){ return {}; }
}
function saveOrderSnapshot(){
  try{
    const all=loadOrderSnapshots();
    const key=S.committeeKey||S.committeeType||'comite';
    all[key]={
      speakers:S.speakers.map(s=>({c:s.c,f:s.f,i:s.i})),
      curIdx:S.curIdx,
      committee:S.config.committee,
      session:S.config.session,
      savedAt:new Date().toISOString()
    };
    localStorage.setItem(ORDER_KEY,JSON.stringify(all));
  }catch(e){}
}
function encerrarSessao(){
  if(!confirm('Encerrar a sessão? Será gerado o relatório completo e a ordem atual dos discursos será registrada para que você possa continuar em uma nova sessão deste mesmo comitê.'))return;
  // 1) Record the speaker order for later resumption
  saveOrderSnapshot();
  // 2) Mark session as closed and persist
  S.sessionEnded=true;
  save();
  // 3) Generate the full report
  generateReport();
}
function resetSession(){
  if(!confirm('Resetar a sessão? Isso vai APAGAR todos os oradores, presença, moções, votos e histórico, limpar o cache da página e voltar à tela de configuração inicial. Esta ação não pode ser desfeita.'))return;
  stopAll();
  // Clear all local data
  try{localStorage.removeItem('simsd-v4');}catch(e){}
  try{localStorage.clear();}catch(e){}
  try{sessionStorage.clear();}catch(e){}
  // Clear any cached storage (service worker / Cache API), then hard-reload
  const done=()=>{ location.reload(); };
  try{
    if(window.caches&&caches.keys){
      caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(done).catch(done);
    } else { done(); }
  }catch(e){ done(); }
}

/* ══════════════════════════════════════════════════════
   APP INIT
   ══════════════════════════════════════════════════════ */
function initApp(){
  document.getElementById('tb-committee').textContent=S.config.committee;
  document.getElementById('tb-session').textContent=S.config.session;
  document.getElementById('agenda-txt').textContent=S.agenda;
  document.getElementById('app-logo').src='logo-alt.png';
  updateMajority();
  populateSelects();
  renderRP();
  renderSpeakers();
  renderMotions();
  renderPresence();
  renderVote();
  updateGslTimer();
  updateModDisplay();
  updateUnmodDisplay();
  initSolo();
  switchTab(S.activeTab||'gsl');
}

/* ══════════════════════════════════════════════════════
   TABS
   ══════════════════════════════════════════════════════ */
function switchTab(name){
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tb').forEach(b=>b.classList.remove('on'));
  document.getElementById('tab-'+name)?.classList.add('active');
  document.getElementById('tb-'+name)?.classList.add('on');
  const showRight=['gsl','mod'].includes(name);
  document.getElementById('right-panel').style.display=showRight?'flex':'none';
  document.getElementById('rp-header').textContent=name==='mod'?'Acrescentar Orador (Mod.)':'Acrescentar Orador';
  const statusMap={gsl:'Lista de Discursos',motions:'Moções',mod:'Sessão Moderada',unmod:'Sessão Não-Moderada',solo:'Orador Único',vote:'Votação',presence:'Presença'};
  document.getElementById('status-pill').textContent=statusMap[name]||name;
  S.activeTab=name;save();
  if(name==='presence')renderPresence();
  if(name==='vote')renderVote();
  if(name==='mod'){updateModDisplay();renderModList();}
  if(name==='gsl'){renderSpeakers();}
  renderRP();
}

/* ══════════════════════════════════════════════════════
   INLINE EDIT (topbar)
   ══════════════════════════════════════════════════════ */
function inlineEdit(field){
  if(field==='committee'){
    document.getElementById('tb-committee').style.display='none';
    const i=document.getElementById('tb-committee-inp');i.value=S.config.committee;i.style.display='';i.focus();i.select();
  } else if(field==='session'){
    document.getElementById('tb-session').style.display='none';
    const i=document.getElementById('tb-session-inp');i.value=S.config.session;i.style.display='';i.focus();i.select();
  } else {
    document.getElementById('agenda-txt').style.display='none';
    const i=document.getElementById('agenda-inp');i.value=S.agenda;i.style.display='';i.focus();i.select();
  }
}
function saveInline(field){
  if(field==='committee'){
    S.config.committee=(document.getElementById('tb-committee-inp').value.trim()||'Comitê');
    document.getElementById('tb-committee').textContent=S.config.committee;
    document.getElementById('tb-committee').style.display='';
    document.getElementById('tb-committee-inp').style.display='none';
  } else if(field==='session'){
    S.config.session=(document.getElementById('tb-session-inp').value.trim()||'—');
    document.getElementById('tb-session').textContent=S.config.session;
    document.getElementById('tb-session').style.display='';
    document.getElementById('tb-session-inp').style.display='none';
  } else {
    S.agenda=(document.getElementById('agenda-inp').value.trim()||'nenhuma agenda foi adotada');
    document.getElementById('agenda-txt').textContent=S.agenda;
    document.getElementById('agenda-txt').style.display='';
    document.getElementById('agenda-inp').style.display='none';
  }
  save();
}

/* ══════════════════════════════════════════════════════
   CONFIG PANEL
   ══════════════════════════════════════════════════════ */
function openCfg(){
  document.getElementById('c-conf').value=S.config.conference;
  document.getElementById('c-committee').value=S.config.committee;
  document.getElementById('c-session').value=S.config.session;
  document.getElementById('c-time').value=S.config.defaultTime;
  document.getElementById('c-warn').value=S.config.warnTime;
  openPanel('cfg-panel');
}
function saveConfig(){
  S.config.conference=document.getElementById('c-conf').value.trim()||'Sim SD';
  S.config.committee=document.getElementById('c-committee').value.trim();
  S.config.session=document.getElementById('c-session').value.trim();
  S.config.defaultTime=parseInt(document.getElementById('c-time').value)||60;
  S.config.warnTime=parseInt(document.getElementById('c-warn').value)||15;
  S.timer.total=S.config.defaultTime;S.timer.sec=S.config.defaultTime;
  document.getElementById('tb-committee').textContent=S.config.committee;
  document.getElementById('tb-session').textContent=S.config.session;
  closePanel('cfg-panel');updateGslTimer();save();
}
function openPanel(id){
  ['cfg-panel','vote-panel','caucus-panel'].forEach(p=>document.getElementById(p).classList.remove('open'));
  document.getElementById(id).classList.add('open');
}
function closePanel(id){document.getElementById(id).classList.remove('open');}

/* ══════════════════════════════════════════════════════
   MAJORITY
   ══════════════════════════════════════════════════════ */
function updateMajority(){
  const countries=S.committeeCountries;
  // Only members WITH voting rights count toward majority/quorum
  const tot=countries.filter(c=>S.presence[c.c]!=='ausente' && c.voto!==false).length;
  const ms=tot>0?Math.floor(tot/2)+1:0;
  const mq=tot>0?Math.ceil(tot*2/3):0;
  document.getElementById('mb-ms').textContent=tot>0?ms:'—';
  document.getElementById('mb-mq').textContent=tot>0?mq:'—';
  document.getElementById('mb-tot').textContent=tot;
}

/* ══════════════════════════════════════════════════════
   GSL TIMER
   ══════════════════════════════════════════════════════ */
function updateGslTimer(){
  const{sec,total}=S.timer;
  const d=document.getElementById('gsl-timer'),b=document.getElementById('gsl-bar');
  if(!d)return;
  d.textContent=fmt(sec);
  b.style.width=(sec/total*100)+'%';
  const w=S.config.warnTime||15;
  if(sec<=0){d.className='timer-display danger';b.className='timer-bar danger';}
  else if(sec<=w){d.className='timer-display warn';b.className='timer-bar warn';}
  else{d.className='timer-display';b.className='timer-bar';}
}
function gslPP(){
  if(S.timer.running){
    clearInterval(S.timer.iv);S.timer.running=false;
    document.getElementById('btn-gsl-pp').textContent='play_arrow';
  } else {
    if(!S.speakers.length)return;
    S.timer.running=true;
    document.getElementById('btn-gsl-pp').textContent='pause';
    S.timer.iv=setInterval(()=>{
      if(S.timer.sec<=0){clearInterval(S.timer.iv);S.timer.running=false;document.getElementById('btn-gsl-pp').textContent='play_arrow';gslNext();return;}
      S.timer.sec--;updateGslTimer();
    },1000);
  }
}
function gslReset(){clearInterval(S.timer.iv);S.timer.running=false;document.getElementById('btn-gsl-pp').textContent='play_arrow';S.timer.sec=S.timer.total;S.turnStartSec=S.timer.total;updateGslTimer();}
function gslStop(){
  // "Parar": finaliza o discurso do orador atual, registrando o tempo falado
  // no histórico e encerrando o turno (igual a "Próximo Orador").
  if(S.speakers.length && S.speakers[S.curIdx]){
    gslNext();
  } else {
    gslReset();
  }
}
function gslPreset(sec,el){gslReset();S.timer.total=sec;S.timer.sec=sec;S.turnStartSec=sec;document.querySelectorAll('.pchip').forEach(p=>p.classList.remove('on'));if(el)el.classList.add('on');updateGslTimer();save();}
function gslCustom(){const v=parseInt(document.getElementById('ct-sec').value);if(isNaN(v)||v<5)return;gslReset();S.timer.total=v;S.timer.sec=v;S.turnStartSec=v;document.querySelectorAll('.pchip').forEach(p=>p.classList.remove('on'));updateGslTimer();save();document.getElementById('ct-sec').value='';}
function gslNext(){
  clearInterval(S.timer.iv);S.timer.running=false;document.getElementById('btn-gsl-pp').textContent='play_arrow';
  if(!S.speakers.length)return;
  const cur=S.speakers[S.curIdx];
  const spent=S.turnStartSec - S.timer.sec;   // how long the current speaker actually spoke
  recordSpeech(cur, spent, {received:cur.receivedFrom||null, receivedFlag:cur.receivedFromFlag||null});
  S.speakers.splice(S.curIdx,1);
  if(S.curIdx>=S.speakers.length&&S.speakers.length>0)S.curIdx=0;
  S.timer.sec=S.timer.total;        // fresh time for the next speaker
  S.turnStartSec=S.timer.total;     // their turn starts now
  const yb=document.getElementById('yield-box');if(yb)yb.style.display='none';
  updateGslTimer();renderSpeakers();renderRP();renderHistory();save();
}
function toggleYield(){
  const box=document.getElementById('yield-box');
  if(!S.speakers.length){return;}
  const open=box.style.display!=='none';
  if(open){box.style.display='none';return;}
  // populate yield country select (exclude current speaker)
  const cur=S.speakers[S.curIdx];
  const sel=document.getElementById('yield-country-sel');
  sel.innerHTML='<option value="">'+selectPrompt()+'</option>'+
    S.committeeCountries.filter(c=>!cur||c.c!==cur.c).map(c=>`<option value="${c.c}">${isCamaraCte()?'':c.f+' '}${dispName(c.c)}${c.sub?' ('+c.sub+')':''}</option>`).join('');
  box.style.display='';
}
// Records a finished speech. timeSpent = seconds actually spoken during this turn.
function recordSpeech(cur, timeSpent, opts){
  if(!cur)return;
  opts=opts||{};
  const secs=Math.max(0, timeSpent||0);
  S.speeches[cur.c]=(S.speeches[cur.c]||0)+1;
  S.speakTime=S.speakTime||{};
  S.speakTime[cur.c]=(S.speakTime[cur.c]||0)+secs;
  S.history.unshift({
    c:cur.c, f:cur.f,
    t:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
    sec: secs,
    yielded: opts.yielded||false,
    yieldedFlag: opts.yieldedFlag||null,
    received: opts.received||null,
    receivedFlag: opts.receivedFlag||null
  });
  if(S.history.length>120)S.history.pop();
}
function yieldToChair(){
  // Current speaker spoke, then yields remaining time back to the Chair (turn ends).
  clearInterval(S.timer.iv);S.timer.running=false;document.getElementById('btn-gsl-pp').textContent='play_arrow';
  const cur=S.speakers[S.curIdx];
  if(!cur)return;
  const spent=S.turnStartSec - S.timer.sec;
  recordSpeech(cur, spent, {yielded:'chair', received:cur.receivedFrom||null, receivedFlag:cur.receivedFromFlag||null});
  S.speakers.splice(S.curIdx,1);
  if(S.curIdx>=S.speakers.length&&S.speakers.length>0)S.curIdx=0;
  S.timer.sec=S.timer.total;
  S.turnStartSec=S.timer.total;
  document.getElementById('yield-box').style.display='none';
  updateGslTimer();renderSpeakers();renderRP();renderHistory();save();
}
function yieldToCountry(){
  const code=document.getElementById('yield-country-sel').value;
  if(!code){return;}
  const cc=rosterFind(code);if(!cc)return;
  clearInterval(S.timer.iv);S.timer.running=false;document.getElementById('btn-gsl-pp').textContent='play_arrow';
  const cur=S.speakers[S.curIdx];
  if(!cur)return;
  // A (current) spoke up to now, then yields the REMAINING time to B.
  const spent=S.turnStartSec - S.timer.sec;
  recordSpeech(cur, spent, {yielded:code, yieldedFlag:cc.f, received:cur.receivedFrom||null, receivedFlag:cur.receivedFromFlag||null});
  // B becomes the current speaker and continues on the remaining clock.
  // B is NOT recorded yet — B will be recorded when B finishes (next / yield),
  // carrying a "received from A" note. The clock keeps its current value.
  S.speakers[S.curIdx]={c:cc.c, f:cc.f, receivedFrom:cur.c, receivedFromFlag:cur.f};
  S.turnStartSec=S.timer.sec;   // B's turn starts at the current remaining time
  document.getElementById('yield-box').style.display='none';
  updateGslTimer();renderSpeakers();renderRP();renderHistory();save();
}
function clearHistory(){S.history=[];renderHistory();save();}

/* ══════════════════════════════════════════════════════
   SPEAKERS
   ══════════════════════════════════════════════════════ */
function addSpeaker(code){
  const cc=rosterFind(code);if(!cc)return;
  const target=S.activeTab==='mod'?'mod':'gsl';
  if(target==='mod'){S.mod.spks.push({c:cc.c,f:cc.f});renderModList();}
  else{S.speakers.push({c:cc.c,f:cc.f});renderSpeakers();}
  renderRP();save();
}
function removeSpk(i){S.speakers.splice(i,1);if(S.curIdx>=S.speakers.length&&S.speakers.length>0)S.curIdx=0;renderSpeakers();renderRP();save();}

/* ══════════════════════════════════════════════════════
   DRAG & DROP — reorder speakers in the queue
   ══════════════════════════════════════════════════════ */
let dragFromIdx=null, dragList=null;
function dragStart(e,idx){ dragFromIdx=idx; dragList='gsl'; e.dataTransfer.effectAllowed='move'; try{e.dataTransfer.setData('text/plain',String(idx));}catch(_){} e.currentTarget.classList.add('dragging'); }
function dragStartMod(e,idx){ dragFromIdx=idx; dragList='mod'; e.dataTransfer.effectAllowed='move'; try{e.dataTransfer.setData('text/plain',String(idx));}catch(_){} e.currentTarget.classList.add('dragging'); }
function dragOver(e,idx){ e.preventDefault(); e.dataTransfer.dropEffect='move'; const row=e.currentTarget; document.querySelectorAll('.spk-row.drop-target').forEach(r=>r.classList.remove('drop-target')); row.classList.add('drop-target'); }
function dragLeave(e){ e.currentTarget.classList.remove('drop-target'); }
function dragEnd(e){ document.querySelectorAll('.spk-row.dragging,.spk-row.drop-target').forEach(r=>r.classList.remove('dragging','drop-target')); dragFromIdx=null; dragList=null; }
function dropRow(e,toIdx){
  e.preventDefault();
  if(dragFromIdx===null||dragList!=='gsl'){dragEnd(e);return;}
  moveInArray(S.speakers, dragFromIdx, toIdx);
  dragEnd(e);
  renderSpeakers(); save();
}
function dropRowMod(e,toIdx){
  e.preventDefault();
  if(dragFromIdx===null||dragList!=='mod'){dragEnd(e);return;}
  moveInArray(S.mod.spks, dragFromIdx, toIdx);
  dragEnd(e);
  renderModList(); save();
}
function moveInArray(arr, from, to){
  if(from===to||from<0||to<0||from>=arr.length||to>=arr.length)return;
  const [item]=arr.splice(from,1);
  arr.splice(to,0,item);
}
function renderSpeakers(){
  const cur=S.speakers[S.curIdx];
  document.getElementById('gsl-cur-flag').innerHTML=cur?flagImg(cur.c,cur.f,null,26):'<span class="material-icons" style="font-size:26px;vertical-align:middle;">account_balance</span>';
  document.getElementById('gsl-cur-name').textContent=cur?dispName(cur.c):'Nenhum orador';
  document.getElementById('gsl-cur-meta').textContent=cur?`${S.speeches[cur.c]||0} discurso(s) nesta sessão`:'';
  document.getElementById('queue-badge').textContent=Math.max(0,S.speakers.length-1);
  const list=document.getElementById('gsl-list');
  if(S.speakers.length<=1){list.innerHTML='<div class="empty"><div class="empty-icon material-icons">reorder</div><div class="empty-txt" id="empty-add-txt">Clique à direita para adicionar</div></div>';return;}
  list.innerHTML=S.speakers.slice(1).map((s,i)=>`
    <div class="spk-row" draggable="true"
         ondragstart="dragStart(event,${i+1})"
         ondragover="dragOver(event,${i+1})"
         ondragleave="dragLeave(event)"
         ondrop="dropRow(event,${i+1})"
         ondragend="dragEnd(event)"
         data-idx="${i+1}">
      <span class="spk-num">${i+2}</span>
      <span class="spk-flag">${flagImg(s.c,s.f,null,19)}</span>
      <span class="spk-name">${dispName(s.c)}</span>
      <span class="spk-speech-count">${S.speeches[s.c]||0} disc.</span>
      <button class="btn-rm" onclick="removeSpk(${i+1})"><span class="material-icons" style="font-size:12px;">close</span></button>
      <span class="drag-handle material-icons" title="Arraste para reordenar">drag_indicator</span>
    </div>`).join('');
}
function renderHistory(){
  const el=document.getElementById('history-list');if(!el)return;
  if(!S.history.length){el.innerHTML='<div class="empty" style="padding:.75rem"><div class="empty-txt">Nenhum discurso ainda</div></div>';return;}
  el.innerHTML=S.history.map(h=>{
    let tags='';
    if(h.received)tags+=`<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;color:var(--green);background:var(--green-pale);border:1px solid var(--green-mid);border-radius:9px;padding:1px 6px">recebeu de ${flagImg(h.received,h.receivedFlag,null,12)} ${h.received}</span>`;
    if(h.yielded==='chair')tags+=`<span style="font-size:10px;color:var(--gold);background:var(--gold-pale);border:1px solid var(--gold-mid);border-radius:9px;padding:1px 6px">cedeu ao Chair</span>`;
    else if(h.yielded)tags+=`<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;color:var(--gold);background:var(--gold-pale);border:1px solid var(--gold-mid);border-radius:9px;padding:1px 6px">cedeu a ${flagImg(h.yielded,h.yieldedFlag,null,12)} ${h.yielded}</span>`;
    return `<div class="hist-row">
      <span class="hist-time">${h.t}</span>
      <span style="display:inline-flex;align-items:center">${flagImg(h.c,h.f,null,17)}</span>
      <span style="font-size:13px;font-weight:500">${dispName(h.c)}</span>
      <span style="display:inline-flex;gap:4px">${tags}</span>
      <span style="margin-left:auto;font-size:11px;color:var(--muted2)">${h.sec>0?fmt(h.sec)+' falados':'0:00'}</span>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════
   RIGHT PANEL
   ══════════════════════════════════════════════════════ */
function renderRP(){
  const q=(document.getElementById('rp-search')?.value||'').toLowerCase();
  const inGsl=new Set(S.speakers.map(s=>s.c));
  const inMod=new Set(S.mod.spks.map(s=>s.c));
  const inList=S.activeTab==='mod'?inMod:inGsl;
  const list=S.committeeCountries.filter(c=>dispName(c.c).toLowerCase().includes(q));
  const el=document.getElementById('rp-list');if(!el)return;
  el.innerHTML=list.map(c=>{
    const added=inList.has(c.c);
    const count=S.speeches[c.c]||0;
    const isCamara=S.committeeType==='camara';
    const flag=isCamara?flagImg(c.c,'🏛️',null,16):flagImg(c.c,c.f,c.i,16);
    return `<div class="c-opt ${added?'dim':''}" onclick="addSpeaker('${c.c.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')">
      <span class="c-opt-flag">${flag}</span>
      <span class="c-opt-name">${dispName(c.c)}</span>
      <span class="c-opt-count">${count}</span>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════
   MOTIONS
   ══════════════════════════════════════════════════════ */
const ML={unmod:'Sessão Não-Moderada',mod:'Sessão Moderada',vote:'Votação de Documento',recess:'Recesso',other:'Outra'};
const MC={unmod:'mt-unmod',mod:'mt-mod',vote:'mt-vote',recess:'mt-other',other:'mt-other'};

function addMotion(){
  const type=document.getElementById('mo-type').value;
  const prop=document.getElementById('mo-prop').value;
  const dur=document.getElementById('mo-dur').value;
  const spk=document.getElementById('mo-spk').value;
  if(!prop)return;
  S.motions.unshift({id:Date.now()+'',type,prop,dur,spk,status:'pending',ts:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})});
  renderMotions();save();
}
function voteMotion(id,s){const m=S.motions.find(x=>x.id===id);if(!m)return;m.status=s;renderMotions();save();}
function delMotion(id){S.motions=S.motions.filter(m=>m.id!==id);renderMotions();save();}
function renderMotions(){
  const el=document.getElementById('mo-list');
  if(!el)return;
  if(!S.motions.length){
    el.innerHTML='<div class="empty"><div class="empty-icon material-icons">layers_clear</div><div class="empty-txt">Nenhuma moção</div></div>';
    return;
  }
  el.innerHTML=S.motions.map(m=>`
    <div class="mo-item">
      <span class="mo-badge ${MC[m.type]||'mt-other'}">${ML[m.type]||m.type}</span>
      <div class="mo-info">
        <div class="mo-prop">${dispName(m.prop)} <span style="font-size:11px;color:var(--muted2);font-weight:400">${m.ts}</span></div>
        <div class="mo-det">${[m.dur?m.dur+' min':'',m.spk?m.spk+'s/orador':''].filter(Boolean).join(' · ')||''}</div>
      </div>
      ${m.status==='pending'?`
        <button class="btn-app" onclick="voteMotion('${m.id}','approved')"><span class="material-icons inline-icon">check</span>Aprovar</button>
        <button class="btn-rej" onclick="voteMotion('${m.id}','rejected')"><span class="material-icons inline-icon">close</span>Rejeitar</button>`
      :`<span class="mo-done ${m.status==='approved'?'mo-app-done':'mo-rej-done'}">${m.status==='approved'?`<span class="material-icons inline-icon">check</span>Aprovada`:`<span class="material-icons inline-icon">close</span>Rejeitada`}</span>`}
      <button onclick="delMotion('${m.id}')" style="background:none;border:none;cursor:pointer;color:var(--muted2);font-size:16px;padding:3px 5px;border-radius:4px;transition:color .15s" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--muted2)'"><span class="material-icons" style="font-size:16px;">close</span></button>
    </div>`).join('');
}

/* ══════════════════════════════════════════════════════
   PRESENCE
   ══════════════════════════════════════════════════════ */
function renderPresence(){
  const cc=S.committeeCountries;
  const isCamara=S.committeeType==='camara';
  const pres=cc.filter(c=>S.presence[c.c]==='presente').length;
  const vot=cc.filter(c=>S.presence[c.c]==='presente-votante').length;
  const aus=cc.length-pres-vot;
  // Quorum/majority counts ONLY participants marked "Presente Votante"
  const votingPresent=vot;
  const tot=votingPresent;
  const ms=tot>0?Math.floor(tot/2)+1:0;
  const mq=tot>0?Math.ceil(tot*2/3):0;
  document.getElementById('ps-tot').textContent=cc.length;
  document.getElementById('ps-pres').textContent=pres;
  document.getElementById('ps-vot').textContent=vot;
  document.getElementById('ps-aus').textContent=aus;
  document.getElementById('q-ms').textContent=tot>0?ms:'—';
  document.getElementById('q-mq').textContent=tot>0?mq:'—';
  document.getElementById('mb-ms').textContent=tot>0?ms:'—';
  document.getElementById('mb-mq').textContent=tot>0?mq:'—';
  document.getElementById('mb-tot').textContent=tot;
  // Header: Câmara uses a single "Representação" column (name + subtitle stacked)
  const thead=document.getElementById('pres-thead');
  if(thead){
    thead.innerHTML=isCamara
      ? '<tr><th>Representação</th><th>Status</th></tr>'
      : '<tr><th></th><th>País</th><th>Status</th></tr>';
  }
  const tbody=document.getElementById('pres-tbody');if(!tbody)return;
  tbody.innerHTML=cc.map(c=>{
    const s=S.presence[c.c]||'ausente';
    const canVote=c.voto!==false;
    const esc=c.c.replace(/\\/g,"\\\\").replace(/'/g,"\\'");
    const votanteOpt=canVote?`<option value="presente-votante" ${s==='presente-votante'?'selected':''}>Pres. Votante</option>`:'';
    const statusSel=`<select class="psel ps-${s.replace(' ','-')}" onchange="setPresence('${esc}',this.value,this)">
        <option value="presente" ${s==='presente'?'selected':''}>Presente</option>
        ${votanteOpt}
        <option value="ausente" ${s==='ausente'?'selected':''}>Ausente</option>
      </select>`;
    if(isCamara){
      const noVote=!canVote?' <span class="novote-tag" style="background:var(--bg);color:var(--muted);font-size:9px;border-radius:8px;padding:0 6px">sem voto</span>':'';
      const nameCell=`<span class="rep-name">${dispName(c.c)}</span>`;
      return`<tr>
        <td><div class="rep-cell">${nameCell}${noVote}<div class="rep-sub">${c.sub||''}</div></div></td>
        <td>${statusSel}</td>
      </tr>`;
    }
    const info=c.sub||c.delegate||'';
    const noVote=!canVote?' <span class="novote-tag" style="background:var(--bg);color:var(--muted);font-size:9px;border-radius:8px;padding:0 6px">sem voto</span>':'';
    return`<tr>
      <td>${flagImg(c.c,c.f,c.i,20)}</td>
      <td><div class="rep-cell"><span class="rep-name">${dispName(c.c)}${noVote}</span><div class="rep-sub">${info}</div></div></td>
      <td>${statusSel}</td>
    </tr>`;
  }).join('');
  updateMajority();
}
function setCustomName(code,val){
  if(!S.customNames)S.customNames={};
  S.customNames[code]=val.trim()||rosterFind(code)?.disp||code;
  save();
}
function concluirPresenca(){
  S.presenceConfirmed=true;
  save();
  switchTab('gsl');
}
function setPresence(code,val,el){S.presence[code]=val;el.className='psel ps-'+val.replace(' ','-');renderPresence();save();}
function setAll(val){
  // "Todos Votantes" only applies the votante status to participants that may vote
  S.committeeCountries.forEach(c=>{
    if(val==='presente-votante' && c.voto===false){ S.presence[c.c]='presente'; }
    else { S.presence[c.c]=val; }
  });
  renderPresence();save();
}
function exportCSV(){
  const cc=S.committeeCountries;
  const lines=[(isCamaraCte()?'Representação':'País')+',Categoria,Status,Discursos'];
  cc.forEach(c=>lines.push(`"${c.c}","${c.f}","${S.presence[c.c]||'ausente'}",${S.speeches[c.c]||0}`));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/csv'}));a.download=`presenca-${Date.now()}.csv`;a.click();
}

// Record the current vote tally into the session vote history
function registerVote(){
  const cc=S.committeeCountries;
  const present=cc.filter(c=>S.presence[c.c]!=='ausente' && c.voto!==false);
  const tally={fav:0,fdr:0,con:0,cdr:0,abs:0};
  const detail=[];
  present.forEach(c=>{const v=S.votes[c.c];if(v){tally[v]=(tally[v]||0)+1;detail.push({c:c.c,f:c.f,v});}});
  const totalCast=tally.fav+tally.fdr+tally.con+tally.cdr+tally.abs;
  if(totalCast===0){alert('Nenhum voto registrado ainda. Colha os votos antes de registrar.');return;}
  const tp=present.length;
  let maj=0;const m=S.voteConfig.majority;
  if(m==='simples')maj=Math.floor(tp/2)+1;
  else if(m==='qualificada')maj=Math.ceil(tp*2/3);
  else if(m==='csnu')maj=9;
  const totalFavor=tally.fav+tally.fdr;
  const approved=maj>0&&totalFavor>=maj;
  const label=(document.getElementById('vote-label')?.value||'').trim()||'(sem título)';
  S.voteHistory.unshift({
    label, type:S.voteConfig.type, majority:S.voteConfig.majority,
    t:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
    tally, maj, totalFavor, approved, detail
  });
  if(S.voteHistory.length>60)S.voteHistory.pop();
  save();
  alert(`Votação registrada: ${label}\n${approved?'APROVADA':'NÃO APROVADA'} (${totalFavor} a favor / ${maj} necessários)`);
  if(document.getElementById('vote-label'))document.getElementById('vote-label').value='';
  S.votes={};renderVote();
}

// Generate a complete printable session report (save as PDF via print dialog)
function generateReport(){
  const cc=S.committeeCountries;
  const now=new Date().toLocaleString('pt-BR',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const presLabel={presente:'Presente','presente-votante':'Presente e Votante',ausente:'Ausente'};
  const voteLabel={fav:'A Favor',fdr:'A Favor c/ Direito',con:'Contra',cdr:'Contra c/ Direito',abs:'Abstenção'};
  const TR=isCamaraCte()?'Representação':'País'; const TRs=isCamaraCte()?'Representações':'Países';
  const nm=(code)=>dispName(code);
  const flag=(name,f,iso)=>{const code=iso||isoOf(name)||'';return code?`<img src="https://flagcdn.com/h20/${code}.png" style="height:13px;border-radius:2px;vertical-align:middle;margin-right:5px;box-shadow:0 0 0 1px rgba(0,0,0,.1)">`:'';};

  // Presence counts
  const pPres=cc.filter(c=>S.presence[c.c]==='presente').length;
  const pVot=cc.filter(c=>S.presence[c.c]==='presente-votante').length;
  const pAus=cc.length-pPres-pVot;
  const totalPresent=pPres+pVot;
  const quorVot=pVot; // quórum considera apenas presentes votantes
  const ms=quorVot>0?Math.floor(quorVot/2)+1:0;
  const mq=quorVot>0?Math.ceil(quorVot*2/3):0;

  // Speeches table (sorted by count desc)
  const speechRows=cc.map(c=>({c:c.c,f:c.f,i:c.i,n:S.speeches[c.c]||0}))
    .sort((a,b)=>b.n-a.n)
    .map(r=>`<tr><td>${flag(r.c,r.f,r.i)}${nm(r.c)}</td><td style="text-align:center">${r.n}</td></tr>`).join('');
  const totalSpeeches=cc.reduce((a,c)=>a+(S.speeches[c.c]||0),0);

  // Speaking-TIME ranking (sorted by total seconds spoken desc)
  const st=S.speakTime||{};
  const totalSpeakSecs=cc.reduce((a,c)=>a+(st[c.c]||0),0);
  const timeRanked=cc.map(c=>({c:c.c,f:c.f,i:c.i,secs:st[c.c]||0,n:S.speeches[c.c]||0}))
    .sort((a,b)=>b.secs-a.secs);
  const timeRows=timeRanked.map((r,idx)=>{
    const pct=totalSpeakSecs>0?Math.round(r.secs/totalSpeakSecs*100):0;
    const medal=r.secs>0&&idx===0?'🥇 ':r.secs>0&&idx===1?'🥈 ':r.secs>0&&idx===2?'🥉 ':'';
    return `<tr><td style="text-align:center;color:#9c958e">${idx+1}º</td><td>${medal}${flag(r.c,r.f,r.i)}${nm(r.c)}</td><td style="text-align:center;font-weight:700;color:#8B1A1A">${fmt(r.secs)}</td><td style="text-align:center">${r.n}</td><td style="text-align:center;color:#6a635c">${pct}%</td></tr>`;
  }).join('');

  // History (chronological — reverse since stored newest-first)
  const histRows=[...S.history].reverse().map(h=>{
    const obsArr=[];
    if(h.received)obsArr.push(`Recebeu de ${h.received}`);
    if(h.yielded==='chair')obsArr.push('Cedeu ao Chair');
    else if(h.yielded)obsArr.push(`Cedeu a ${h.yielded}`);
    const obs=obsArr.length?obsArr.join(' · '):'—';
    return `<tr><td>${h.t}</td><td>${flag(h.c,h.f)}${nm(h.c)}</td><td style="text-align:center">${fmt(h.sec)}</td><td>${obs}</td></tr>`;
  }).join('');

  // Motions
  const ML2={unmod:'Sessão Não-Moderada',mod:'Sessão Moderada',vote:'Votação de Documento',recess:'Recesso',other:'Outra'};
  const motionRows=S.motions.map(m=>`<tr><td>${m.ts}</td><td>${ML2[m.type]||m.type}</td><td>${flag(m.prop)}${nm(m.prop)}</td><td>${[m.dur?m.dur+' min':'',m.spk?m.spk+'s/orador':''].filter(Boolean).join(' · ')||'—'}</td><td>${m.status==='approved'?'✓ Aprovada':m.status==='rejected'?'✕ Rejeitada':'Pendente'}</td></tr>`).join('');

  // Votes
  const voteBlocks=S.voteHistory.length? [...S.voteHistory].reverse().map(v=>{
    const t=v.tally;
    const detailRows=v.detail.map(d=>`<tr><td>${flag(d.c,d.f)}${nm(d.c)}</td><td>${voteLabel[d.v]||d.v}</td></tr>`).join('');
    return `<div class="vote-block">
      <h3>${v.label} <span class="vtag ${v.approved?'ok':'no'}">${v.approved?'APROVADA':'NÃO APROVADA'}</span></h3>
      <p class="vmeta">${v.t} · ${v.type==='procedimental'?'Procedimental':'Substancial'} · Maioria ${v.majority} (necessário: ${v.maj})</p>
      <p class="vtotals">A Favor: <b>${t.fav}</b> · A Favor c/ Direito: <b>${t.fdr}</b> · Contra: <b>${t.con}</b> · Contra c/ Direito: <b>${t.cdr}</b> · Abstenções: <b>${t.abs}</b></p>
      <table class="rtable"><thead><tr><th>${TR}</th><th>Voto</th></tr></thead><tbody>${detailRows}</tbody></table>
    </div>`;
  }).join('') : '<p class="empty-note">Nenhuma votação registrada nesta sessão.</p>';

  const presenceRows=cc.map(c=>`<tr><td>${flag(c.c,c.f,c.i)}${nm(c.c)}${c.sub?' <span style=\'color:#9c958e;font-style:italic\'>('+c.sub+')</span>':''}</td><td>${presLabel[S.presence[c.c]]||'Ausente'}</td><td style="text-align:center">${S.speeches[c.c]||0}</td></tr>`).join('');

  // Pending speakers list (the GSL queue at moment of report generation)
  const pendingSpeakers=S.speakers.length ? S.speakers.map((s,idx)=>{
    const isCur=idx===S.curIdx;
    const pos=idx<S.curIdx?idx+1:idx+1; // 1-based position
    const rowStyle=isCur?'background:#fdf2f2;font-weight:700':idx<S.curIdx?'color:#9c958e':''
    const marker=isCur?'▶ ':'';
    const note=isCur?'<span style="font-size:11px;color:#8B1A1A;font-weight:700"> ← Próximo / Em discurso</span>':idx<S.curIdx?'<span style="font-size:11px;color:#9c958e"> (já discursou nesta rodada)</span>':'';
    return `<tr style="${rowStyle}"><td style="text-align:center;color:#9c958e">${pos}º</td><td>${marker}${flag(s.c,s.f,s.i)}${nm(s.c)}${note}</td></tr>`;
  }).join('') : '';

  const reportHTML=`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Relatório — ${S.config.committee} — ${S.config.session}</title>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<style>
  @page { margin: 1.5cm; }
  * { box-sizing: border-box; }
  body { font-family: Candara, Calibri, 'Segoe UI', sans-serif; color: #1a1714; line-height: 1.5; margin: 0; padding: 24px; }
  .rhead { display:flex; align-items:center; gap:16px; border-bottom: 3px solid #8B1A1A; padding-bottom: 16px; margin-bottom: 20px; }
  .rhead h1 { color:#8B1A1A; font-size: 24px; margin:0; }
  .rhead p { color:#6a635c; margin: 3px 0 0; font-size: 13px; }
  h2 { color:#8B1A1A; font-size: 17px; border-bottom:1px solid #e0dbd4; padding-bottom:5px; margin: 26px 0 12px; }
  h3 { font-size: 14px; margin: 14px 0 4px; }
  .summary { display:flex; gap:10px; flex-wrap:wrap; margin-bottom: 8px; }
  .scard { background:#fdf2f2; border:1px solid #e8c5c5; border-radius:8px; padding:10px 16px; text-align:center; flex:1; min-width:90px; }
  .scard .n { font-size: 24px; font-weight: 700; color:#8B1A1A; }
  .scard .l { font-size: 11px; text-transform:uppercase; letter-spacing:.5px; color:#6a635c; }
  table.rtable { width:100%; border-collapse: collapse; margin: 6px 0 14px; font-size: 13px; }
  table.rtable th { background:#f5f3ef; text-align:left; padding: 6px 10px; border-bottom: 2px solid #e0dbd4; font-size: 11px; text-transform:uppercase; letter-spacing:.5px; color:#6a635c; }
  table.rtable td { padding: 5px 10px; border-bottom: 1px solid #eee; }
  .vote-block { border:1px solid #e0dbd4; border-radius:8px; padding: 12px 16px; margin-bottom: 14px; page-break-inside: avoid; }
  .vtag { font-size: 11px; padding: 2px 9px; border-radius: 10px; font-weight: 700; vertical-align: middle; }
  .vtag.ok { background:#edf7f1; color:#145c30; }
  .vtag.no { background:#fdf2f2; color:#c0272d; }
  .vmeta { font-size: 12px; color:#6a635c; margin: 2px 0; }
  .vtotals { font-size: 13px; margin: 4px 0 8px; }
  .empty-note { color:#9c958e; font-style: italic; }
  .rfoot { margin-top: 30px; padding-top: 12px; border-top:1px solid #e0dbd4; font-size: 11px; color:#9c958e; text-align:center; }
  @media print { body { padding: 0; } .noprint { display:none; } }
  .printbtn { position: fixed; top: 16px; right: 16px; background:#8B1A1A; color:white; border:none; border-radius:8px; padding:10px 20px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
  .material-icons { font-family: 'Material Icons'; font-weight: normal; font-style: normal; font-size: 24px; line-height: 1; display: inline-block; text-transform: none; -webkit-font-smoothing: antialiased; vertical-align: middle; }
  .inline-icon { font-size: 14px !important; margin-right: 4px; vertical-align: middle; }
</style></head>
<body>
  <button class="printbtn noprint" onclick="window.print()"><span class="material-icons inline-icon">print</span>Imprimir / Salvar PDF</button>
  <div class="rhead">
    <img src="${(document.getElementById('app-logo')||{}).src||''}" style="height:56px">
    <div>
      <h1>${S.config.conference} — ${S.config.committee}</h1>
      <p>${S.config.session} · Relatório gerado em ${now}</p>
      <p>Agenda: ${S.agenda}</p>
    </div>
  </div>

  <h2>Resumo da Sessão</h2>
  <div class="summary">
    <div class="scard"><div class="n">${cc.length}</div><div class="l">${TRs}</div></div>
    <div class="scard"><div class="n">${totalPresent}</div><div class="l">Presentes</div></div>
    <div class="scard"><div class="n">${totalSpeeches}</div><div class="l">Discursos</div></div>
    <div class="scard"><div class="n">${S.motions.filter(m=>m.status==='approved').length}</div><div class="l">Moções Aprov.</div></div>
    <div class="scard"><div class="n">${S.voteHistory.length}</div><div class="l">Votações</div></div>
  </div>
  <p style="font-size:13px">Maioria Simples: <b>${ms||'—'}</b> · Maioria Qualificada: <b>${mq||'—'}</b></p>

  ${pendingSpeakers?`<h2>Lista de Oradores (ao Encerrar a Sessão)</h2>
  <table class="rtable"><thead><tr><th style="text-align:center">#</th><th>${TR}</th></tr></thead><tbody>${pendingSpeakers}</tbody></table>
  <p style="font-size:12px;color:#6a635c">${S.speakers.length} orador(es) na fila · posição ${S.curIdx+1}º ao encerrar</p>`:''}

  <h2>Lista de Presença</h2>
  <table class="rtable"><thead><tr><th>${TR}</th><th>Status</th><th style="text-align:center">Discursos</th></tr></thead>
  <tbody>${presenceRows}</tbody></table>
  <p style="font-size:12px;color:#6a635c">Presentes: ${pPres} · Presentes e Votantes: ${pVot} · Ausentes: ${pAus}</p>

  <h2>Ranking de Tempo de Fala</h2>
  ${totalSpeakSecs>0?`<table class="rtable"><thead><tr><th style="text-align:center">#</th><th>${TR}</th><th style="text-align:center">Tempo Total</th><th style="text-align:center">Discursos</th><th style="text-align:center">% do Total</th></tr></thead><tbody>${timeRows}</tbody></table><p style="font-size:12px;color:#6a635c">Tempo total de fala da sessão: <b>${fmt(totalSpeakSecs)}</b></p>`:'<p class="empty-note">Nenhum tempo de fala registrado.</p>'}

  <h2>Discursos por ${TR}</h2>
  <table class="rtable"><thead><tr><th>${TR}</th><th style="text-align:center">Nº de Discursos</th></tr></thead>
  <tbody>${speechRows}</tbody></table>

  <h2>Histórico Cronológico de Oradores</h2>
  ${histRows?`<table class="rtable"><thead><tr><th>Hora</th><th>${TR}</th><th style="text-align:center">Tempo Falado</th><th>Cessão de Fala</th></tr></thead><tbody>${histRows}</tbody></table>`:'<p class="empty-note">Nenhum discurso registrado.</p>'}

  <h2>Moções</h2>
  ${motionRows?`<table class="rtable"><thead><tr><th>Hora</th><th>Tipo</th><th>Proponente</th><th>Detalhes</th><th>Status</th></tr></thead><tbody>${motionRows}</tbody></table>`:'<p class="empty-note">Nenhuma moção registrada.</p>'}

  <h2>Votações</h2>
  ${voteBlocks}

  <div class="rfoot">Documento gerado automaticamente pelo Sim SD Chair · ${now}</div>
</body></html>`;

  const w=window.open('','_blank');
  if(!w){alert('Permita pop-ups para gerar o relatório.');return;}
  w.document.write(reportHTML);
  w.document.close();
}

function exportSessionJSON(){
  const data = {
    ...S,
    selectedSetupArr: [...S.selectedSetup],
    timer: { ...S.timer, running: false, iv: null },
    mod: { ...S.mod, running: false, iv: null },
    unmod: { ...S.unmod, running: false, iv: null },
    solo: { ...S.solo, running: false, iv: null }
  };
  delete data.selectedSetup;

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `simsd-sessao-${S.config.committee.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════
   VOTE
   ══════════════════════════════════════════════════════ */
function pickR(groupId,el,val){
  document.querySelectorAll('#'+groupId+' .ropt').forEach(o=>o.classList.remove('on'));
  el.classList.add('on');
  if(groupId==='vt-type')S.voteConfig.type=val;
  else S.voteConfig.majority=val;
}
function startVote(){closePanel('vote-panel');S.votes={};renderVote();save();}
function resetVote(){S.votes={};renderVote();save();}
function castVote(code,val){
  // Enforce abstention rules: only "Presente" (non-votante) nations may abstain,
  // and only in substantive votes.
  if(val==='abs'){
    const allowed=S.voteConfig.type==='substancial' && S.presence[code]==='presente';
    if(!allowed)return;
  }
  S.votes[code]=val;renderVote();save();
}
function renderVote(){
  const cc=S.committeeCountries;
  // Voters: those "Presente Votante" (must vote, no abstention) and those merely
  // "Presente" (may abstain in substantive votes). Absent participants don't vote.
  const present=cc.filter(c=>(S.presence[c.c]==='presente-votante'||S.presence[c.c]==='presente') && c.voto!==false)
    .slice().sort((a,b)=>dispName(a.c).localeCompare(dispName(b.c),'pt'));
  const isSubstancial=S.voteConfig.type==='substancial';
  const presentCodes=new Set(present.map(c=>c.c));
  const tallied=Object.entries(S.votes).filter(([k])=>presentCodes.has(k)).map(([,v])=>v);
  const fav=tallied.filter(v=>v==='fav').length;
  const fdr=tallied.filter(v=>v==='fdr').length;
  const con=tallied.filter(v=>v==='con').length;
  const cdr=tallied.filter(v=>v==='cdr').length;
  const abs=tallied.filter(v=>v==='abs').length;
  const totalFavor=fav+fdr;
  const tp=present.length;
  let maj=0;
  const m=S.voteConfig.majority;
  if(m==='simples')maj=Math.floor(tp/2)+1;
  else if(m==='qualificada')maj=Math.ceil(tp*2/3);
  else if(m==='csnu')maj=9;
  document.getElementById('v-fav').textContent=fav;
  document.getElementById('v-fdr').textContent=fdr;
  document.getElementById('v-con').textContent=con;
  document.getElementById('v-cdr').textContent=cdr;
  document.getElementById('v-abs').textContent=abs;
  document.getElementById('v-maj').textContent=maj||'—';
  const total=fav+fdr+con+cdr+abs;
  const pct=total>0?Math.round(totalFavor/total*100):0;
  document.getElementById('v-fill').style.width=pct+'%';
  const lbl={procedimental:'Votação Procedimental',substancial:'Votação Substancial'};
  document.getElementById('vote-type-lbl').textContent=lbl[S.voteConfig.type]||'Votação';
  const approved=maj>0&&totalFavor>=maj;
  const rt=document.getElementById('v-res');
  if(total>0){rt.innerHTML=approved?`<span class="material-icons inline-icon">check</span>APROVADO (${totalFavor} a favor / ${maj} necessários)`:`<span class="material-icons inline-icon">close</span>Não aprovado (${totalFavor} a favor / ${maj} necessários)`;rt.style.color=approved?'var(--green)':'var(--red)';}
  else{rt.innerHTML='—';rt.style.color='var(--muted)';}
  const list=document.getElementById('vlist');if(!list)return;
  const voteLabels={
    fav:{cls:'vt-fav',txt:'A Favor'},
    fdr:{cls:'vt-fav-dr',txt:'A Favor c/ Direito'},
    con:{cls:'vt-con',txt:'Contra'},
    cdr:{cls:'vt-con-dr',txt:'Contra c/ Direito'},
    abs:{cls:'vt-abst',txt:'Abstenção'},
  };
  list.innerHTML=present.map(c=>{
    const nm=dispName(c.c);
    const sub=c.sub?` <span style="font-size:11px;color:var(--muted);font-style:italic">(${c.sub})</span>`:'';
    // Abstention is allowed ONLY for nations declared just "Presente" (not "Presente Votante"),
    // and ONLY in substantive votes. Procedural votes never allow abstention.
    const canAbstain=isSubstancial && S.presence[c.c]==='presente';
    const v=S.votes[c.c];
    const esc=c.c.replace(/'/g,"\\'");
    if(v){const lv=voteLabels[v];return`<div class="v-row"><span style="display:inline-flex;align-items:center">${flagImg(c.c,c.f,c.i,19)}</span><span class="vr-name">${nm}${sub}</span><span class="voted-tag ${lv.cls}">${lv.txt}</span><button class="vbtn vb-abst" onclick="castVote('${esc}',null)" style="font-size:10px;padding:2px 6px;margin-left:4px;display:inline-flex;align-items:center;"><span class="material-icons" style="font-size:11px;">undo</span></button></div>`;}
    const abstainBtn=canAbstain?`<button class="vbtn vb-abst"   onclick="castVote('${esc}','abs')">Abst.</button>`:'';
    return`<div class="v-row">
      <span style="display:inline-flex;align-items:center">${flagImg(c.c,c.f,c.i,19)}</span>
      <span class="vr-name">${nm}${sub}</span>
      <button class="vbtn vb-fav"    onclick="castVote('${esc}','fav')">A Favor</button>
      <button class="vbtn vb-fav-dr" onclick="castVote('${esc}','fdr')">A Favor c/ Dir.</button>
      <button class="vbtn vb-con"    onclick="castVote('${esc}','con')">Contra</button>
      <button class="vbtn vb-con-dr" onclick="castVote('${esc}','cdr')">Contra c/ Dir.</button>
      ${abstainBtn}
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════
   MOD CAUCUS
   ══════════════════════════════════════════════════════ */
function updateModDisplay(){
  document.getElementById('mod-total-d').textContent=`${fmt(S.mod.totalSec)} / ${fmt(S.mod.totalTotal)}`;
  document.getElementById('mod-spk-d').textContent=`${fmt(S.mod.spkSec)} / ${fmt(S.mod.spkTotal)}`;
}
function modPP(){
  if(S.mod.running){clearInterval(S.mod.iv);S.mod.running=false;document.getElementById('btn-mod-pp').textContent='play_arrow';}
  else{S.mod.running=true;document.getElementById('btn-mod-pp').textContent='pause';
    S.mod.iv=setInterval(()=>{
      if(S.mod.spkSec>0)S.mod.spkSec--;
      if(S.mod.totalSec>0)S.mod.totalSec--;
      if(S.mod.spkSec<=0||S.mod.totalSec<=0)modNext();
      else updateModDisplay();
    },1000);}
}
function modReset(){clearInterval(S.mod.iv);S.mod.running=false;document.getElementById('btn-mod-pp').textContent='play_arrow';S.mod.totalSec=S.mod.totalTotal;S.mod.spkSec=S.mod.spkTotal;updateModDisplay();}
function modNext(){clearInterval(S.mod.iv);S.mod.running=false;document.getElementById('btn-mod-pp').textContent='play_arrow';S.mod.spkSec=S.mod.spkTotal;if(S.mod.spks.length>0)S.mod.spks.shift();S.mod.cur=0;updateModDisplay();renderModList();save();}
function renderModList(){
  // Current speaker = first in the mod queue (independent from the GSL list)
  const cur=S.mod.spks[0];
  const cn=document.getElementById('mod-cur-name');
  if(cn)cn.textContent=cur?dispName(cur.c):'Adicionar oradores à direita';
  const cf=document.getElementById('mod-cur-flag');
  if(cf)cf.innerHTML=cur?flagImg(cur.c,cur.f,null,26):'<span class="material-icons" style="font-size:26px;vertical-align:middle;">public</span>';
  const list=document.getElementById('mod-list');if(!list)return;
  const next=S.mod.spks.slice(1);
  if(!next.length){list.innerHTML='<div class="empty"><div class="empty-icon material-icons">reorder</div><div class="empty-txt">Lista vazia</div></div>';return;}
  list.innerHTML=next.map((s,i)=>`
    <div class="spk-row" draggable="true"
         ondragstart="dragStartMod(event,${i+1})"
         ondragover="dragOver(event,${i+1})"
         ondragleave="dragLeave(event)"
         ondrop="dropRowMod(event,${i+1})"
         ondragend="dragEnd(event)"
         data-idx="${i+1}">
      <span class="spk-num">${i+2}</span>
      <span class="spk-flag">${flagImg(s.c,s.f,null,19)}</span>
      <span class="spk-name">${dispName(s.c)}</span>
      <button class="btn-rm" onclick="removeModSpk(${i+1})"><span class="material-icons" style="font-size:12px;">close</span></button>
      <span class="drag-handle material-icons" title="Arraste para reordenar">drag_indicator</span>
    </div>`).join('');
}
function removeModSpk(i){S.mod.spks.splice(i,1);renderModList();renderRP();save();}

/* ══════════════════════════════════════════════════════
   UNMOD CAUCUS
   ══════════════════════════════════════════════════════ */
function updateUnmodDisplay(){document.getElementById('unmod-d').textContent=`${fmt(S.unmod.sec)} / ${fmt(S.unmod.total)}`;}
function unmodPP(){
  if(S.unmod.running){clearInterval(S.unmod.iv);S.unmod.running=false;document.getElementById('btn-unmod-pp').textContent='play_arrow';}
  else{S.unmod.running=true;document.getElementById('btn-unmod-pp').textContent='pause';
    S.unmod.iv=setInterval(()=>{if(S.unmod.sec<=0){unmodReset();return;}S.unmod.sec--;updateUnmodDisplay();},1000);}
}
function unmodReset(){clearInterval(S.unmod.iv);S.unmod.running=false;document.getElementById('btn-unmod-pp').textContent='play_arrow';S.unmod.sec=S.unmod.total;updateUnmodDisplay();}

/* ══════════════════════════════════════════════════════
   CAUCUS SETTINGS
   ══════════════════════════════════════════════════════ */
function openCaucus(target){
  S.caucusTarget=target;
  const titMap={mod:'Configurar Sessão Moderada',unmod:'Configurar Sessão Não-Moderada'};
  document.getElementById('caucus-panel-title').textContent=titMap[target]||'Configurar Sessão';
  const ismod=target==='mod';
  document.getElementById('cau-total').value=ismod?Math.round(S.mod.totalTotal/60):Math.round(S.unmod.total/60);
  document.getElementById('cau-spk').value=ismod?S.mod.spkTotal:S.config.defaultTime;
  document.getElementById('cau-spk').closest('.ip-field').style.display=ismod?'':'none';
  openPanel('caucus-panel');
}
function applyCaucus(){
  const tot=parseInt(document.getElementById('cau-total').value)||15;
  const spk=parseInt(document.getElementById('cau-spk').value)||60;
  if(S.caucusTarget==='mod'){S.mod.totalTotal=tot*60;S.mod.totalSec=tot*60;S.mod.spkTotal=spk;S.mod.spkSec=spk;updateModDisplay();}
  else{S.unmod.total=tot*60;S.unmod.sec=tot*60;updateUnmodDisplay();}
  closePanel('caucus-panel');save();
}

/* ══════════════════════════════════════════════════════
   SOLO
   ══════════════════════════════════════════════════════ */
function initSolo(){
  const sel=document.getElementById('solo-sel');
  sel.innerHTML='<option value="">'+selectPrompt()+'</option>'+S.committeeCountries.map(c=>`<option value="${c.c}">${isCamaraCte()?'':c.f+' '}${dispName(c.c)}${c.sub?' ('+c.sub+')':''}</option>`).join('');
  sel.onchange=()=>{
    const code=sel.value;
    if(!code){document.getElementById('solo-cur-row').style.display='none';return;}
    const cc=S.committeeCountries.find(x=>x.c===code)||{f:'🏳️',i:null};
    S.solo.code=code;S.solo.flag=cc.f;S.solo.iso=cc.i;
    document.getElementById('solo-flag').innerHTML=flagImg(code,cc.f,cc.i,26);
    document.getElementById('solo-name').textContent=code;
    document.getElementById('solo-cur-row').style.display='';
    save();
  };
  if(S.solo.code){sel.value=S.solo.code;document.getElementById('solo-flag').innerHTML=flagImg(S.solo.code,S.solo.flag,S.solo.iso,26);document.getElementById('solo-name').textContent=S.solo.code;document.getElementById('solo-cur-row').style.display='';}
  updateSoloDisplay();
}
function updateSoloDisplay(){const d=document.getElementById('solo-timer'),b=document.getElementById('solo-bar');if(!d)return;d.textContent=fmt(S.solo.sec);b.style.width=(S.solo.sec/S.solo.total*100)+'%';}
function soloPP(){
  if(S.solo.running){clearInterval(S.solo.iv);S.solo.running=false;document.getElementById('btn-solo-pp').textContent='play_arrow';}
  else{S.solo.running=true;document.getElementById('btn-solo-pp').textContent='pause';
    S.solo.iv=setInterval(()=>{if(S.solo.sec<=0){soloReset();return;}S.solo.sec--;updateSoloDisplay();},1000);}
}
function soloReset(){clearInterval(S.solo.iv);S.solo.running=false;document.getElementById('btn-solo-pp').textContent='play_arrow';S.solo.sec=S.solo.total;updateSoloDisplay();}

/* ══════════════════════════════════════════════════════
   POPULATE SELECTS
   ══════════════════════════════════════════════════════ */
function populateSelects(){
  const el=document.getElementById('mo-prop');
  if(el)el.innerHTML='<option value="">'+(isCamaraCte()?'Representação...':'País...')+'</option>'+S.committeeCountries.map(c=>`<option value="${c.c}">${isCamaraCte()?'':c.f+' '}${dispName(c.c)}${c.sub?' ('+c.sub+')':''}</option>`).join('');
}

/* ══════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
   ══════════════════════════════════════════════════════ */
document.addEventListener('keydown',e=>{
  const tag=document.activeElement?.tagName;
  if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA')return;
  if(e.key===' '){e.preventDefault();if(S.activeTab==='gsl')gslPP();else if(S.activeTab==='mod')modPP();else if(S.activeTab==='unmod')unmodPP();}
  if(e.key==='n'||e.key==='N'){if(S.activeTab==='gsl')gslNext();}
  if(e.key==='Escape'){['cfg-panel','vote-panel','caucus-panel'].forEach(id=>closePanel(id));}
});

/* ══════════════════════════════════════════════════════
   OFFICIAL CLOCK
   ══════════════════════════════════════════════════════ */
function tickClock(){
  const el=document.getElementById('official-clock-time');
  if(el)el.textContent=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
setInterval(tickClock,1000);
tickClock();

/* ══════════════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════════════ */
load();
document.getElementById('setup-logo').src='logo-alt.png';
renderCountryGrid();
if(S.setupDone){
  document.getElementById('committee-screen').classList.add('hidden');
  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.add('visible');
  initApp();
} else if(S.committeeKey){
  // A committee was chosen but session not started — go straight to setup
  document.getElementById('committee-screen').classList.add('hidden');
  document.getElementById('setup-screen').classList.remove('hidden');
  chooseCommittee(S.committeeKey);
} else {
  // Fresh start — show committee choice screen
  document.getElementById('s-conf').value=S.config.conference;
  document.getElementById('s-session').value=S.config.session;
  document.getElementById('s-time').value=S.config.defaultTime;
  document.getElementById('s-warn').value=S.config.warnTime;
}