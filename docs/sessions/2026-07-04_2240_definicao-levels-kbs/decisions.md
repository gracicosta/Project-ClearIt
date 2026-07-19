# Decisões Tomadas — Definição do Levels e Bases de Conhecimento

## Decisão 1: Mapear 5 Competências e 4 Níveis no Framework de Levels
- **Contexto**: A feature F-03 necessita que os PDIs apontem competências explícitas associadas a Levels da ClearIT.
- **Decisão**: Adotar uma matriz de 5 competências (Entrega Técnica, Comunicação, Autonomia, Colaboração, Negócio) e 4 níveis (Júnior L1, Pleno L2, Sênior L3, Especialista L4).
- **Justificativa**: Garante um modelo simples, de fácil representação em banco de dados relacional (Prisma/SQLite) e intuitivo para o líder preencher.

## Decisão 2: Uso Programático do `@react-pdf/renderer` sem Tailwind
- **Contexto**: Como estruturar a geração de PDF no client-side sem quebrar por restrições de CSS global do Tailwind.
- **Decisão**: Utilizar os componentes estruturais do React-PDF (`Document`, `Page`, `View`, `Text`) estilizados localmente via `StyleSheet.create` de forma independente.
- **Justificativa**: Evita bugs de compilação uma vez que o motor de PDF do navegador não suporta classes CSS complexas.

## Decisão 3: Adoção do Novo SDK `@google/genai`
- **Contexto**: O SDK do Gemini foi atualizado, mudando os caminhos de importação e métodos.
- **Decisão**: Usar estritamente o pacote moderno `@google/genai` e configurar o prompt de sistema Clarify por meio do parâmetro `config.systemInstruction`.
- **Justificativa**: Mantém a codebase atualizada, usufruindo de melhorias de performance e dos recursos do Gemini 2.0.
