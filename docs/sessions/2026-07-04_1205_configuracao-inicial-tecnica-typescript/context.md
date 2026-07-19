# Contexto — Configuração Inicial Técnica (TypeScript)

## Situação Inicial
O projeto possuía inicialmente uma stack focada em JavaScript e PostgreSQL, com complexidade de infraestrutura. Após propostas iniciais de JavaScript puro e Next.js, o usuário optou por manter a arquitetura desacoplada (React + Express) mas utilizando **TypeScript** como linguagem principal de ponta a ponta.

## Motivação
O uso de TypeScript garante segurança no desenvolvimento, tipagem estática e auto-complete na IDE, o que auxilia no aprendizado de boas práticas desde o início. Para manter a simplicidade para iniciantes, o banco SQLite substitui o PostgreSQL, e a execução do backend TS é facilitada com o runner `tsx`.

## Restrições
- Evitar Next.js e frameworks complexos; manter arquitetura limpa com SPA React e API Express em TypeScript.
- Garantir setup zero de banco de dados (SQLite local).

## Referências
- [docs/business-context-lite.md](/Clearit-the_cure/docs/business-context-lite.md)
