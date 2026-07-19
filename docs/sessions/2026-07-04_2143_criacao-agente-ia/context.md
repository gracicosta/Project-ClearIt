# Contexto — Criação do Agente Clarify

## Situação Inicial
O projeto possui especificações de produto prontas para desenvolvimento, mas ainda não tinha uma estrutura definida para o comportamento do assistente de IA em si, nem um local específico para salvar seus prompts.

## Motivação
Ter os prompts estruturados e organizados em uma pasta separada (`/agents`) facilita a manutenção e evolução do comportamento da IA de forma independente do código da aplicação backend/frontend.

## Restrições
- Seguir as regras de LGPD de não armazenar dados sensíveis.
- Seguir a risca a estruturação de 1:1s e feedbacks SBI do `business-context-lite.md`.
