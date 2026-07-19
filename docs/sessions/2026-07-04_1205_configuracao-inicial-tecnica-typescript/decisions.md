# Decisões Tomadas — Configuração Inicial Técnica (TypeScript)

## Decisão 1: Utilização de TypeScript em todo o projeto
- **Contexto**: A stack original previa JS/TS híbrido, e a proposta anterior sugeria JavaScript puro para simplificar. O usuário prefere usar explicitamente TypeScript para obter seus benefícios de segurança de código.
- **Opções Consideradas**:
  - Opção A: JavaScript puro (Curva de aprendizado inicial ligeiramente menor, mas sem validações de tipo).
  - Opção B: Next.js (Desejado para unificar a stack, mas rejeitado pelo usuário por preferência de design).
  - Opção C: TypeScript puro no React e Node + Express (Tipagem forte, arquitetura clássica desacoplada).
- **Decisão**: Opção C.
- **Justificativa**: Atende à preferência explícita do desenvolvedor por TypeScript sem acoplá-lo a frameworks como Next.js.
- **Impacto**: Criação de arquivos `.ts` / `.tsx` e necessidade de configurar `tsconfig.json` em ambas as pastas.

## Decisão 2: Uso do runner `tsx` no backend
- **Contexto**: Executar arquivos TypeScript no Node.js geralmente requer build prévio com `tsc` ou setup complexo com `ts-node`.
- **Opções Consideradas**:
  - Opção A: `tsc --watch` (Gera arquivos JS compilados no disco, poluindo o diretório durante o desenvolvimento).
  - Opção B: `tsx` (TypeScript Execute - executa arquivos `.ts` diretamente em memória e com recarregamento rápido instantâneo).
- **Decisão**: Opção B (`tsx`).
- **Justificativa**: Mais simples para iniciantes, oferecendo a mesma experiência do `nodemon` com JS puro, sem compilações manuais ou arquivos JS intermediários.
- **Impacto**: Dependência extra de desenvolvimento no `backend/package.json`.

## Decisão 3: Uso de React-PDF (`@react-pdf/renderer`) para relatórios
- **Contexto**: A proposta inicial previa o uso de estilos de impressão nativos (CSS) ou jsPDF. No entanto, o desenvolvedor optou por utilizar React-PDF para relatórios mais robustos e estruturados.
- **Opções Consideradas**:
  - Opção A: Impressão CSS nativa e jsPDF (Mais simples, porém menos customizável para relatórios complexos).
  - Opção B: React-PDF no frontend (Estrutura o PDF declarativamente com componentes React, resultando em qualidade premium).
- **Decisão**: Opção B.
- **Justificativa**: Garante relatórios visualmente consistentes e alinhados ao nível de qualidade exigido pelo RH da ClearIT.
- **Impacto**: Instalação do `@react-pdf/renderer` no frontend.
