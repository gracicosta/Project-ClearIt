# KB: Prompt Engineering — ClearIT 1:1 & Feedback AI Assistant 🧅

## 1. Visão Geral

Esta Knowledge Base define o padrão oficial de criação, versionamento, teste e manutenção dos prompts do **Assistente de 1:1 e Feedback da ClearIT**.

O objetivo é evitar que prompts fiquem espalhados diretamente no código, facilitar evolução controlada e permitir troca futura do provedor de IA sem reescrever as regras de negócio.

Esta KB complementa:

- `gemini-sdk-guide.md`
- `business-context-lite.md`
- `technical-context-lite.md`
- `levels-framework.md`

---

## 2. Princípios de Prompt Engineering

### 2.1. Prompts são artefatos de produto

Cada prompt deve ser tratado como parte da especificação do produto, não como texto improvisado no código.

Todo prompt precisa conter:

- objetivo;
- contexto;
- entradas esperadas;
- saída estruturada;
- restrições;
- exemplos;
- critérios de qualidade;
- versão.

### 2.2. IA recomenda, humano decide

A IA deve apoiar líderes e RH, mas nunca substituir a decisão humana.

Em fluxos sensíveis, como feedback corretivo, PDI e alertas de risco, a saída da IA deve ser apresentada como sugestão revisável.

### 2.3. Privacidade antes do processamento

Qualquer entrada de usuário deve passar pelo filtro LGPD antes de ser enviada ao modelo.

Dados proibidos devem ser bloqueados ou mascarados antes do prompt final.

### 2.4. Saídas previsíveis

Sempre que a resposta for consumida pelo sistema, o prompt deve solicitar JSON estruturado com schema explícito.

Texto livre deve ser reservado apenas para explicações visuais ao usuário.

---

## 3. Estrutura Oficial de um Prompt

Cada prompt oficial deve seguir este template:

```markdown
# Prompt: [Nome do Prompt]

## Código
PROMPT_[FEATURE]_[NOME]

## Versão
v1.0.0

## Feature relacionada
F-XX — [Nome da Feature]

## Objetivo
[O que o prompt deve produzir]

## Persona da IA
[Como a IA deve se comportar]

## Entradas
- [Campo 1]
- [Campo 2]

## Restrições
- [Regra 1]
- [Regra 2]

## Saída esperada
JSON estruturado ou texto orientativo.

## Schema de saída
[Schema esperado]

## Exemplos
[Entrada e saída esperada]

## Critérios de qualidade
- [Critério 1]
- [Critério 2]

## Fallback
[O que fazer quando faltarem dados]
```

---

## 4. Biblioteca Oficial de Prompts

| Código | Feature | Nome | Versão inicial | Modelo sugerido | Temperatura |
|---|---|---|---|---|---|
| `PROMPT_F01_ONE_ON_ONE_PREP` | F-01 | Preparação de 1:1 | v1.0.0 | Gemini Flash | 0.4 |
| `PROMPT_F02_SBI_FEEDBACK` | F-02 | Feedback SBI | v1.0.0 | Gemini Flash | 0.3 |
| `PROMPT_F03_PDI_OBJECTIVES` | F-03 | Geração de PDI | v1.0.0 | Gemini Flash | 0.4 |
| `PROMPT_F05_LGPD_AUDITOR` | F-05 | Auditor LGPD | v1.0.0 | Gemini Flash | 0.1 |
| `PROMPT_F07_LEGACY_FEEDBACK_ANALYSIS` | F-07 | Análise de Feedback Legado | v1.0.0 | Gemini Flash | 0.3 |
| `PROMPT_MEETING_SUMMARY` | F-01/F-04 | Resumo de Reunião | v1.0.0 | Gemini Flash | 0.3 |

---

## 5. Prompt F-01 — Preparação de 1:1

### Objetivo

Gerar um roteiro estruturado de reunião 1:1 com cinco blocos obrigatórios:

1. Check-in Humano
2. Pauta do Liderado
3. Status de Entregas e Obstáculos
4. Desenvolvimento, Carreira e Feedback
5. Acordos e Próximos Passos

### Entradas esperadas

```json
{
  "managerName": "string",
  "employeeAlias": "string",
  "meetingContext": "string",
  "previousAgreements": ["string"],
  "developmentFocus": "string",
  "preferredLanguage": "pt-BR"
}
```

### Saída esperada

```json
{
  "language": "pt-BR",
  "meetingTitle": "string",
  "preparationQuestion": "Existe algo que o liderado mencionou que deveria entrar na pauta hoje?",
  "suggestedCadence": "quinzenal | mensal",
  "sections": [
    {
      "key": "human_checkin",
      "title": "Check-in Humano",
      "questions": ["string"],
      "required": true
    }
  ],
  "developmentQuestions": ["string"],
  "agreementGuidance": {
    "requiresOwner": true,
    "requiresDueDate": true,
    "example": "string"
  },
  "warnings": ["string"]
}
```

### Critérios de qualidade

- Deve incluir os cinco blocos obrigatórios.
- Deve priorizar perguntas abertas.
- Deve evitar linguagem de cobrança ou microgestão.
- Deve incluir pelo menos uma pergunta de desenvolvimento.
- Deve lembrar que acordos precisam de responsável e prazo.

### Fallback

Se faltar contexto, o prompt deve gerar um roteiro genérico, mas sinalizar os dados ausentes em `warnings`.

---

## 6. Prompt F-02 — Feedback SBI

### Objetivo

Transformar um relato livre em feedback estruturado pelo modelo SBI:

- Situação
- Comportamento
- Impacto

### Entradas esperadas

```json
{
  "rawFeedback": "string",
  "feedbackType": "recognition | corrective | alignment",
  "preferredLanguage": "pt-BR"
}
```

### Saída esperada

```json
{
  "situation": "string",
  "behavior": "string",
  "impact": "string",
  "rewrittenFeedback": "string",
  "activeListeningQuestion": "Como você está vendo essa situação?",
  "managerSelfFeedbackQuestion": "Como eu poderia te apoiar melhor?",
  "languageWarnings": ["string"],
  "suggestedNextStep": "string"
}
```

### Critérios de qualidade

- Não deve atacar caráter.
- Deve remover generalizações como "sempre" e "nunca".
- Deve manter foco em fatos observáveis.
- Deve incluir etapa de escuta ativa antes da fala final do gestor.

---

## 7. Prompt F-03 — PDI

### Objetivo

Sugerir até três objetivos de PDI conectados ao Framework de Levels da ClearIT.

### Entradas esperadas

```json
{
  "employeeLevel": "L1 | L2 | L3 | L4",
  "targetCompetencies": ["string"],
  "developmentContext": "string",
  "preferredLanguage": "pt-BR"
}
```

### Saída esperada

```json
{
  "objectives": [
    {
      "competency": "string",
      "objective": "string",
      "actions": ["string"],
      "verificationMilestone": "string",
      "managerSupport": "string",
      "dueDateSuggestion": "string"
    }
  ],
  "warnings": ["string"]
}
```

### Critérios de qualidade

- Máximo de três objetivos.
- Cada objetivo deve ter competência oficial do Levels.
- Cada objetivo deve ter ação concreta, marco de verificação e suporte do gestor.
- Não deve gerar PDI genérico sem vínculo comportamental.

---

## 8. Prompt F-05 — Auditor LGPD

### Objetivo

Detectar dados pessoais sensíveis ou proibidos antes do salvamento ou envio ao modelo principal.

### Entradas esperadas

```json
{
  "inputText": "string",
  "context": "one_on_one | feedback | pdi | legacy_pdf"
}
```

### Saída esperada

```json
{
  "allowed": true,
  "riskLevel": "low | medium | high | blocked",
  "detectedCategories": ["cpf", "health", "salary", "family_context"],
  "maskedText": "string",
  "userMessage": "string"
}
```

### Critérios de qualidade

- CPF deve ser bloqueado ou mascarado.
- Dados de saúde, salário e contexto familiar detalhado devem ser bloqueados.
- A mensagem ao usuário deve ser educativa e não acusatória.
- A saída deve ser determinística, com temperatura baixa.

---

## 9. Prompt F-07 — Análise de Feedback Legado

### Objetivo

Analisar textos de feedback histórico, mapear SBI, detectar lacunas e propor reescrita segura.

### Entradas esperadas

```json
{
  "legacyFeedbackText": "string",
  "preferredLanguage": "pt-BR"
}
```

### Saída esperada

```json
{
  "lgpdAlerts": ["string"],
  "sbiMapping": {
    "situation": "string",
    "behavior": "string",
    "impact": "string"
  },
  "missingElements": ["string"],
  "toneWarnings": ["string"],
  "rewrittenFeedback": "string",
  "agreementsFound": ["string"],
  "nextStepsFound": ["string"]
}
```

---

## 10. Versionamento de Prompts

### 10.1. Formato de versão

Use versionamento semântico:

```text
vMAJOR.MINOR.PATCH
```

- `MAJOR`: muda contrato de entrada ou saída.
- `MINOR`: melhora comportamento sem quebrar schema.
- `PATCH`: ajustes de texto, exemplos ou restrições.

### 10.2. Registro de mudanças

Cada prompt deve manter um changelog:

```markdown
## Changelog
- v1.0.0 — Versão inicial.
- v1.1.0 — Adicionada validação de tom.
- v1.1.1 — Ajuste de exemplos.
```

---

## 11. Testes de Prompts

Todo prompt crítico deve ser testado com:

- caso feliz;
- entrada incompleta;
- entrada com dado sensível;
- entrada ambígua;
- entrada com linguagem inadequada;
- saída esperada validada por schema.

### Exemplo de matriz de teste

| Caso | Entrada | Esperado |
|---|---|---|
| F-01 básico | contexto simples de 1:1 | cinco blocos obrigatórios |
| F-02 agressivo | "ele é desorganizado" | reescrever como fato observável |
| F-05 CPF | texto com CPF | bloquear ou mascarar |
| F-03 PDI longo | quatro objetivos | retornar no máximo três |

---

## 12. Armadilhas (Gotchas)

- Não acoplar prompt ao SDK diretamente.
- Não salvar prompt apenas em constante TypeScript.
- Não misturar regras LGPD dentro de todos os prompts sem também ter auditor central.
- Não aceitar resposta livre quando a aplicação precisa persistir dados.
- Não alterar schema sem atualizar testes e versão.
- Não enviar dados pessoais sensíveis para a IA sem pré-processamento.

---

## 13. Próximos Passos

1. Criar arquivos de prompt em `backend/src/ai/prompts/`.
2. Criar schemas de validação em `backend/src/ai/schemas/`.
3. Implementar testes de prompt com casos fixos.
4. Integrar os prompts à interface `AIProvider`.
5. Registrar versões de prompt no banco ou em arquivo versionado.
