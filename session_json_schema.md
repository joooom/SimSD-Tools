# Esquema do Arquivo de Exportação da Sessão (.json)

Este documento descreve a estrutura e o formato do arquivo JSON gerado ao exportar uma sessão no **SimSD — Chair**. O arquivo de exportação contém todos os dados brutos da sessão em andamento, incluindo configurações, participantes, presença, discursos, histórico, moções e votações registradas.

---

## Estrutura Geral (Schema)

O JSON é estruturado como um objeto único contendo chaves para configurações gerais, dados de caucuses específicos, status da votação corrente e históricos detalhados.

### 1. Configurações e Metadados Gerais
* `config` (Object): Informações básicas da sessão configurada.
  * `conference` (String): Nome da conferência de simulação (ex: `"SimSD 2026"`).
  * `committee` (String): Nome do comitê (ex: `"Câmara dos Deputados"` ou `"UNODC"`).
  * `session` (String): Identificação da sessão ativa (ex: `"1ª Sessão"`).
  * `defaultTime` (Number): Tempo padrão por orador na GSL, em segundos (ex: `60`).
  * `warnTime` (Number): Tempo de aviso prévio para término do discurso, em segundos (ex: `15`).
* `committeeType` (String): Tipo do comitê, podendo ser `"onu"` ou `"camara"`.
* `committeeKey` (String): Identificador abreviado do comitê selecionado (`"camara"`, `"unodc"`, `"oea"`, ou `"unesco"`).
* `agenda` (String): Descrição da agenda ou tópico adotado na sessão.
* `activeTab` (String): Última aba visualizada ativa (`"gsl"`, `"motions"`, `"mod"`, `"unmod"`, `"solo"`, `"vote"`, ou `"presence"`).
* `presenceConfirmed` (Boolean): Indica se a chamada inicial e presença foram finalizadas.
* `sessionEnded` (Boolean): Indica se a sessão foi explicitamente encerrada pelo Chair.

### 2. Participantes Selecionados
* `selectedSetupArr` (Array of Strings): Lista de nomes dos participantes selecionados durante o setup.
* `committeeCountries` (Array of Objects): Lista de objetos detalhando cada participante ativo:
  * `c` (String): Nome completo do participante/país.
  * `f` (String): Ícone ou emoji de bandeira padrão atribuído.
  * `i` (String|null): Código ISO de duas letras para exibição de bandeira (ex: `"br"`), ou `null` para representações sem bandeira nacional.
  * `r` (String): Região geográfica do participante (ex: `"americas"`, `"europe"`, `"asia"`, `"africa"`, `"mideast"`, ou `"camara"`).
  * `voto` (Boolean): Indica se a delegação tem direito a voto (`true` ou `false`).
  * `sub` (String|null): Subtítulo contendo o nome do delegado ou filiação (ex: sigla partidária na Câmara ou nome oficial da nação).
  * `cat` (String|null): Categoria do participante (ex: `"Parlamentar"`, `"Sociedade Civil"` - aplicável apenas à Câmara).

### 3. Presença e Métricas de Discurso
* `presence` (Object): Dicionário mapeando o nome de cada participante ao seu status de presença atual (`"presente"`, `"presente-votante"` ou `"ausente"`).
* `speeches` (Object): Dicionário contendo a contagem total de discursos concluídos por cada participante na sessão.
* `speakTime` (Object): Dicionário contendo a soma do tempo total falado (em segundos) por cada participante na GSL.

### 4. Fila da GSL e Histórico de Oradores
* `speakers` (Array of Objects): Fila atual de oradores na Lista Geral de Oradores (GSL). O primeiro elemento representa o orador atual.
  * `c` (String): Nome do participante.
  * `f` (String): Bandeira/símbolo.
  * `receivedFrom` (String|null): Caso o discurso tenha sido cedido, nome do participante de origem.
  * `receivedFromFlag` (String|null): Bandeira do participante de origem que cedeu o tempo.
* `curIdx` (Number): Índice do orador atual na fila da GSL.
* `history` (Array of Objects): Histórico cronológico reverso dos discursos ocorridos na GSL.
  * `c` (String): Nome do participante que discursou.
  * `f` (String): Bandeira/símbolo.
  * `t` (String): Hora local em que o discurso foi registrado (`"HH:MM:SS"`).
  * `sec` (Number): Segundos efetivamente falados pelo orador.
  * `yielded` (String|Boolean): Destinatário da cessão de tempo (`"chair"`, nome do país cedido, ou `false`).
  * `yieldedFlag` (String|null): Bandeira do país que recebeu a cessão de tempo.
  * `received` (String|null): Nome do país que cedeu o tempo para este orador.
  * `receivedFlag` (String|null): Bandeira de quem cedeu o tempo.

### 5. Moções e Votações
* `motions` (Array of Objects): Lista de moções introduzidas na sessão.
  * `id` (String): ID único gerado a partir do timestamp.
  * `type` (String): Tipo da moção (`"mod"`, `"unmod"`, `"vote"`, `"recess"`, ou `"other"`).
  * `prop` (String): Nome da delegação proponente.
  * `dur` (String|Number): Duração total em minutos.
  * `spk` (String|Number): Tempo individual por orador em segundos.
  * `status` (String): Status de avaliação da moção (`"pending"`, `"approved"`, ou `"rejected"`).
  * `ts` (String): Hora de registro da moção (`"HH:MM:SS"`).
* `votes` (Object): Registro temporário de votos da votação em andamento, associando o nome do participante ao voto (`"fav"`, `"fdr"`, `"con"`, `"cdr"` ou `"abs"`).
* `voteConfig` (Object): Parâmetros da votação em andamento.
  * `type` (String): Tipo da votação (`"procedimental"` ou `"substancial"`).
  * `majority` (String): Regra de maioria requerida (`"simples"`, `"qualificada"`, `"csnu"`, ou `"consenso"`).
* `voteHistory` (Array of Objects): Histórico de votações concluídas e arquivadas.
  * `label` (String): Título ou descrição da votação (ex: `"DR/1/BRA"`).
  * `type` (String): Tipo de votação.
  * `majority` (String): Regra de maioria aplicada.
  * `t` (String): Hora local da votação (`"HH:MM:SS"`).
  * `maj` (Number): Quórum mínimo/votos necessários para aprovação.
  * `totalFavor` (Number): Votos favoráveis totais calculados (`fav` + `fdr`).
  * `approved` (Boolean): Indica se a votação foi aprovada (`true`/`false`).
  * `tally` (Object): Contagem agregada dos votos (`fav`, `fdr`, `con`, `cdr`, `abs`).
  * `detail` (Array of Objects): Votos individuais declarados por delegação:
    * `c` (String): Nome do participante.
    * `f` (String): Bandeira/símbolo.
    * `v` (String): Voto castado (`"fav"`, `"fdr"`, `"con"`, `"cdr"`, ou `"abs"`).

### 6. Estados dos Caucuses Individuais
* `mod` (Object): Estado do caucus moderado corrente.
  * `totalSec` (Number): Segundos restantes para o encerramento do caucus.
  * `totalTotal` (Number): Duração total limite configurada em segundos.
  * `spkSec` (Number): Segundos restantes para o orador atual.
  * `spkTotal` (Number): Tempo limite individual por orador em segundos.
  * `running` (Boolean): Estado de execução do cronômetro (sempre `false` na exportação).
  * `iv` (null): ID do intervalo de execução (sempre `null` na exportação).
  * `spks` (Array of Objects): Fila de oradores programados no caucus moderado.
  * `cur` (Number): Índice do orador atual no caucus moderado.
* `unmod` (Object): Estado do caucus não-moderado corrente.
  * `sec` (Number): Segundos restantes para o fim do caucus.
  * `total` (Number): Duração limite configurada em segundos.
  * `running` (Boolean): Estado do cronômetro (sempre `false`).
  * `iv` (null): Sempre `null`.
* `solo` (Object): Estado do caucus de orador único.
  * `sec` (Number): Segundos restantes.
  * `total` (Number): Duração limite configurada em segundos.
  * `running` (Boolean): Estado do cronômetro (sempre `false`).
  * `iv` (null): Sempre `null`.
  * `code` (String): Nome da delegação discursando no Solo.
  * `flag` (String): Símbolo de bandeira/ícone do orador do Solo.
  * `iso` (String|null): Código ISO da bandeira nacional do orador do Solo.

---

## Exemplo de Arquivo JSON

```json
{
  "config": {
    "conference": "SimSD 2026",
    "committee": "UNODC",
    "session": "1ª Sessão",
    "defaultTime": 60,
    "warnTime": 15
  },
  "committeeType": "onu",
  "committeeKey": "unodc",
  "agenda": "Vulnerabilidade Juvenil e Expansão do Uso de Drogas",
  "activeTab": "gsl",
  "presenceConfirmed": true,
  "sessionEnded": false,
  "selectedSetupArr": [
    "Brasil",
    "Estados Unidos"
  ],
  "committeeCountries": [
    {
      "c": "Brasil",
      "f": "🇧🇷",
      "i": "br",
      "r": "americas",
      "voto": true,
      "sub": "República Federativa do Brasil",
      "cat": null
    },
    {
      "c": "Estados Unidos",
      "f": "🇺🇸",
      "i": "us",
      "r": "americas",
      "voto": true,
      "sub": "Estados Unidos da América",
      "cat": null
    }
  ],
  "presence": {
    "Brasil": "presente-votante",
    "Estados Unidos": "presente"
  },
  "speeches": {
    "Brasil": 2,
    "Estados Unidos": 1
  },
  "speakTime": {
    "Brasil": 110,
    "Estados Unidos": 45
  },
  "speakers": [
    {
      "c": "Brasil",
      "f": "🇧🇷"
    }
  ],
  "curIdx": 0,
  "history": [
    {
      "c": "Estados Unidos",
      "f": "🇺🇸",
      "t": "14:15:30",
      "sec": 45,
      "yielded": "chair",
      "yieldedFlag": null,
      "received": null,
      "receivedFlag": null
    }
  ],
  "motions": [],
  "votes": {},
  "voteConfig": {
    "type": "procedimental",
    "majority": "simples"
  },
  "voteHistory": [],
  "mod": {
    "totalSec": 900,
    "totalTotal": 900,
    "spkSec": 60,
    "spkTotal": 60,
    "running": false,
    "iv": null,
    "spks": [],
    "cur": 0
  },
  "unmod": {
    "sec": 600,
    "total": 600,
    "running": false,
    "iv": null
  },
  "solo": {
    "sec": 60,
    "total": 60,
    "running": false,
    "iv": null,
    "code": "",
    "flag": "",
    "iso": null
  }
}
```
