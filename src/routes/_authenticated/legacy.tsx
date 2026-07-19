import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { analyzeLegacyFeedback } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/legacy")({
  component: LegacyImport,
});

function LegacyImport() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  const { data: items } = useQuery({
    queryKey: ["legacy"],
    queryFn: async () => {
      const { data, error } = await supabase.from("legacy_feedbacks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleUpload = async (file: File) => {
    setBusy(true);
    try {
      // pdfjs runs in-browser to keep the raw file out of the server
      const pdfjs: any = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      const buf = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buf }).promise;
      let out = "";
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const c = await page.getTextContent();
        out += c.items.map((it: any) => it.str).join(" ") + "\n\n";
      }
      setText(out.trim());
      toast.success(`Extraído texto de ${doc.numPages} página(s).`);
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao ler PDF.");
    } finally {
      setBusy(false);
    }
  };

  const analyze = useMutation({
    mutationFn: async () => {
      if (text.trim().length < 20) throw new Error("Cole ou envie um texto maior.");
      const result = await analyzeLegacyFeedback({ data: { legacyFeedbackText: text } });
      const { data: userData } = await supabase.auth.getUser();
      const suggestions = [
        result.rewrittenFeedback,
        ...result.missingElements.map((m) => `Faltando: ${m}`),
        ...result.agreementsFound.map((a) => `Acordo: ${a}`),
        ...result.nextStepsFound.map((n) => `Próximo passo: ${n}`),
      ].filter((s) => s && s.trim().length > 0);
      const { error } = await supabase.from("legacy_feedbacks").insert({
        uploaded_by: userData.user!.id,
        original_text: text,
        sbi_extracted: result.sbiMapping,
        tone_analysis: {
          score: result.toneScore,
          warnings: result.toneWarnings,
          lgpdAlerts: result.lgpdAlerts,
        },
        suggestions,
      });
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["legacy"] });
      toast.success("Análise concluída.");
      setText("");
    },
    onError: (e: any) => toast.error(e.message ?? "Falha na análise."),
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Feedbacks legados</h1>
      <p className="mt-1 text-muted-foreground">
        Importe PDFs históricos ou cole o texto. A IA reestrutura em SBI e analisa o tom.
      </p>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Nova análise</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground hover:bg-secondary/40">
            <Upload className="h-4 w-4" />
            {busy ? "Extraindo…" : "Selecionar PDF (extração no browser)"}
            <input
              type="file" accept="application/pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(f); }}
            />
          </label>
          <Textarea
            rows={10} value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Ou cole o texto do feedback aqui…"
          />
          <Button
            onClick={() => analyze.mutate()}
            disabled={analyze.isPending || text.trim().length < 20}
          >
            {analyze.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando…</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Analisar com IA</>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">Histórico</h2>
        {items && items.length > 0 ? items.map((it: any) => (
          <Card key={it.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" /> Análise · {new Date(it.created_at).toLocaleString("pt-BR")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {it.sbi_extracted && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">SBI extraído</p>
                  <p><strong>Situação:</strong> {it.sbi_extracted.situation}</p>
                  <p><strong>Comportamento:</strong> {it.sbi_extracted.behavior}</p>
                  <p><strong>Impacto:</strong> {it.sbi_extracted.impact}</p>
                </div>
              )}
              {it.tone_analysis && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Análise de tom</p>
                  <p>Score: <strong>{it.tone_analysis.score}/10</strong></p>
                  {Array.isArray(it.tone_analysis.warnings) && it.tone_analysis.warnings.length > 0 && (
                    <p className="text-destructive">Alertas de tom: {it.tone_analysis.warnings.join(", ")}</p>
                  )}
                  {Array.isArray(it.tone_analysis.lgpdAlerts) && it.tone_analysis.lgpdAlerts.length > 0 && (
                    <p className="text-warning">LGPD: {it.tone_analysis.lgpdAlerts.join(", ")}</p>
                  )}
                </div>
              )}
              {Array.isArray(it.suggestions) && it.suggestions.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sugestões</p>
                  <ul className="ml-4 list-disc">
                    {it.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )) : <p className="text-muted-foreground">Nenhuma análise ainda.</p>}
      </div>
    </div>
  );
}
