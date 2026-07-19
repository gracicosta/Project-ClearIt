# KB: Guia de Integração do React-PDF (@react-pdf/renderer) 🧅

## 1. Visão Geral
Este documento serve como guia técnico para a feature **F-04 (Registro Rápido e Exportação)**. O frontend React utilizará a biblioteca `@react-pdf/renderer` para gerar relatórios estruturados das reuniões de 1:1 e feedbacks de forma 100% client-side (no navegador do usuário), garantindo rapidez e privacidade dos dados (sem tráfego de dados confidenciais de PDF pelo backend).

---

## 2. Conceitos Chave

### 2.1. Componentes Nativos vs. Componentes React-PDF
O `@react-pdf/renderer` **não renderiza tags HTML padrão** (`div`, `p`, `h1`, etc.). O uso de tags HTML comuns dentro do escopo do documento gerará erros de compilação ou renderização catastróficos.
Você deve mapear e usar estritamente os componentes equivalentes da biblioteca:

| HTML Padrão | Componente React-PDF | Descrição |
| :--- | :--- | :--- |
| `<html>` ou `<main>` | `<Document>` | O elemento raiz do documento PDF. |
| `<section>` ou `<div class="page">` | `<Page>` | Define uma página física do PDF. Aceita atributos como `size` (ex: "A4"). |
| `<div>` | `<View>` | O container básico para layout (comporta-se como flexbox). |
| `<span>`, `<p>`, `<h1>` a `<h6>` | `<Text>` | Único componente capaz de renderizar texto. Textos soltos em `<View>` geram erro. |
| `<a>` | `<Link>` | Renderiza hiperlinks clicáveis. |
| `<img>` | `<Image>` | Exibe imagens no documento. |

### 2.2. O Motor de Estilos (Gotcha de Tailwind CSS)
**IMPORTANTE:** O React-PDF **NÃO suporta** Tailwind CSS ou folhas de estilo globais externas.
*   Os estilos devem ser declarados utilizando a API `StyleSheet.create` fornecida pela biblioteca.
*   O motor de estilos utiliza um subconjunto de regras CSS, fortemente baseado em Flexbox (similar ao React Native).
*   Use camelCase para propriedades CSS (ex: `backgroundColor`, `fontSize`, `paddingBottom`).

---

## 3. Exemplos Práticos

### 3.1. Declaração do Documento PDF (`FeedbackReport.tsx`)
```tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Registro opcional de fonte customizada (caso queira fugir da Helvetica padrão)
Font.register({
  family: 'Open Sans',
  src: 'https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0e.ttf'
});

// Definição de estilos utilizando StyleSheet
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.5,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A365D',
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 4,
  },
  metaText: {
    fontSize: 9,
    color: '#64748B',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2B6CB0',
    marginTop: 15,
    marginBottom: 5,
  },
  contentBlock: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3,
    borderLeftColor: '#3182CE',
  }
});

interface ReportProps {
  liderado: string;
  data: string;
  conteudo: string;
}

export const FeedbackReport: React.FC<ReportProps> = ({ liderado, data, conteudo }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Relatório de Feedback Estruturado</Text>
      </View>

      {/* Metadados da Conversa */}
      <View style={styles.metaSection}>
        <Text style={styles.metaText}>Liderado: {liderado}</Text>
        <Text style={styles.metaText}>Data: {data}</Text>
      </View>

      {/* Conteúdo Principal */}
      <Text style={styles.sectionTitle}>Conteúdo do Feedback (SBI)</Text>
      <View style={styles.contentBlock}>
        <Text>{conteudo}</Text>
      </View>
    </Page>
  </Document>
);
```

### 3.2. Botão de Download no Componente do Frontend React
```tsx
import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FeedbackReport } from './FeedbackReport';

export const DownloadButton: React.FC = () => {
  const data = {
    liderado: 'João',
    data: '04/07/2026',
    conteudo: 'Situação: Sprint de quinta-feira. Comportamento: Entrega em atraso sem comunicação. Impacto: Equipe ociosa por 1 dia.'
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-bold text-gray-800 mb-2">Exportar Relatório</h3>
      
      <PDFDownloadLink
        document={<FeedbackReport {...data} />}
        fileName={`feedback_${data.liderado.toLowerCase()}_${data.data.replace(/\//g, '-')}.pdf`}
        className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition"
      >
        {({ loading }) => (loading ? 'Gerando PDF...' : 'Baixar PDF')}
      </PDFDownloadLink>
    </div>
  );
};
```

---

## 4. Armadilhas (Gotchas)

*   **Páginas em branco inesperadas:** Elementos com alturas fixas grandes ou margens excessivas podem empurrar componentes de forma errada, gerando quebras de página desnecessárias. Use paddings e margens com cuidado.
*   **Problemas de Performance no Live-Reload:** Renderizar dinamicamente o PDF enquanto o usuário digita na tela do form pode travar o navegador.
    *   *Solução:* Renderize o botão `<PDFDownloadLink>` apenas quando o formulário for finalizado, ou adicione um delay (debounce) nos inputs para evitar re-renderizar o PDF a cada tecla digitada.
*   **Estilos Flexbox incompletos:** Propriedades complexas de grid de CSS ou `flex-basis` podem falhar. Fique no básico: `flexDirection: 'row' | 'column'`, `justifyContent`, `alignItems` e larguras percentuais ou fixas.
