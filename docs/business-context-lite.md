# Business Context - ClearIT 1:1 & Feedback AI Assistant

> Este arquivo é a fonte de verdade para Produto. O agente `@product` atualizará este arquivo quando houver novas descobertas baseadas no alinhamento com o RH da ClearIT.

## 1. Visão do Produto
O **Assistente de 1:1s e Feedbacks da ClearIT** é uma solução web responsiva (mobile e desktop) projetada para capacitar líderes (especialmente coordenadores recém-promovidos e gestores resistentes) a planejar, conduzir e registrar reuniões de 1:1 e sessões de feedback estruturado. 

A ferramenta atua como um facilitador de desenvolvimento contínuo, promovendo a humanização nas chamadas de atenção, garantindo a conformidade com as regras de privacidade (LGPD) e centralizando dados analíticos essenciais para o RH, sem burocratizar a rotina da liderança.

---

## 2. Dores do Cliente (Problemas que resolvemos)
*   **Ausência de Registro de Conversas:** Líderes realizam reuniões de 1:1 e feedbacks mas não os registram, resultando na perda de histórico do desenvolvimento do colaborador e na falta de dados analíticos para o RH.
*   **Falta de Repertório Emocional e Preparo:** Coordenadores recém-promovidos (transição técnico -> gestão) enfrentam dificuldades em conduzir conversas difíceis ou feedbacks corretivos sem parecerem agressivos ou ineficientes.
*   **Resistência e Burocracia:** Gestores intermediários enxergam processos de RH como burocracia e alegam falta de tempo, demandando uma ferramenta rápida que compense o esforço com alto valor agregado.
*   **Reuniões de 1:1 Focadas Apenas em Operacional:** Líderes tendem a usar a 1:1 como reunião de status de tarefas (microgestão), sacrificando o bloco estratégico de carreira e desenvolvimento (PDI).
*   **Riscos de LGPD e Compliance:** Risco de vazamento ou armazenamento inadequado de dados altamente sensíveis dos colaboradores (doenças, salários, CPF, contexto familiar) digitados por gestores nos históricos.

---

## 3. Backlog de Épicos e Features

| ID | Título | Status | Notas |
|---|---|---|---|
| **F-01** | **Preparação & Estruturação de Reuniões de 1:1** | Pronto para Dev | Roteiro com Check-in, Pauta do liderado, Entregas/Obstáculos, Desenvolvimento e Acordos. |
| **F-02** | **Roteiro de Feedback SBI e Humanização** | Pronto para Dev | Roteiro guiado pelo modelo SBI, com foco em escuta ativa prévia e linguagem construtiva. |
| **F-03** | **Gestão de PDI Simplificado (Conectado ao Levels)** | Pronto para Dev | Definição de até 3 objetivos de PDI vinculados às competências do Framework de Levels. |
| **F-04** | **Registro Rápido e Exportação (PDF/Excel)** | Pronto para Dev | Histórico das reuniões com exportação PDF (líder) e CSV/Excel para envio ou consumo pelo RH. |
| **F-05** | **Filtro de Privacidade & LGPD (Anti-Dados Sensíveis)** | Pronto para Dev | Bloqueio/Mascaramento de informações sensíveis (CPF, doenças, faixa salarial, etc.). |
| **F-06** | **Painel Analytics & Insights para o RH** | Pronto para Dev | Métricas agregadas (% adesão, ranking de cadência, colaboradores sem 1:1 > 30 dias, temas). |
| **F-07** | **Análise de Feedback Legado (PDF)** | Pronto para Dev | Extração e auditoria de tom de feedbacks históricos importados via texto de PDF no modelo SBI. |

---

## 4. Especificações Ativas (Em Detalhe)

### F-01: Preparação & Estruturação de Reuniões de 1:1
*   **História do Usuário:** Como gestor, quero preparar e estruturar uma reunião de 1:1 garantindo que a conversa cubra tanto o lado humano quanto o estratégico de desenvolvimento, sem focar exclusivamente no status operacional.
*   **Regras de Negócio:**
    *   O roteiro da 1:1 deve conter exatamente estes 5 blocos na ordem:
        1.  *Check-in Humano:* Pergunta sobre o bem-estar e calibração de energia (gestor deve ouvir antes de falar).
        2.  *Pauta do Liderado:* O liderado traz os temas prioritários (a agenda pertence a ele).
        3.  *Status de Entregas e Obstáculos:* Foco em remover bloqueios, usando perguntas abertas (evitar microgestão/sprint review).
        4.  *Desenvolvimento, Carreira e Feedback:* Conversa sobre competências do Levels, PDI e aspirações.
        5.  *Acordos e Próximos Passos:* Pelo menos um acordo claro com prazo definido (o sistema impede a finalização sem este bloco).
    *   **Perguntas Obrigatórias (Universais):**
        *   "Como você está?" (check-in genuíno)
        *   "O que está fluindo bem desde a nossa última conversa?"
        *   "O que está te travando ou consumindo mais energia?"
        *   "Tem algo que eu, como gestor, poderia fazer diferente para te apoiar melhor?"
        *   "Como você está se sentindo em relação ao time e ao ambiente?"
        *   "O que você aprendeu recentemente que vale compartilhar?"
    *   **Pergunta de Desenvolvimento (Inserir ao menos 1 por roteiro):**
        *   "Em qual competência você sente que mais evoluiu ultimamente?"
        *   "Onde você quer chegar nos próximos 6 meses?"
        *   "O que você precisaria para se sentir mais confiante no seu papel?"
        *   "Tem algum desafio que você gostaria de assumir e ainda não teve a chance?"
        *   "Como está o progresso dos acordos que fizemos na última reunião?"
*   **Critérios de Aceite:**
    *   [ ] O assistente deve perguntar ao gestor antes de iniciar: *"Existe algo que o liderado mencionou que deveria entrar na pauta hoje?"* para apoiar o preparo.
    *   [ ] O assistente deve validar se o bloco de "Acordos e Próximos Passos" foi preenchido e possui um responsável e um prazo.
    *   [ ] O roteiro deve sugerir a cadência ideal (quinzenal ou mensal).

### F-02: Roteiro de Feedback SBI e Humanização
*   **História do Usuário:** Como gestor, quero formular um feedback estruturado e humanizado, reduzindo a atitude defensiva do colaborador e garantindo foco no comportamento e impacto.
*   **Regras de Negócio:**
    *   A estrutura obrigatória de feedback deve seguir as etapas:
        1.  *Contexto e Intenção:* Foco em desenvolvimento, não punição.
        2.  *Escuta Ativa (Perspectiva do Liderado Primeiro):* Perguntar *"Como você está vendo essa situação?"* antes de emitir a opinião (fase inegociável).
        3.  *Feedback Estruturado (Modelo SBI):* **S**ituação (onde/quando), **B**ehavior/Comportamento (fato observado) e **I**mpacto (efeito gerado).
        4.  *Acordo e Próximo Passo:* Co-construir a solução (*"O que você acha que faz sentido mudar?"*).
    *   **Linguagem Proibida:** Expressões que fecham o diálogo como *"Você sempre faz isso"*, *"Isso é inaceitável"*, *"Você é desorganizado"* (ataque ao caráter).
    *   **Linguagem Estimulada:** Perguntas abertas como *"Observei X — o impacto foi Y"*, *"Como posso te apoiar nessa mudança?"*, *"O que podemos combinar para o próximo ciclo?"*.
    *   **Bilateralidade:** Todo roteiro de feedback deve incluir um momento para o gestor solicitar feedback sobre si mesmo (*"Como eu poderia te apoiar melhor?"*).
*   **Critérios de Aceite:**
    *   [ ] O assistente obriga o preenchimento dos três campos do modelo SBI.
    *   [ ] O assistente valida e remove adjetivos que ataquem o caráter do liderado, sugerindo a reescrita baseada em fatos objetivos.
    *   [ ] O roteiro sugere a cadência de acordo com a situação (experiência nos 45/90 dias; pontual imediato; em risco de desligamento quinzenal; bimestral/trimestral para reconhecimento).

### F-03: Gestão de PDI Simplificado (Conectado ao Levels)
*   **História do Usuário:** Como gestor e liderado, queremos co-construir um PDI simples, acionável e conectado ao Framework de Levels da ClearIT, focando no desenvolvimento real e sem sobrecarga de objetivos.
*   **Regras de Negócio:**
    *   **Limite de Objetivos:** O PDI deve ter no máximo 2 ou 3 objetivos simultâneos ativos para evitar sobrecarga.
    *   **Estrutura de cada Objetivo:**
        1.  *Competência e Objetivo de Desenvolvimento:* Vincular diretamente a uma das competências do Framework de Levels e definir o comportamento esperado no final do ciclo (Ex: *"Ampliar raio de impacto em Comunicação com Stakeholders, de impacto no time para impacto no cliente."*).
        2.  *Ações Concretas (o que vai fazer):* Máximo de 3 ações práticas e verificáveis (Ex: *"Liderar a apresentação de status do projeto X para o cliente em setembro"*).
        3.  *Prazo e Marco de Verificação:* Data-limite e critério de evidência de progresso para a próxima 1:1 (sem isso, o PDI vira lista de intenções).
        4.  *Suporte do Gestor:* O que o líder fará para viabilizar o desenvolvimento (acesso a projetos, tempo protegido, conexões internas). Acordo bilateral, não unilateral.
*   **Critérios de Aceite:**
    *   [ ] O assistente deve bloquear a criação de PDIs com mais de 3 objetivos ativos simultâneos.
    *   [ ] O PDI gerado deve exigir a especificação da competência do Framework de Levels associada.
    *   [ ] O sistema deve validar se há pelo menos um "Marco de Verificação" e um "Suporte do Gestor" preenchidos para cada objetivo.

### F-04: Registro Rápido e Exportação (PDF/Excel)
*   **História do Usuário:** Como gestor, quero registrar as reuniões de 1:1 e feedbacks de forma extremamente rápida e objetiva, podendo exportar os relatórios em PDF para meu uso pessoal e disponibilizar dados sintéticos (Excel/CSV) para o RH.
*   **Regras de Negócio:**
    *   **Campos Obrigatórios no Registro:**
        *   Data e duração da reunião.
        *   Temas abordados (por bloco da 1:1).
        *   Feedbacks fornecidos no modelo SBI (se aplicável).
        *   Acordos firmados com prazo e responsável.
        *   Progresso dos acordos anteriores.
        *   Próximo passo e data planejada da próxima reunião.
        *   Sinalizações opcionais anonimizadas para o RH (risco de saída, sobrecarga).
    *   **Bloqueios de Registro:** Impedir o registro de dados pessoais sensíveis do colaborador (conforme F-05).
    *   **Formatos de Saída:**
        *   Líder: Visualização na aplicação e exportação em formato PDF.
        *   RH: Exportação em lote de dados agregados de adesão e cadência em formato CSV/Excel.
*   **Critérios de Aceite:**
    *   [ ] O assistente deve gerar um formulário de registro pré-preenchido com base nas anotações da conversa.
    *   [ ] A exportação em PDF do líder deve conter apenas o histórico estruturado da reunião.
    *   [ ] A exportação de CSV/Excel para o RH deve ser restrita a dados não sensíveis e métricas de processo.

### F-05: Filtro de Privacidade & LGPD (Anti-Dados Sensíveis)
*   **História do Usuário:** Como organização, quero garantir que nenhum dado pessoal sensível dos colaboradores seja armazenado ou processado pela IA para evitar riscos jurídicos trabalhistas e multas da LGPD.
*   **Regras de Negócio:**
    *   **Dados Terminantemente Proibidos:** Nome completo, CPF, número de matrícula, condições médicas/saúde, orientação sexual, contexto familiar detalhado, salário/faixa salarial, processos disciplinares ou jurídicos ativos.
    *   Qualquer inserção contendo estes dados deve ser mascarada ou bloqueada automaticamente antes de ser enviada ao modelo ou salva no banco.
*   **Critérios de Aceite:**
    *   [ ] Sistema valida regex de CPF e padrões de dados de saúde no prompt do líder e impede a submissão, gerando um alerta de segurança.
    *   [ ] Os relatórios do RH são 100% anonimizados nos metadados individuais.

### F-06: Painel Analytics & Insights para o RH
*   **História do Usuário:** Como gestor de RH, quero acompanhar métricas consolidadas sobre as reuniões de 1:1 e feedbacks da organização para avaliar a adesão ao processo, identificar líderes desalinhados e diagnosticar problemas sistêmicos nas equipes.
*   **Regras de Negócio:**
    *   **Métricas Indispensáveis (Acompanhamento do Processo):**
        *   *% de líderes com 1:1 realizada no período:* Indica a adesão básica ao processo.
        *   *Ranking de cadência por líder:* Identifica líderes com baixa frequência que necessitam de intervenção/suporte do RH.
        *   *Colaboradores sem 1:1 há mais de 30 dias:* Alerta de risco de desengajamento e vulnerabilidade.
        *   *Taxa de geração de PDIs pós-reunião:* Avalia se as conversas geram desenvolvimento real.
        *   *Sinalizações de risco ativas:* Mapeamento de alertas inseridos de forma consolidada e anônima.
    *   **Insights de Alto Valor (Dados Analíticos):**
        *   *Padrão de temas por área:* Exemplo: se 70% de uma área sinaliza sobrecarga ou conflito de prioridade, alertar sobre falha sistêmica na estrutura da área.
        *   *Perfil de maturidade do líder (Iniciante, Em desenvolvimento, Consistente, Referência):* Classificado automaticamente pelo assistente com base em cadência, qualidade dos roteiros e feedbacks.
        *   *Lacunas sistêmicas no Framework de Levels:* Identificar competências do Levels que nunca aparecem nos PDIs ou feedbacks de nenhum líder.
*   **Critérios de Aceite:**
    *   [ ] O painel do RH não deve expor transcrições ou notas pessoais confidenciais de 1:1s individuais.
    *   [ ] O sistema deve consolidar o ranking de cadência de líderes mensalmente.
    *   [ ] O painel deve alertar visualmente o RH quando um colaborador atingir > 30 dias sem 1:1 realizada.

### F-07: Análise de Feedback Legado (PDF)
*   **História do Usuário:** Como gestor, quero poder analisar feedbacks históricos salvos em PDFs antigos para estruturá-los sob o modelo SBI e auditar sua linguagem, garantindo consistência com nossos padrões de compliance.
*   **Regras de Negócio:**
    *   O assistente deve receber o conteúdo textual do PDF.
    *   O fluxo de análise do texto deve:
        1. Executar o filtro LGPD para remover dados sensíveis (F-05).
        2. Mapear e categorizar em Situação (S), Comportamento (B) e Impacto (I).
        3. Identificar lacunas (ex: se falta o impacto ou o comportamento específico).
        4. Avaliar adjetivos inadequados de caráter e propor a versão reescrita e factual.
        5. Extrair combinados ou próximos passos declarados no texto.
*   **Critérios de Aceite:**
    *   [ ] O assistente sinaliza alertas de compliance de LGPD se houver dados sensíveis no texto importado.
    *   [ ] O assistente gera uma versão corrigida e reescrita do feedback no modelo SBI.
    *   [ ] O assistente identifica e lista os combinados e próximos passos encontrados no PDF histórico.