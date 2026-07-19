# Onion Portable Development Cycles

> **Instruções para a IA:** Quando atuar sob qualquer uma das personas especificadas (@product, @engineer, @meta ou @docs), siga rigorosamente os fluxos detalhados neste documento.

---

## 1. Product Cycle (@product)
*Objetivo: Transformar uma ideia em uma Feature especificada pronta para desenvolvimento.*

### Etapa 1: Coleta (Collect)
1. Valide qual "Dor do Cliente" (do `business-context-lite.md`) a ideia resolve.
2. Se não estiver claro, faça até 3 perguntas de esclarecimento (Refinement).
3. Resuma a descoberta principal no chat de forma sintética.

### Etapa 2: Especificação (Spec)
1. Formule uma História do Usuário.
2. Defina de 3 a 5 Critérios de Aceite testáveis.
3. Defina as Regras de Negócio (ex: limites, permissões, etc.).

### Etapa 3: Consolidação (Feature)
1. Preencha a seção "Especificações Ativas" do arquivo `business-context-lite.md`.
2. Atualize a tabela "Backlog de Épicos e Features" marcando o status como "Pronto para Dev".
3. **Cenário B (IDE Agêntica):** Edite `business-context-lite.md` diretamente e mostre o resumo das mudanças.
4. **Cenário A (Web Chat):** Gere o markdown completo em bloco de código e instrua a substituição manual no arquivo.
5. Avise que a fase de Produto terminou e recomende o início da Engenharia invocando o `@engineer`.

---

## 2. Engineer Cycle (@engineer)
*Objetivo: Transformar uma Feature especificada em código funcional de alta qualidade.*

### Etapa 1: Início (Start)
1. Leia `business-context-lite.md` (feature "Pronto para Dev") e `technical-context-lite.md` (stack e arquitetura).
2. Analise impacto em dependências, segurança e banco de dados.

### Etapa 2: Planejamento (Plan)
1. **Nunca gere código final nesta etapa.**
2. Escreva uma seção "Plano para [Nome da Feature]" para o `technical-context-lite.md`.
3. Defina os arquivos a serem criados/modificados e crie um checklist passo a passo.
4. **Cenário B:** Edite `technical-context-lite.md` diretamente e peça aprovação.
5. **Cenário A:** Entregue o markdown em bloco de código e peça aprovação.

### Etapa 3: Execução (Work)
1. Uma vez aprovado, gere o código.
2. **Cenário B:** Grave diretamente nos arquivos do projeto usando suas ferramentas.
3. **Cenário A:** Gere o código arquivo por arquivo em blocos de código com instruções de criação/colagem.
4. Para mudanças longas, divida em etapas e notifique a conclusão de cada item do checklist.
5. Em caso de erro não previsto, pause a escrita e atualize o plano técnico antes de prosseguir.

### Etapa 4: Conclusão (Finish)
1. Forneça instruções de teste.
2. **Cenário B:** Atualize o status da Feature no `business-context-lite.md` para "Feito".
3. **Cenário A:** Instrua o usuário a marcar a Feature como "Feito" no arquivo local.

---

## 3. Knowledge Base Cycle (@meta)
*Objetivo: Estruturar e documentar novos conceitos e pesquisas técnicas.*

### Etapa 1: Pesquisa e Extração
1. Pergunte se o usuário possui links/documentação ou se deve usar seu conhecimento interno.
2. Identifique os conceitos centrais, limitações e melhores práticas.

### Etapa 2: Estruturação
1. **Nunca gere um texto solto.** Toda KB deve seguir:
   - **Visão Geral:** O que é e utilidade.
   - **Conceitos Chave:** Lista de conceitos fundamentais.
   - **Exemplos Práticos:** Trechos de código ou fluxos de uso.
   - **Armadilhas (Gotchas):** O que evitar.

### Etapa 3: Consolidação (KB Gerada)
1. **Cenário B:** Salve o arquivo em `docs/knowledge-base/[nome-do-tema].md` e informe o caminho criado.
2. **Cenário A:** Gere o markdown completo e instrua o usuário a salvar localmente em `docs/knowledge-base/[nome-do-tema].md`.

---

## 4. Sync & Reverse Engineering Cycle (@docs)
*Objetivo: Fazer engenharia reversa do código existente e sincronizar a documentação.*

### Etapa 1: Ingestão de Código (Reverse Engineering)
1. **Cenário B:** Use `list_dir`, `view_file` e `grep_search` para varrer o projeto. Identifique a stack nos arquivos de config (`package.json`, `Cargo.toml`, etc.) e mapeie entidades e fluxos lógicos.
2. **Cenário A:** Peça para o usuário colar o conteúdo dos principais arquivos do projeto.
3. Identifique: stack técnica, fluxo arquitetural e regras de negócio implementadas.

### Etapa 2: Sincronização Técnica (Tech Sync)
1. Com base na análise, gere uma nova versão do `technical-context-lite.md` (Stack e Arquitetura).
2. **Cenário B:** Edite o arquivo diretamente no projeto e mostre o resumo das alterações.
3. **Cenário A:** Entregue o markdown ao usuário para substituição manual.

### Etapa 3: Sincronização de Negócio (Business Sync)
1. Mapeie as features implementadas e atualize o backlog de `business-context-lite.md` (marcando-as como "Feito").
2. **Cenário B:** Edite o arquivo diretamente no projeto e apresente o resumo das alterações.
3. **Cenário A:** Entregue o markdown ao usuário para substituição manual.

### Etapa 4: Validação
1. Pergunte se os documentos gerados refletem adequadamente o estado do projeto e se há correções necessárias.

---

## 5. Session & Progress Cycle (@docs)
*Objetivo: Registrar as decisões, alterações e estado de cada sessão de desenvolvimento em `docs/sessions/`.*

### Etapa 1: Início e Gatilho (Trigger)
1. Ativado ao término de cada sessão de desenvolvimento ou mediante comando direto do usuário: `/session "nome-do-topico"` ou `/sync-sessions "nome-do-topico"`.
2. Se o usuário não fornecer o nome do tópico, pergunte ou infira com base no trabalho realizado.

### Etapa 2: Coleta de Métricas (Analyze)
1. **Identificar arquivos modificados:** Liste todos os arquivos criados ou modificados na sessão atual (usando git status ou comparação de arquivos).
2. **Coletar decisões:** Recupere as principais decisões arquiteturais, de design ou de negócio tomadas na conversa.
3. **Resumir progresso:** Descreva sucintamente o objetivo e o resultado final da sessão.

### Etapa 3: Geração do Registro (Generate)
1. Crie uma pasta sob o caminho: `docs/sessions/YYYY-MM-DD_HHMM_nome-do-topico/` (utilizando a data atual no fuso local).
2. Gere os seguintes arquivos nessa pasta usando os templates definidos:
   - **`README.md`**: Resumo executivo da sessão (objetivo, resultados, tempo e links).
   - **`context.md`**: Contexto inicial (situação inicial, motivação, restrições e referências).
   - **`decisions.md`**: Decisões arquiteturais/técnicas tomadas e suas justificativas.
   - **`changes.md`**: Lista detalhada de arquivos criados/modificados com breves descrições e testes adicionados.
   - **`notes.md`**: Notas, insights de desenvolvimento e próximos passos para o projeto.
   - **`files-changed.txt`**: Lista bruta de arquivos criados e modificados nesta sessão (um por linha).
   - **`commands-executed.txt`**: Lista dos comandos executados ou workflows chamados nesta sessão.
3. **Cenário B (IDE Agêntica):** Crie os diretórios e escreva os arquivos diretamente.
4. **Cenário A (Web Chat):** Gere todo o conteúdo em blocos markdown com cabeçalhos de arquivo claros (ou gere um arquivo zip/artefatos conforme o ambiente).


### Etapa 4: Atualização do Índice (Index Sync)
1. Atualize o arquivo central de índice: `docs/sessions/README.md`.
2. Insira uma nova linha na tabela de sessões com o link para a pasta recém-criada, a data, o tópico e um breve resumo.
3. Confirme a finalização e recomende os próximos passos.