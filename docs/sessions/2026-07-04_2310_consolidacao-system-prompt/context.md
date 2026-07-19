# Contexto — Consolidação do System Prompt Clarify

## Situação Inicial
Após reverter o modelo de dados de CRIA para SBI nos KBs e especificações, o prompt do agente `system_prompt.md` ainda possuía misturas parciais de termos antigos e carecia da listagem das 8 novas competências oficiais da ClearIT e dos perfis de liderança mapeados no manual do desafio.

## Motivação
Garantir consistência absoluta entre as instruções do Clarify (System Instructions) e todo o ecossistema de especificações técnicas do projeto, impedindo que o assistente de IA proponha roteiros ou termos desconhecidos pela codebase.

## Restrições
- Operar inteiramente sob o modelo de dados SBI.
- Manter o aviso de Human-in-the-loop e LGPD.
