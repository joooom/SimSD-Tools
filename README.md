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

## Relatório avaliativo para LLM

No **Painel administrativo**, cada sala possui o botão **Relatório avaliativo para LLM**. Ele baixa um arquivo XML UTF-8 com os dados salvos da sessão, participantes, todas as notas e a cronologia dos acontecimentos. A exportação funciona em salas abertas e encerradas e exige acesso de admin também no servidor (`GET /api/admin/rooms/:id/llm-report`). O arquivo pode ser anexado ao modelo de IA escolhido; o app não envia os dados a serviços de IA.

Os eventos registram início, pausas, retomadas e término de discursos e debates moderados/não moderados, votos e resultados, moções, presença e alterações da sessão. Eles contêm metadados e tempos de fala, **não transcrições dos discursos**. Pausas e retomadas compartilham um identificador de atividade.

Sessões anteriores à criação desse registro exportam o histórico disponível. Registros antigos com apenas hora, sem data completa, aparecem em uma seção separada; não é possível recuperar eventos já descartados ou debates que não eram registrados. O XML informa essa limitação e a data de início do registro detalhado.

## Notas gerais e avaliações

Na seleção de salas, a área **Notas gerais** é exclusiva para usuários **Tools e admins**, com proteção também nas APIs. Ela reúne notas externas sobre DPOs e delegações e as notas das sessões abertas ou encerradas. Há filtros por comitê, delegação, origem e texto, além de exportação dos resultados em XML para LLM ou JSON.

As notas externas são persistidas no banco independentemente das salas, com autor e datas. O autor e admins podem editá-las; edições simultâneas são detectadas para evitar sobrescrita. Notas das sessões são consultadas nessa área e continuam sendo registradas dentro das salas.

Os oito critérios de avaliação aceitam valores inteiros de **1 a 5**: domínio do tema, aderência à política externa, participação nos debates, cooperação e diplomacia, elaboração da resolução, decoro, pontualidade e DPO. Cada critério é opcional; **Não avaliado** não equivale a zero. As avaliações também podem ser adicionadas às notas de delegação e discurso nas salas e são incluídas nos relatórios e exportações.
