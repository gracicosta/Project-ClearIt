# KB: AI Architecture — ClearIT 1:1 & Feedback AI Assistant 🧅

## 1. Visão Geral

Esta Knowledge Base define a arquitetura de Inteligência Artificial do **Assistente de 1:1 e Feedback da ClearIT**.

O objetivo é permitir o uso inicial do **Google Gemini** com possibilidade real de troca futura para outro provedor, sem reescrever a aplicação inteira.

A regra arquitetural central é:

> O backend nunca deve depender diretamente de um SDK de IA fora da camada de providers.

---

## 2. Objetivos da Arquitetura

- Isolar o SDK do Google Gemini atrás de uma interface.
- Padronizar entradas e saídas de IA.
- Reduzir impacto de troca futura de provedor.
- Controlar prompts por versão.
- Aplicar LGPD antes do envio ao modelo.
- Permitir logs e métricas sem armazenar conteúdo sensível.
- Facilitar testes automatizados com providers mockados.

---

## 3. Visão de Alto Nível

```text
Frontend React
      ↓
Backend Express
      ↓
AI Service
      ↓
AI Provider Interface
      ↓
Gemini Provider
```

No futuro:

```text
AI Provider Interface
      ├── Gemini Provider
      ├── OpenAI Provider
      ├── Azure OpenAI Provider
      └── Mock Provider
```

---

## 4. Camadas da Arquitetura

### 4.1. Frontend

Responsável por:

- coletar dados do gestor;
- exibir sugestões da IA;
- permitir edição humana;
- exibir alertas LGPD;
- enviar apenas dados necessários ao backend.

O frontend não deve chamar diretamente o Gemini ou qualquer outro provedor.

### 4.2. Backend API

Responsável por:

- autenticar usuário;
- validar permissões;
- validar payloads;
- executar filtro LGPD;
- chamar o AI Service;
- persistir resultados aprovados pelo usuário.

### 4.3. AI Service

Responsável por orquestrar casos de uso de IA:

- preparação de 1:1;
- feedback SBI;
- PDI;
- resumo de reunião;
- auditoria LGPD;
- análise de feedback legado.

O AI Service decide qual prompt usar, qual provider chamar e como tratar falhas.

### 4.4. AI Provider

Interface estável usada pelo AI Service.

Nenhuma regra de negócio deve depender diretamente do Gemini.

### 4.5. Gemini Provider

Implementação concreta usando `@google/genai`.

Responsável por:

- inicializar cliente Gemini;
- aplicar configuração de modelo;
- enviar prompt;
- retornar resposta padronizada;
- tratar erros específicos do SDK.

---

## 5. Interface Sugerida

```typescript
export interface AIProvider {
  generateOneOnOne(input: GenerateOneOnOneInput): Promise<GenerateOneOnOneOutput>;
  generateFeedback(input: GenerateFeedbackInput): Promise<GenerateFeedbackOutput>;
  generatePDI(input: GeneratePDIInput): Promise<GeneratePDIOutput>;
  summarizeMeeting(input: SummarizeMeetingInput): Promise<SummarizeMeetingOutput>;
  analyzeLegacyFeedback(input: AnalyzeLegacyFeedbackInput): Promise<AnalyzeLegacyFeedbackOutput>;
  auditPrivacy(input: AuditPrivacyInput): Promise<AuditPrivacyOutput>;
}
```

---

## 6. Contratos de Entrada e Saída

### 6.1. Padrão de Input

Todo input deve conter:

```typescript
interface BaseAIInput {
  preferredLanguage: 'pt-BR' | 'en-US';
  requestId?: string;
  userId?: string;
}
```

### 6.2. Padrão de Output

Todo output deve conter:

```typescript
interface BaseAIOutput {
  provider: 'gemini' | 'openai' | 'mock';
  model: string;
  promptVersion: string;
  warnings?: string[];
}
```

### 6.3. Benefícios

Esse padrão permite:

- auditoria;
- rastreabilidade;
- comparação entre provedores;
- testes A/B futuros;
- diagnóstico de erros.

---

## 7. Estratégia de Idioma

O MVP deve usar:

- `pt-BR` como idioma principal;
- `en-US` como idioma secundário.

Toda chamada de IA deve receber `preferredLanguage`.

A IA deve retornar a resposta no idioma solicitado, sem misturar idiomas.

---

## 8. Estratégia de Provedor

### 8.1. Provedor inicial

```text
Google Gemini
```

Motivo:

- já validado na PoC;
- bom custo-benefício;
- integração simples via `@google/genai`.

### 8.2. Troca futura

Para trocar o provedor, deve ser necessário alterar apenas:

- implementação concreta do provider;
- configuração de ambiente;
- testes de compatibilidade.

A interface `AIProvider` deve permanecer estável.

### 8.3. Seleção por variável de ambiente

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=...
```

Futuramente:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=...
```

---

## 9. Organização de Pastas Recomendada

```text
backend/src/
├── ai/
│   ├── providers/
│   │   ├── ai-provider.interface.ts
│   │   ├── gemini.provider.ts
│   │   └── mock.provider.ts
│   ├── prompts/
│   │   ├── f01-one-on-one.prompt.ts
│   │   ├── f02-sbi-feedback.prompt.ts
│   │   ├── f03-pdi.prompt.ts
│   │   ├── f05-lgpd-auditor.prompt.ts
│   │   └── f07-legacy-feedback.prompt.ts
│   ├── schemas/
│   │   ├── one-on-one.schema.ts
│   │   ├── feedback.schema.ts
│   │   ├── pdi.schema.ts
│   │   └── privacy.schema.ts
│   ├── ai.service.ts
│   └── ai-provider.factory.ts
```

---

## 10. Fluxo de Chamada IA — F-01

```text
Gestor preenche contexto da 1:1
        ↓
Frontend envia dados ao backend
        ↓
Backend valida payload
        ↓
Filtro LGPD analisa entrada
        ↓
AI Service seleciona Prompt F-01
        ↓
AIProvider chama GeminiProvider
        ↓
Gemini retorna JSON estruturado
        ↓
Backend valida schema
        ↓
Frontend exibe sugestão editável
        ↓
Gestor aprova ou ajusta
        ↓
Sistema salva versão final
```

---

## 11. LGPD e Segurança

### 11.1. Antes da IA

Antes de chamar qualquer provider:

- validar CPF;
- detectar dados de saúde;
- detectar salário/faixa salarial;
- detectar contexto familiar detalhado;
- mascarar ou bloquear dados sensíveis.

### 11.2. Durante a IA

O prompt deve reforçar:

- não inferir dados sensíveis;
- não pedir informações proibidas;
- não armazenar dados pessoais desnecessários.

### 11.3. Depois da IA

Antes de persistir:

- validar schema;
- remover campos proibidos;
- registrar apenas metadados seguros.

---

## 12. Observabilidade

Registrar metadados técnicos:

```json
{
  "requestId": "string",
  "feature": "F-01",
  "provider": "gemini",
  "model": "gemini-2.0-flash",
  "promptVersion": "v1.0.0",
  "status": "success | error",
  "durationMs": 1234
}
```

Evitar logs com:

- texto integral de 1:1;
- feedbacks sensíveis;
- dados pessoais;
- conteúdo bruto de PDF.

---

## 13. Tratamento de Falhas

### 13.1. Erro de provider

Se o Gemini falhar:

- retornar mensagem amigável;
- permitir preenchimento manual;
- não bloquear a reunião.

### 13.2. Erro de schema

Se a IA retornar JSON inválido:

- tentar uma correção automática uma única vez;
- se falhar, retornar fallback manual.

### 13.3. Falta de contexto

Se os dados forem insuficientes:

- gerar sugestão genérica;
- listar campos ausentes em `warnings`.

---

## 14. Estratégia de Testes

### 14.1. Testes unitários

- `AIService` com `MockProvider`;
- validação de schemas;
- factory de provider;
- fallback de erro.

### 14.2. Testes de contrato

- input F-01 retorna cinco blocos obrigatórios;
- input F-02 retorna SBI completo;
- input F-03 retorna no máximo três objetivos;
- input F-05 bloqueia dados sensíveis;
- input F-07 retorna lacunas e reescrita.

### 14.3. Testes manuais

- validar tom humano;
- validar aderência ao RH;
- validar clareza para gestores recém-promovidos;
- validar ausência de termos agressivos.

---

## 15. Decisões Arquiteturais

| Decisão | Escolha | Justificativa |
|---|---|---|
| Provedor inicial | Google Gemini | Já validado na PoC |
| Troca futura | Via `AIProvider` | Evita acoplamento |
| Idiomas | pt-BR e en-US | Produto principal em português com suporte secundário |
| Execução | Backend-only | Protege API key e regras |
| Saída | JSON estruturado | Facilita persistência e validação |
| Privacidade | Pré-filtro LGPD | Reduz risco jurídico e de exposição |

---

## 16. Armadilhas (Gotchas)

- Não chamar Gemini diretamente no controller.
- Não expor API key no frontend.
- Não salvar conteúdo sensível em logs.
- Não depender de texto livre quando o sistema precisa salvar campos estruturados.
- Não misturar prompts de features diferentes.
- Não trocar provider sem testes de contrato.
- Não usar IA como única fonte de decisão em temas de RH.

---

## 17. Próximos Passos

1. Criar a interface `AIProvider`.
2. Criar `GeminiProvider`.
3. Criar `MockProvider` para testes.
4. Criar `AIProviderFactory`.
5. Criar prompts versionados por feature.
6. Criar schemas de validação.
7. Integrar o fluxo F-01 no `AIService`.
