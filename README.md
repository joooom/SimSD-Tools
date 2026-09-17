# SimSD Chair

Aplicação React/Vite para condução de comitês, com salas colaborativas via WebSocket, autenticação OAuth 2.0 do Portal SimSD e relatórios administrativos ao vivo e finais.

Na tela inicial também existe o modo visitante. Ele não faz autenticação, chamadas de API nem conexões WebSocket; os dados ficam somente no `localStorage`. O app shell, as imagens e a fonte de ícones são armazenados pelo service worker para continuar disponível sem conexão depois do primeiro acesso.

## Executar

Requer Node.js 22.9 ou superior (o servidor usa `node:sqlite` e carregamento nativo opcional de `.env`).

```bash
npm install
npm run build
npm start
```

Copie `.env.example` para `.env` ou configure as variáveis no ambiente do processo. Cadastre no Portal SimSD exatamente a mesma URL definida em `SIMSD_OAUTH_REDIRECT_URI`, terminando em `/auth/callback`. Em produção, mantenha `SIMSD_DEV_AUTH=0`, use HTTPS e deixe `SIMSD_COOKIE_SECURE=1`.

O backend implementa Authorization Code com PKCE S256. O access token do portal nunca é enviado ao navegador e não é persistido; a aplicação cria uma sessão própria, `HttpOnly`, com duração máxima de uma hora.

## Permissões

- `admin`: acessa todas as salas, administra participantes e consulta relatórios parciais/finais.
- `simsd_tools`: cria salas, acessa salas às quais foi adicionado e qualquer sala aberta.
- `student`: não cria salas e acessa somente salas próprias ou às quais foi adicionado.

Como o OAuth do portal fornece apenas o perfil da pessoa autenticada e não um diretório de usuários, um convite por e-mail, login ou ID só pode ser feito depois que a pessoa entrar neste app ao menos uma vez.

Os relatórios administrativos usam o mesmo documento completo e imprimível da sessão. O parcial abre em uma nova guia e atualiza automaticamente enquanto a sessão acontece; o final é uma captura estática da sessão encerrada.

## Desenvolvimento e testes

Em dois terminais:

```bash
npm run dev:server
npm run dev
```

O Vite usa a porta 4173 e encaminha API/OAuth/WebSocket ao backend na porta 4174. Para habilitar os botões locais de login, defina `SIMSD_DEV_AUTH=1` somente no ambiente de desenvolvimento.

```bash
npm test
npm run build
```

O teste integrado usa um banco isolado e valida papéis, ACL de salas, convites, sincronização WebSocket, conflitos de versão, encerramento e relatórios.

## Alterações durante quedas de conexão

Ao perder o WebSocket, a sala já carregada continua aceitando alterações. Durante os primeiros 5 segundos, elas ficam em memória enquanto a conexão é restabelecida. Após 5 segundos contínuos sem conexão pronta, a fila de recuperação é gravada no armazenamento do navegador, separada por usuário e sala, e o aviso de cópia local aparece se houver alterações pendentes. Salvamentos normais com conexão ativa não acionam esse aviso. Com o WebSocket conectado, alterações são enviadas diretamente pelo mesmo socket, sem espera artificial, gravações locais ou mudança do indicador a cada ação. O salvamento de recuperação só ocorre depois dos 5 segundos de queda contínua; fechar a página antes desse prazo pode perder alterações ainda não confirmadas. A cópia já existente é apagada após a confirmação do servidor. O modo visitante continua usando seu armazenamento local independente. Notas e acontecimentos ficam no estado pendente; várias alterações consecutivas são consolidadas em um envio. Ao voltar à mesma sala com o mesmo usuário e navegador, a fila pendente é recuperada, inclusive após recarregar a página.

A reconexão é automática, com tentativas a cada 1, 2, 4, 8 e até 15 segundos, e é antecipada quando o navegador sinaliza que voltou à internet. O app espera receber o estado atual da sala antes de reenviar. Alterações independentes são combinadas; notas, acontecimentos e registros com identificador são conciliados sem duplicação. Totais de discursos e de tempo de fala são combinados a partir dos acontecimentos correspondentes. Se o mesmo dado tiver alterações incompatíveis, o app mostra os valores locais e remotos e pede qual usar nos conflitos, preservando as demais alterações.

O indicador mostra alterações pendentes e oferece **Baixar cópia local**. Uma sala encerrada ou excluída não recebe os registros pendentes: a cópia continua no dispositivo; uma sala reaberta pode voltar a sincronizar. Sair da sala durante uma queda preserva a fila. A exportação do servidor e o encerramento aguardam a confirmação do salvamento para não apresentar dados ainda pendentes como sincronizados. Se o armazenamento do navegador estiver indisponível ou cheio, o app avisa para manter a aba aberta ou baixar a cópia.

## Relatório avaliativo para LLM

No **Painel administrativo**, cada sala possui o botão **Relatório avaliativo para LLM**. Ele baixa um arquivo XML UTF-8 com os dados salvos da sessão, participantes, todas as notas e a cronologia dos acontecimentos. A exportação funciona em salas abertas e encerradas e exige acesso de admin também no servidor (`GET /api/admin/rooms/:id/llm-report`). O arquivo pode ser anexado ao modelo de IA escolhido; o app não envia os dados a serviços de IA.

Os eventos registram início, pausas, retomadas e término de discursos e debates moderados/não moderados, votos e resultados, moções, presença e alterações da sessão. Eles contêm metadados e tempos de fala, **não transcrições dos discursos**. Pausas e retomadas compartilham um identificador de atividade.

Sessões anteriores à criação desse registro exportam o histórico disponível. Registros antigos com apenas hora, sem data completa, aparecem em uma seção separada; não é possível recuperar eventos já descartados ou debates que não eram registrados. O XML informa essa limitação e a data de início do registro detalhado.

## Notas gerais e avaliações

Na seleção de salas, a área **Notas gerais** é exclusiva para usuários **Tools e admins**, com proteção também nas APIs. Ela reúne notas externas sobre DPOs e delegações e as notas das sessões abertas ou encerradas. Há filtros por comitê, **sessão individual**, delegação, origem, texto e **dia (horário de Brasília)**. Selecionar uma sessão restringe a consulta e a exportação àquela sala; os outros filtros continuam valendo. XML (schema 2) e JSON incluem somente notas e acontecimentos correspondentes aos filtros, inclusive dentro de `sessions`. A busca nos acontecimentos considera o tipo, detalhes, texto da nota vinculada e identificação da sessão; o filtro de delegação exige vínculo com a delegação. Registros antigos sem data completa ficam de fora quando um dia é selecionado. Totais acumulados e estado ao vivo não são exportados nessa consulta, pois não podem ser atribuídos aos filtros. Sem selecionar uma sessão, os acontecimentos são consultados nas sessões que têm notas; uma sessão individual também pode exportar acontecimentos mesmo sem notas correspondentes.

As notas externas são persistidas no banco independentemente das salas, com autor e datas. O autor e admins podem editá-las ou excluí-las; alterações simultâneas são detectadas para evitar sobrescrita. Tools e admins também podem editar texto e critérios ou excluir notas de sessões abertas pela consulta centralizada, com atualização ao vivo da sala. Dentro da sala, a aba Notas oferece essas mesmas ações. O contexto e a data original da nota são preservados na edição. Sessões encerradas permanecem somente para consulta; um admin pode reabri-las para corrigir notas.

Os critérios de avaliação aceitam valores inteiros de **1 a 5**: domínio do tema, aderência à política externa, participação nos debates, cooperação e diplomacia, elaboração da resolução, decoro, pontualidade e DPO. A categoria **DPO** mantém a nota geral e acrescenta cinco subcritérios: posicionamento sobre trabalhadores plataformizados; ações anteriores sobre o tema; posicionamento sobre o projeto de lei e o substitutivo 2; emendas propostas à audiência pública do PLP 152/2025; e respeito à estrutura do DPO no guia de estudos. Cada critério é opcional; **Não avaliado** não equivale a zero. As avaliações anteriores são preservadas, sem cálculo automático entre a nota geral de DPO e seus subcritérios. Os 13 critérios aparecem nas notas gerais, nas notas de delegação e discurso das salas e nos relatórios e exportações. No XML e JSON, os cinco novos critérios possuem `parentId: dpo` para identificar a subcategoria.

O arquivo [examples/notas-gerais-mock.xml](examples/notas-gerais-mock.xml) é um exemplo geral **inteiramente fictício**, com os quatro comitês, todas as 110 delegações/representações cadastradas, oito sessões em dois dias, 330 notas e acontecimentos de exemplo. Serve para testar a leitura do relatório por uma LLM; não é um arquivo de importação de salas. Para regenerá-lo com os cadastros atuais, execute `node scripts/generate-notes-mock.mjs`. O gerador usa o mesmo serializador da exportação e não acessa o banco da aplicação.

## Rubricas de avaliação

A aba **Rubricas**, na página inicial de Tools e admins, gera documentos Word diretamente das pontuações registradas, sem depender de LLM, Python ou conversão manual. O modelo segue o `gerador_rubricas.py` fornecido: tabela geral com estrelas, quatro questões norteadoras específicas do comitê, estrutura do DPO e avaliação final. As perguntas nos formulários de notas também acompanham o comitê; os quatro identificadores DPO existentes são mantidos, na ordem das questões do modelo. Convém revisar avaliações anteriores dos comitês internacionais, pois antes os formulários exibiam as perguntas da Câmara.

1. Selecione um ou mais comitês e marque explicitamente as sessões válidas, abertas ou encerradas. Nenhuma sessão é incluída automaticamente.
2. Se desejar, inclua as notas fora de sessão desses comitês e/ou delegações ainda sem avaliação.
3. Escolha **maior**, **menor** ou **última nota lançada**. A regra opera por critério e delegação dentro de cada comitê, antes de converter a escala. Campos sem pontuação são ignorados. A última lançada usa a data de criação, não a data de edição; empates de pontuação usam a data mais recente, e empates de data usam o ID do registro para garantir estabilidade.
4. Gere a prévia, confira a nota escolhida e sua origem e, opcionalmente, preencha a avaliação final. Esses textos ficam apenas na aba atual e no arquivo baixado; não são salvos como novas notas.
5. Baixe um DOCX geral, um DOCX por comitê ou o JSON consolidado. Mudanças nas avaliações que alterem o resultado exigem gerar outra prévia antes de baixar.

A avaliação geral usa **1 a 5 estrelas**, com uma estrela por ponto. Os conceitos do DPO mantêm a conversão **1–2 → D; 3 → C; 4 → B; 5 → A**. Ausência de avaliação não vira zero nem uma estrela. A avaliação final é manual; textos livres e acontecimentos não recebem pontuações inferidas. No JSON, `ratings` e `criterios_gerais` preservam a escala de 1 a 5; `dpo_questoes` e `dpo_formatacao` usam A–D. O conversor Python original limita as estrelas a quatro; para manter cinco estrelas, use o Word gerado pelo app ou ajuste esse conversor externo.

As rotas `/api/rubrics/options`, `/api/rubrics/preview` e `/api/rubrics/export` exigem Tools ou admin. A geração de Word usa a dependência Node `docx`, instalada com `npm install`/`npm ci`.

## Pedidos de ajuda

O botão **Pedir ajuda** fica disponível na página inicial e nas salas para usuários autenticados. Informe o número da sala física e uma mensagem curta. O backend encaminha `POST /api/help` ao webhook, com `room` e `message` na query string, `Content-Type: application/json` e corpo `{}`. O destino pode ser configurado por `SIMSD_HELP_WEBHOOK_URL`; sem configuração, usa o endereço n8n fornecido. Há limite de 80 caracteres para sala e 1000 para mensagem, com timeout de 10 segundos no backend. O formulário preserva os campos em caso de erro e bloqueia envios simultâneos. Os pedidos exigem conexão e não são reenviados automaticamente. Os testes usam um webhook local simulado.

## Validação de estado e encerramento

O backend valida a estrutura básica do estado recebido e limita seu tamanho a 2 MB em UTF-8 antes de gravar. Quadros WebSocket maiores que o limite encerram somente a conexão responsável. Após logout ou expiração da autenticação, o socket não pode enviar novas alterações.

O app encerra a sala com `POST /api/rooms/:id/close` e corpo `{}`, depois da confirmação dos envios. Integrações que incluam `state` nesse endpoint também devem enviar `baseVersion` correspondente à versão atual; versões antigas retornam 409 sem sobrescrever a sessão. Quando uma confirmação demora, o cliente consulta o estado pelo próprio WebSocket, sem fechar uma conexão aberta nem gravar localmente.

## Abas não sincronizadas

Dentro de uma sala, abra **Config**, marque **Abas não sincronizadas** e salve. A opção vale para a sala: cada usuário navega em sua própria aba, enquanto notas, votos e os demais dados continuam compartilhados. A escolha da aba fica apenas na memória de cada navegador e não gera envio pelo WebSocket. Ao desativar a opção, a aba escolhida por quem salvou volta a ser compartilhada com os participantes.
