# Contexto — Definição do Levels e Bases de Conhecimento

## Situação Inicial
O projeto possuía especificações de produto prontas para desenvolvimento, mas havia lacunas de produto no Framework de Levels (necessário para PDIs na feature F-03) e potenciais armadilhas técnicas no uso do React-PDF (conflito de Tailwind) e na sintaxe do novo SDK do Gemini (@google/genai).

## Motivação
Adiantar esses estudos em KBs dedicadas e estruturadas antes do bootstrap do monorepo impede retrabalho ou escolhas de arquitetura e design equivocadas durante a fase de programação.

## Restrições
- Seguir as boas práticas do Onion Portable na estruturação de KBs (Visão Geral, Conceitos Chave, Exemplos Práticos, Gotchas).
- Usar estritamente o SDK moderno `@google/genai`.
