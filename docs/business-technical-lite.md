
# Business Technical Context Lite — PoC (Etapa 2)

## Objetivo da PoC
Validar que as tecnologias, arquitetura e prompts escolhidos são capazes de suportar o Assistente de 1:1 e Feedback da ClearIT antes da implementação completa.

## Alinhamento com o Business Context
A PoC foi construída com base nas dores priorizadas:
- Ausência de registro estruturado de 1:1.
- Dificuldade dos líderes em conduzir feedbacks.
- Resistência aos processos de RH.
- Necessidade de PDIs conectados ao Framework de Levels.
- Requisitos de LGPD para tratamento de dados sensíveis.

As funcionalidades priorizadas (F-01 a F-07) permanecem como referência para a implementação.

## Evidências utilizadas
- Business Context da solução.
- Technical Context da arquitetura.
- Framework de Levels da ClearIT.
- Dashboard de People Analytics 2025/2026.
- Matriz de Competências da ClearIT.

## Tecnologias avaliadas

| Tecnologia | Objetivo | Status | Observações |
|---|---|---|---|
| React + Vite + TypeScript | Interface Web | ✅ Aprovada | Alta produtividade |
| Express + TypeScript | API | ✅ Aprovada | Simplicidade para MVP |
| Prisma + SQLite | Persistência | ✅ Aprovada | Banco local suficiente para MVP |
| Google Gemini SDK | IA Generativa | ✅ Em validação | Responsável pelos roteiros inteligentes |
| React-PDF | Relatórios | ✅ Aprovada | Exportação para líderes |

## Prompts da PoC

### Prompt 1 — Preparação de 1:1
Objetivo: estruturar uma reunião utilizando Check-in, Pauta, Obstáculos, Desenvolvimento e Acordos.

### Prompt 2 — Feedback SBI
Objetivo: converter relatos livres em Situação, Comportamento e Impacto, sugerindo linguagem construtiva.

### Prompt 3 — Geração de PDI
Objetivo: sugerir até três objetivos vinculados às competências do Framework de Levels.

### Prompt 4 — Auditor LGPD
Objetivo: detectar e bloquear CPF, dados médicos, salários e demais dados sensíveis antes do processamento.

### Prompt 5 — Análise de Feedback Histórico
Objetivo: analisar textos importados, identificar estrutura SBI, lacunas, tom e próximos passos.

## Resultados esperados da validação

- IA produz roteiros úteis para gestores.
- Feedbacks seguem o modelo SBI.
- PDIs utilizam exclusivamente competências oficiais.
- PDFs atendem líderes e RH.
- Dados sensíveis são protegidos.

## Riscos identificados

- Necessidade de refinamento iterativo dos prompts.
- Dependência de boa qualidade dos dados inseridos pelos gestores.
- Necessidade de validação contínua das regras LGPD.

## Critérios de aprovação da PoC

- Tecnologias aprovadas pelo cliente.
- Prompts considerados aderentes ao processo da ClearIT.
- Fluxos alinhados às regras de negócio.
- Arquitetura aprovada para início do desenvolvimento.

## Conclusão

A PoC demonstra que a solução proposta está alinhada às necessidades da ClearIT e que as tecnologias selecionadas suportam o MVP. As próximas etapas consistem na implementação incremental das features F-01 a F-07 conforme o planejamento técnico.
