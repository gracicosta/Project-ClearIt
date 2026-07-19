# KB: Integração da API Google Gemini (@google/genai) 🧅

## 1. Visão Geral
Este documento fornece as diretrizes e exemplos técnicos para a integração da inteligência artificial no backend Express do projeto. Utilizaremos o SDK oficial mais recente do Google, o `@google/genai`, para interagir com os modelos da família Gemini (especificamente `gemini-2.0-flash`), garantindo que o assistente **Clarify** execute seu prompt de sistema e formate saídas de maneira estruturada.

---

## 2. Conceitos Chave

### 2.1. O Novo SDK Unificado
O pacote `@google/genai` é a biblioteca moderna e recomendada para interações com a API do Gemini. Ele unifica o acesso e substitui o pacote legado `@google/generative-ai`.
*   **Instalação:** `npm install @google/genai`
*   **Segurança:** A chave de API do Gemini deve ser salva no arquivo `.env` como `GEMINI_API_KEY`. O SDK lê essa variável de ambiente automaticamente. Nunca exponha essa chave no Frontend.

### 2.2. Parâmetro `systemInstruction`
Para carregar a persona e regras do Clarify (contidas em `agents/clarify/system_prompt.md`), enviamos o conteúdo do prompt de sistema através do objeto de configuração (`config.systemInstruction`). Isso instrui o modelo sobre seu comportamento fixo antes que ele leia a mensagem atual do usuário.

---

## 3. Exemplos Práticos

### 3.1. Inicialização e Chamada Básica com System Instruction
Abaixo está um exemplo em TypeScript de um serviço do Express que lê o prompt do arquivo local e envia para o Gemini.

```typescript
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// O SDK busca automaticamente o process.env.GEMINI_API_KEY
const ai = new GoogleGenAI();

export async function askClarify(userPrompt: string): Promise<string> {
  try {
    // Ler o prompt de sistema do Clarify
    const promptPath = path.join(__dirname, '../../../agents/clarify/system_prompt.md');
    const systemInstruction = fs.readFileSync(promptPath, 'utf-8');

    // Executar a chamada ao modelo
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, // Balanço entre criatividade e aderência a regras
      },
    });

    if (!response.text) {
      throw new Error('Nenhuma resposta retornada pelo Gemini.');
    }

    return response.text;
  } catch (error) {
    console.error('Erro na integração com o Gemini:', error);
    throw error;
  }
}
```

### 3.2. Retornando JSON Estruturado (Structured Outputs)
Para a feature **F-04 (Registro Rápido)** ou **F-07 (Análise de PDF)**, pode ser necessário que o Gemini retorne um JSON estrito para facilitar o parsing direto no banco de dados. Veja como definir um esquema de resposta:

```typescript
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI();

export async function analyzeFeedbackPDF(pdfText: string) {
  const promptPath = path.join(__dirname, '../../../agents/clarify/system_prompt.md');
  const systemInstruction = fs.readFileSync(promptPath, 'utf-8');

  // Adiciona a instrução para o modelo atuar na opção 3
  const userContent = `Execute a opção 3 (Análise de Feedback em PDF) para o seguinte texto:\n\n${pdfText}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: userContent,
    config: {
      systemInstruction: systemInstruction,
      // Forçar resposta em formato JSON aderente a um Schema
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          situacao: { type: Type.STRING, description: 'Situação (onde/quando)' },
          comportamento: { type: Type.STRING, description: 'Comportamento observado' },
          impacto: { type: Type.STRING, description: 'Impacto causado' },
          alertasLGPD: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Lista de problemas de privacidade ou PII encontrados'
          },
          reescritaSugerida: { type: Type.STRING, description: 'Texto sugerido estruturado no SBI e polido' },
          combinados: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Acordos ou próximos passos extraídos'
          }
        },
        required: ['situacao', 'comportamento', 'impacto', 'reescritaSugerida'],
      }
    }
  });

  return JSON.parse(response.text!);
}
```

---

## 4. Armadilhas (Gotchas)
*   **Nome do Pacote Errado:** Evite instalar a biblioteca antiga `@google/generative-ai`. Utilize apenas o `@google/genai`.
*   **Estouro de Contexto:** Ao processar múltiplos PDFs ou transcrições longas, lembre-se de limitar a entrada do usuário para evitar custos elevados de token ou lentidão. O modelo `gemini-2.0-flash` possui janela de contexto gigante (1M tokens), mas requisições menores geram respostas muito mais rápidas.
*   **Tratamento de Erros de Conectividade:** Chamadas de rede podem falhar por instabilidade ou esgotamento de cota (Rate Limits). Sempre envolva as chamadas da API em blocos `try/catch` robustos e retorne mensagens limpas no Express para não travar o frontend.
*   **Vazamento de Chaves:** Nunca salve chaves de API direto no código nem dê commit no arquivo `.env`. Adicione o `.env` ao `.gitignore` imediatamente na inicialização do monorepo.
