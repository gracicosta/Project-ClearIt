# Decisões Tomadas — Criação do Agente Clarify

## Decisão 1: Nome do Agente como Clarify
- **Contexto**: O agente precisava de um nome amigável e focado em seu propósito.
- **Opções Consideradas**:
  - Opção A: Clarify
  - Opção B: Cure
  - Opção C: ClearIt Assistant
- **Decisão**: Opção A (Clarify).
- **Justificativa**: Um nome moderno, elegante e que remete diretamente à clareza e ao produto ClearIT.

## Decisão 2: Armazenar os prompts na pasta `/agents` na raiz
- **Contexto**: Onde salvar a definição do comportamento da IA de forma independente do código.
- **Opções Consideradas**:
  - Opção A: `/agents/clarify/` na raiz
  - Opção B: `/prompts/clarify/` na raiz
  - Opção C: `/backend/src/prompts/`
- **Decisão**: Opção A.
- **Justificativa**: Mantém os prompts como especificações portáteis de IA na raiz, facilitando a edição rápida, teste e versionamento independente do desenvolvimento do Express.

## Decisão 3: Menu de Opções e Funcionalidade F-07 (Análise de PDF) no Agente
- **Contexto**: O usuário solicitou que o agente possua um menu inicial de opções e tenha a capacidade de realizar a análise e auditoria de feedbacks salvos em PDFs antigos.
- **Decisão**: Implementar a funcionalidade F-07 de análise de PDF e integrar um menu interativo no comportamento inicial do Clarify.
- **Justificativa**: Melhora drasticamente a usabilidade (guia o gestor no que é possível fazer) e estende o escopo do assistente para suportar importações de histórico legado de feedbacks de forma complacente com a LGPD.
