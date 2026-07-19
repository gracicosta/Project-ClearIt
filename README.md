# Smart Leading · Assistente de 1:1 e Feedback

MVP entregue pelo **Squad The Cure** para o desafio **ClearIT**.

Plataforma web para líderes conduzirem reuniões 1:1, registrarem feedbacks estruturados no modelo SBI, manterem Planos de Desenvolvimento Individual (PDI) conectados ao Framework de Levels da ClearIT e apoiarem o RH com analytics — tudo com apoio de IA generativa e proteção LGPD embutida.

---

## Sumário

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Stack técnica](#stack-técnica)
- [Demonstração](#demonstração)
- [Rodando localmente](#rodando-localmente)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Roadmap](#roadmap)
- [Squad](#squad)
- [Links](#links)

---

## Visão geral

O **Smart Leading** nasceu para transformar a rotina de liderança em algo mais leve, estruturado e seguro. Em vez de planilhas e anotações perdidas, o sistema oferece:

- **1:1s guiadas** em 5 blocos obrigatórios.
- **Feedback SBI** assistido por IA, com ajuste de tom.
- **PDI conectado ao Framework de Levels** da ClearIT.
- **Auditor LGPD** que sanitiza dados sensíveis antes da persistência.
- **Central de Relatórios** com exportação em PDF e Excel.
- **Gravação e transcrição** de reuniões direto no navegador.

A interface segue uma identidade visual **Kinetic Dark** — escura, refinada e com microanimações — inspirada na linguagem da ClearIT.

---

## Funcionalidades

| Código | Funcionalidade | Descrição |
|--------|----------------|-----------|
| F-01 | **1:1s estruturadas** | Wizard em 5 blocos: Check-in Humano, Pauta do Liderado, Status de Entregas, Desenvolvimento e Acordos. |
| F-02 | **Feedback SBI** | Estruturação Situação / Comportamento / Impacto com sugestão de IA e medidor de tom. |
| F-03 | **PDI conectado a Levels** | Até 3 objetivos por liderado, vinculados às 8 competências oficiais da ClearIT, com marcos verificáveis. |
| F-04 | **Exportação PDF/Excel** | Relatórios de 1:1, feedback e PDI prontos para líderes e RH. |
| F-05 | **Auditor LGPD** | Filtro regex + auditor de IA que classifica risco e registra incidentes sensíveis. |
| F-06 | **Painel de RH** | Analytics multi-squad: cobertura de 1:1, saúde de feedbacks, PDIs ativos e incidentes LGPD. |
| F-07 | **Feedbacks legados** | Importa PDFs antigos, extrai SBI e sugere próximos passos com IA. |
| — | **Registrar Reunião** | Gravação no navegador com transcrição, resumo automático e pré-preenchimento dos wizards. |
| — | **Central de Relatórios** | Painel único que consolida 1:1s, Feedbacks, PDIs e Gravações com busca, filtros e exportação. |

---

## Stack técnica

| Camada | Tecnologia |
|--------|------------|
| **Framework** | TanStack Start (React 19 + Vite 7) |
| **Estilos** | Tailwind CSS v4, shadcn/ui |
| **Backend** | TanStack Server Functions em ambiente serverless/edge |
| **Banco de dados** | Postgres com Row Level Security (RLS) |
| **Autenticação** | Supabase Auth (e-mail/senha + Google OAuth) |
| **IA** | Google Gemini via Lovable AI Gateway |
| **Exportação** | `@react-pdf/renderer`, `xlsx` |
| **Gravação** | MediaRecorder API + Speech-to-Text |
| **Gráficos** | Recharts |
| **Validação** | Zod |
| **Formulários** | React Hook Form |

---

## Demonstração

Acesse a versão publicada e use a conta demo pré-provisionada:

- **E-mail:** `admin@clearit.com`
- **Senha:** `123456`

A conta demo possui papel de **RH** e vem com massa de dados do squad The Cure, incluindo reuniões, feedbacks, PDIs e gravações de exemplo.

---

## Rodando localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [Bun](https://bun.sh/) ou npm
- Conta no Lovable Cloud (backend Supabase + AI Gateway)

### Passo a passo

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/USUARIO/NOME-DO-REPO.git
   cd NOME-DO-REPO
   ```

2. **Instale as dependências:**

   ```bash
   bun install
   # ou
   npm install
   ```

3. **Configure as variáveis de ambiente:**

   ```bash
   cp .env.example .env
   ```

   Preencha as variáveis listadas na seção [Variáveis de ambiente](#variáveis-de-ambiente).

4. **Inicie o servidor de desenvolvimento:**

   ```bash
   bun dev
   # ou
   npm run dev
   ```

5. **Abra no navegador:**

   ```
   http://localhost:8080
   ```

### Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `bun dev` | Inicia o servidor de desenvolvimento |
| `bun run build` | Gera o build de produção |
| `bun run preview` | Pré-visualiza o build localmente |
| `bun run lint` | Executa o ESLint |
| `bun run format` | Formata o código com Prettier |

---

## Estrutura de pastas

```text
.
├── docs/                          # Documentação de negócio, prompts e sessões
│   ├── business-context-lite.md
│   ├── technical-context-lite.md
│   ├── knowledge-base/
│   └── sessions/
├── src/
│   ├── ai/                        # Persona, prompts e executor de IA
│   │   ├── persona.ts
│   │   ├── prompts/
│   │   └── run-prompt.server.ts
│   ├── components/                # Componentes React reutilizáveis
│   │   ├── ui/                    # shadcn/ui
│   │   ├── pdi/
│   │   └── ...
│   ├── hooks/                     # Hooks customizados
│   ├── integrations/              # Supabase, Lovable Cloud, etc.
│   ├── lib/                       # Funções utilitárias e server functions
│   ├── routes/                    # Rotas do TanStack Start
│   │   ├── __root.tsx
│   │   ├── index.tsx              # Landing page
│   │   ├── manual.tsx             # Manual público
│   │   ├── pitch.tsx              # Apresentação pitch
│   │   ├── auth.tsx               # Login/cadastro
│   │   └── _authenticated/        # Área logada
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
├── supabase/                      # Configurações do Supabase
│   └── config.toml
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Supabase (Lovable Cloud)
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...        # server-only

# Lovable AI Gateway
LOVABLE_API_KEY=lovable_...

# Ambiente
NODE_ENV=development
```

> ⚠️ **Nunca commite o arquivo `.env`.** Ele já está listado no `.gitignore`.

---

## Roadmap

### Entregue no MVP

- [x] Autenticação com e-mail/senha e Google OAuth
- [x] Perfis de Gestor e RH
- [x] Gestão de liderados
- [x] Wizard de 1:1 em 5 blocos
- [x] Feedback SBI com sugestão de IA
- [x] PDI conectado ao Framework de Levels
- [x] Auditor LGPD com classificação de risco
- [x] Painel de RH com analytics
- [x] Importação de feedbacks legados (PDF)
- [x] Gravação e transcrição de reuniões
- [x] Central de Relatórios com exportação PDF/Excel

### Próximos passos sugeridos

- [ ] Suíte automatizada de testes de prompts
- [ ] Notificações por e-mail para 1:1s agendadas e action items em atraso
- [ ] Integração com calendário (Google/Outlook)
- [ ] Modo offline para gravação em áreas com conectividade instável
- [ ] App mobile / PWA
- [ ] Biblioteca de perguntas por competência e nível
- [ ] Comparativos temporais de tom e evolução de PDI
- [ ] Fluxo de calibração 360°
- [ ] Alertas proativos da IA
- [ ] SSO corporativo (Microsoft Entra ID)

---

## Squad

**The Cure**

- Breno Vilaça
- Graciele Costa
- Letícia Gonçalves
- Henrique Ferreira
- Vitória Silva

---

## Links

- **Landing page:** `/`
- **Manual do sistema:** `/manual`
- **Apresentação pitch:** `/pitch`
- **Login:** `/auth`

---

## Licença

Este projeto foi desenvolvido como MVP acadêmico/profissional para o desafio ClearIT. Uso interno e apresentações são permitidos; redistribuição comercial requer autorização dos autores.

---

*Smart Leading · MVP entregue em julho de 2026 · Desafio ClearIT · Squad The Cure*
