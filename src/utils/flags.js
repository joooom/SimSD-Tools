export function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeAttr(v) {
  return escapeHtml(v);
}

export const CTRY=[
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

export const CAMARA=[
  {c:'Dep. Aguinaldo Ribeiro',sub:'PP',voto:true,cat:'Parlamentar'},
  {c:'Dep. Augusto Coutinho',sub:'Republicanos',voto:true,cat:'Parlamentar'},
  {c:'Dep. Baleia Rossi',sub:'MDB',voto:true,cat:'Parlamentar'},
  {c:'Dep. Carlos Jordy',sub:'PL',voto:true,cat:'Parlamentar'},
  {c:'Dep. Elmar Nascimento',sub:'União Brasil',voto:true,cat:'Parlamentar'},
  {c:'Dep. Érika Hilton',sub:'PSOL',voto:true,cat:'Parlamentar'},
  {c:'Dep. Isnaldo Bulhões',sub:'MDB',voto:true,cat:'Parlamentar'},
  {c:'Dep. Julia Zanatta',sub:'PL',voto:true,cat:'Parlamentar'},
  {c:'Dep. Kim Kataguiri',sub:'MISSÃO',voto:true,cat:'Parlamentar'},
  {c:'Dep. Lindbergh Farias',sub:'PT',voto:true,cat:'Parlamentar'},
  {c:'Dep. Luiz Gastão',sub:'PSD',voto:true,cat:'Parlamentar'},
  {c:'Dep. Nikolas Ferreira',sub:'PL',voto:true,cat:'Parlamentar'},
  {c:'Dep. Paulo Teixeira',sub:'PT',voto:true,cat:'Parlamentar'},
  {c:'Dep. Reimont',sub:'PT',voto:true,cat:'Parlamentar'},
  {c:'Dep. Sâmia Bomfim',sub:'PSOL',voto:true,cat:'Parlamentar'},
  {c:'Dep. Sóstenes Cavalcante',sub:'PL',voto:true,cat:'Parlamentar'},
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

export const FLAG_OVERRIDE={'af':'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MCA0MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIGZpbGw9IiNmZmZmZmYiLz48dGV4dCB4PSIzMCIgeT0iMTgiIGZvbnQtZmFtaWx5PSInTm90byBOYXNraCBBcmFiaWMnLCdBbWlyaScsJ1NjaGVoZXJhemFkZSBOZXcnLCdBcmlhbCcsc2VyaWYiIGZvbnQtc2l6ZT0iOC41IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMDAwMDAwIiBmb250LXdlaWdodD0iNzAwIiB0ZXh0TGVuZ3RoPSI0OCIgbGVuZ3RoQWRqdXN0PSJzcGFjaW5nQW5kR2x5cGhzIj7ZhNinINil2YTZhyDYpdmE2Kcg2KfZhNmE2Yc8L3RleHQ+PHRleHQgeD0iMzAiIHk9IjMwIiBmb250LWZhbWlseT0iJ05vdG8gTmFza2ggQXJhYmljJywnQW1pcmknLCdTY2hlaGVyYXphZGUgTmV3JywnQXJpYWwnLHNlcmlmIiBmb250LXNpemU9IjcuNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzAwMDAwMCIgZm9udC13ZWlnaHQ9IjcwMCIgdGV4dExlbmd0aD0iNDQiIGxlbmd0aEFkanVzdD0ic3BhY2luZ0FuZEdseXBocyI+2YXYrdmF2K8g2LHYs9mI2YQg2KfZhNmE2Yc8L3RleHQ+PC9zdmc+Cg=='};

export function isoOf(name) {
  const c = CTRY.find(x => x.c === name);
  return c ? c.i : null;
}

export function flagImg(country, flag, iso, size) {
  size = size || 22;
  const code = iso || isoOf(country) || '';
  const fb = flag || '🏳️';
  if (window.SimSDOfflineMode) {
    return `<span class="flag-emoji" style="font-size:${Number(size)}px">${escapeHtml(fb)}</span>`;
  }
  if (!code) {
    if (fb === '🏛️') return `<span class="material-icons" style="font-size:${Number(size)}px;vertical-align:middle;">account_balance</span>`;
    if (fb === '🌐') return `<span class="material-icons" style="font-size:${Number(size)}px;vertical-align:middle;">public</span>`;
    if (fb === '🏳️') return `<span class="material-icons" style="font-size:${Number(size)}px;vertical-align:middle;">flag</span>`;
    return `<span class="flag-emoji" style="font-size:${Number(size)}px">${escapeHtml(fb)}</span>`;
  }
  const w = Math.round(size * 1.45);
  const src = FLAG_OVERRIDE[code] || `https://flagcdn.com/h40/${encodeURIComponent(code)}.png`;
  return `<img class="flagimg" src="${src}" data-fallback="${escapeAttr(fb)}" data-size="${Number(size)}" style="width:${w}px;height:${Number(size)}px;border-radius:3px;object-fit:cover;box-shadow:0 0 0 1px rgba(0,0,0,.08);vertical-align:middle">`;
}

export function rosterFind(code, state) {
  if (state?.committeeCountries?.length) {
    const m = state.committeeCountries.find(x => x.c === code);
    if (m) return m;
  }
  return CTRY.find(x => x.c === code) || null;
}

export function dispName(code, state) {
  if (state?.customNames?.[code]) return state.customNames[code];
  const m = rosterFind(code, state);
  return (m && (m.disp || m.c)) || code;
}
