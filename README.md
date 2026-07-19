# 🚀 Smart Leading · Assistente de 1:1 e Feedback

MVP desenvolvido pelo **Squad The Cure** para o desafio **ClearIT**.

O **Smart Leading** é uma plataforma web desenvolvida para auxiliar líderes a conduzirem reuniões 1:1 eficientes, registrarem feedbacks estruturados no modelo SBI, gerenciarem Planos de Desenvolvimento Individual (PDI) alinhados ao Framework de Levels da ClearIT e fornecerem relatórios analíticos para o RH — tudo isso com apoio de inteligência artificial generativa e conformidade nativa com a LGPD.

---

## 🎯 Visão Geral

O sistema simplifica a rotina de liderança e centraliza a gestão de pessoas, eliminando controles paralelos ou inseguros. Seus principais pilares são:

* **1:1s estruturadas:** Roteiro guiado em blocos lógicos focados em desenvolvimento e acordos.
* **Feedback SBI (Situation-Behavior-Impact):** Apoio de IA para formulação de feedbacks claros com ajuste de tom.
* **Conexão com PDI:** Metas conectadas diretamente às competências do Framework de Levels da ClearIT.
* **Auditor LGPD:** Algoritmos de sanitização que removem ou protegem dados pessoais sensíveis antes do armazenamento.
* **Painéis Analíticos (RH):** Cobertura de rituais, saúde dos feedbacks e incidências de segurança em tempo real.

---

## ⚙️ Tecnologias Utilizadas

A arquitetura do projeto foi desenhada para oferecer alta performance, segurança de dados e uma experiência visual moderna (Kinetic Dark).

### 💻 Frontend & Core
* **React 19** · Construção de interfaces de usuário reativas de alto desempenho.
* **TanStack Start & React Router** · Framework full-stack type-safe com suporte a SSR e Server Functions.
* **Vite 8** · Bundler ultra-rápido para desenvolvimento otimizado.
* **TypeScript** · Tipagem estática garantindo maior estabilidade no código.

### 🎨 Interface & UI/UX (Kinetic Dark)
* **Tailwind CSS v4** · Estilização moderna através de uma engine utilitária veloz.
* **shadcn/ui & Radix UI** · Componentes de interface totalmente acessíveis, responsivos e customizáveis.
* **Lucide React** · Pacote de ícones vetoriais modernos.
* **Embla Carousel & Vaul** · Transições fluidas de carrosséis e gavetas (drawers) deslizantes.

### 🔌 Backend, Banco & Segurança
* **PostgreSQL (Supabase)** · Banco de dados relacional de produção com alta integridade.
* **Row Level Security (RLS)** · Segurança nativa no banco para isolamento completo de dados por usuário/perfil.
* **Supabase Auth** · Autenticação segura via e-mail/senha ou integração social (Google OAuth).
* **TanStack Server Functions** · Comunicação segura e direta com o servidor a partir do cliente.

### 🧠 Inteligência Artificial (IA)
* **Google Gemini (via Lovable AI Gateway)** · Geração de insights de 1:1, modelagem SBI de feedbacks e moderação LGPD.
* **Vercel AI SDK** · Integração padronizada com LLMs no ecossistema Javascript.

### 📊 Relatórios & Serviços adicionais
* **Recharts** · Visualização dinâmica de métricas de engajamento no painel do RH.
* **@react-pdf/renderer** · Geração em tempo real de documentos PDF para download.
* **xlsx (SheetJS)** · Exportação de relatórios tabulares em formato Excel.
* **MediaRecorder API** · Gravação local de áudio nativa no navegador para transcrição posterior.

---

## 🌐 Demonstração & Links

Acesse a plataforma em produção e utilize as credenciais de teste fornecidas:

* 🔗 **Link do Projeto:** [project-clear-it.vercel.app](https://project-clear-it.vercel.app/)
* 📧 **E-mail:** `admin@clearit.com`
* 🔑 **Senha:** `123456`

*(A conta de teste possui perfil de RH e contém massa de dados previamente cadastrada para facilidade de avaliação).*

### Atalhos Rápidos:
* **Página Inicial:** [project-clear-it.vercel.app](https://project-clear-it.vercel.app/)
* **Manual do Usuário:** [project-clear-it.vercel.app/manual](https://project-clear-it.vercel.app/manual)
* **Apresentação Pitch:** [project-clear-it.vercel.app/pitch](https://project-clear-it.vercel.app/pitch)
* **Login do Sistema:** [project-clear-it.vercel.app/auth](https://project-clear-it.vercel.app/auth)

---

## 📥 Obtenção do Código

Para obter uma cópia local do código deste repositório, utilize o comando:

```bash
git clone https://github.com/USUARIO/NOME-DO-REPO.git
```

---

## 📅 Roadmap

### Entregue no MVP
- [x] Autenticação segura e controle de acesso (Líder / RH)
- [x] Wizard de 1:1 estruturado em 5 blocos principais
- [x] Assistência SBI assistida por IA com modulação de tom
- [x] PDI integrado ao Framework de Competências da ClearIT
- [x] Auditor LGPD automatizado (regex + IA)
- [x] Painel de RH com analytics de engajamento e segurança
- [x] Importação de feedbacks antigos em formato PDF
- [x] Gravação integrada e transcrição automática de reuniões
- [x] Central de exportação de dados para PDF e Excel

### Próximos Passos
- [ ] Integração com calendários corporativos (Google Calendar e Outlook)
- [ ] Suíte automatizada de testes e qualidade para prompts de IA
- [ ] Notificações por e-mail e push para metas de PDI ou rituais pendentes
- [ ] Modo offline para gravação em trânsito
- [ ] Aplicação Mobile Nativa ou suporte a PWA completo

---

## 👥 Squad The Cure

* Breno Vilaça
* Graciele Costa
* Letícia Gonçalves
* Henrique Ferreira
* Vitória Silva

---

## 📄 Licença

Este projeto foi desenvolvido como MVP corporativo/educacional para o desafio ClearIT. O uso do material é restrito a fins de avaliação e apresentação institucional.
