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
