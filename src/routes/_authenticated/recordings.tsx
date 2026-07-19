import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mic, Square, Upload, Loader2, FileAudio, ArrowRight, Pause, Play,
  Sparkles, ShieldCheck, Calendar, Users, FileText, CheckCircle2, AlertCircle,
  Trash2, Radio,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { transcribeRecording, summarizeRecording } from "@/lib/recordings.functions";

export const Route = createFileRoute("/_authenticated/recordings")({
  component: RecordingsPage,
});

const STATUS_LABEL: Record<string, string> = {
  uploaded: "Enviado",
  transcribing: "Transcrevendo",
  transcribed: "Transcrito",
  summarizing: "Analisando",
  ready: "Pronto",
  error: "Erro",
};

const KIND_LABEL: Record<string, string> = {
  one_on_one: "1:1",
  feedback: "Feedback",
  development: "Desenvolvimento",
  other: "Outro",
};

type Kind = "one_on_one" | "feedback" | "development";
type Source = "mic" | "upload" | null;
type Stage = "form" | "processing";

const PROCESSING_STEPS = [
  { label: "Transcrevendo áudio", icon: Radio },
  { label: "Gerando resumo com IA", icon: Sparkles },
  { label: "Organizando informações", icon: FileText },
];

function RecordingsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const transcribe = useServerFn(transcribeRecording);
  const summarize = useServerFn(summarizeRecording);

  // Form
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Kind>("one_on_one");
  const [employeeId, setEmployeeId] = useState<string | undefined>();
  const [meetingDate, setMeetingDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [consent, setConsent] = useState(false);

  // Source
  const [source, setSource] = useState<Source>(null);

  // Mic
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Result
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Processing
  const [stage, setStage] = useState<Stage>("form");
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("id, full_name").eq("active", true).order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: recordings, isLoading: recordingsLoading } = useQuery({
    queryKey: ["recordings", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recordings")
        .select("id, title, kind, status, duration_seconds, created_at, employee_id, employees(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: (q) => {
      const rows = (q.state.data ?? []) as { status: string }[];
      return rows.some((r) => r.status === "transcribing" || r.status === "summarizing") ? 3000 : false;
    },
  });

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [previewUrl]);

  const canRecord = consent && title.trim().length > 0;
  const hasAudio = !!(previewBlob || file);

  const startMeter = (stream: MediaStream) => {
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 2.5));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const stopMeter = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    setLevel(0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeCandidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setPreviewBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        stopMeter();
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setPaused(false);
      setElapsed(0);
      startMeter(stream);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      toast.error("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  };

  const pauseRecording = () => {
    if (!mediaRef.current) return;
    if (mediaRef.current.state === "recording") {
      mediaRef.current.pause();
      setPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } else if (mediaRef.current.state === "paused") {
      mediaRef.current.resume();
      setPaused(false);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
    setPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const clearAudio = () => {
    setPreviewBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    setElapsed(0);
    setSource(null);
  };

  const onFileChange = (f: File | null) => {
    if (!f) return;
    const okExt = /\.(mp3|wav|webm|m4a)$/i.test(f.name);
    const okMime = /audio\/(mpeg|mp3|wav|wave|x-wav|webm|mp4|m4a|x-m4a)/i.test(f.type);
    if (!okExt && !okMime) {
      toast.error("Formato não suportado. Use mp3, wav, webm ou m4a.");
      return;
    }
    setFile(f);
    setPreviewBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const save = useMutation({
    mutationFn: async () => {
      const blob = previewBlob ?? file;
      if (!blob) throw new Error("Grave ou envie um áudio.");
      if (!title.trim()) throw new Error("Dê um título à reunião.");
      if (!consent) throw new Error("Confirme o consentimento antes de continuar.");
      const src: "mic" | "upload" = previewBlob ? "mic" : "upload";
      const mime = blob.type || "audio/webm";
      const ext =
        mime.includes("mp4") ? "mp4" :
        mime.includes("mpeg") || mime.includes("mp3") ? "mp3" :
        mime.includes("wav") ? "wav" :
        mime.includes("ogg") ? "ogg" :
        mime.includes("m4a") ? "m4a" :
        "webm";

      const id = crypto.randomUUID();
      const path = `${user.id}/${id}.${ext}`;
      const { error: upErr } = await supabase.storage.from("recordings").upload(path, blob, {
        contentType: mime,
        upsert: false,
      });
      if (upErr) throw upErr;

      const dbKind = kind === "development" ? "other" : kind;

      const { error: insErr } = await supabase.from("recordings").insert({
        id,
        manager_id: user.id,
        employee_id: employeeId ?? null,
        title: title.trim(),
        kind: dbKind,
        source: src,
        audio_path: path,
        audio_mime: mime,
        duration_seconds: previewBlob ? elapsed : null,
        status: "uploaded",
      });
      if (insErr) throw insErr;
      return id;
    },
    onSuccess: async (id) => {
      setStage("processing");
      setStepIndex(0);
      setProgress(8);
      try {
        setStepIndex(0);
        const pTick = setInterval(() => setProgress((p) => Math.min(90, p + 2)), 400);
        await transcribe({ data: { recordingId: id } });
        setStepIndex(1);
        setProgress((p) => Math.max(p, 55));
        await summarize({ data: { recordingId: id } });
        setStepIndex(2);
        setProgress(100);
        clearInterval(pTick);
        toast.success("Reunião registrada com sucesso.");
        qc.invalidateQueries({ queryKey: ["recordings", user.id] });
        setTimeout(() => navigate({ to: "/recordings/$id", params: { id } }), 500);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erro no processamento.";
        toast.error(msg);
        qc.invalidateQueries({ queryKey: ["recordings", user.id] });
        setStage("form");
      }
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro ao salvar."),
  });

  const resetAll = () => {
    setTitle("");
    setEmployeeId(undefined);
    setKind("one_on_one");
    setMeetingDate(new Date().toISOString().slice(0, 10));
    setConsent(false);
    clearAudio();
    setStage("form");
    setProgress(0);
    setStepIndex(0);
  };

  if (stage === "processing") {
    return <ProcessingView progress={progress} stepIndex={stepIndex} />;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary/80">
            <Sparkles className="h-3.5 w-3.5" /> Copiloto de reuniões
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Registrar Reunião</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Grave uma 1:1, feedback ou conversa de desenvolvimento direto pelo navegador — ou envie um áudio já
            autorizado. A IA transcreve, resume e organiza os pontos-chave em segundos.
          </p>
        </div>
      </div>

      {/* Etapa 1 - Informações */}
      <Card className="mt-8 border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <StepBadge n={1} />
            <div>
              <CardTitle className="text-base">Informações da reunião</CardTitle>
              <CardDescription>Contextualize o registro para a IA gerar um resumo mais preciso.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Título da reunião</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: 1:1 com Ana — objetivos do trimestre" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_on_one">1:1</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="development">Desenvolvimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Colaborador (opcional)</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger><SelectValue placeholder="Selecione um liderado" /></SelectTrigger>
                <SelectContent>
                  {employees?.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data da reunião</Label>
              <Input id="date" type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Etapa 2 - Consentimento */}
      <Card className={cn("mt-6 border-border/60 transition-colors", consent && "border-primary/40 bg-primary/[0.03]")}>
        <CardContent className="flex items-start gap-4 py-5">
          <StepBadge n={2} />
          <label className="flex flex-1 cursor-pointer items-start gap-3">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Consentimento dos participantes
              </div>
              <p className="text-sm text-muted-foreground">
                Confirmo que todos os participantes autorizaram a gravação desta conversa. Sem o consentimento
                marcado, os controles de gravação e upload permanecem desabilitados.
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Etapa 3 - Origem */}
      <Card className={cn("mt-6 border-border/60", !canRecord && "opacity-60")}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <StepBadge n={3} />
            <div>
              <CardTitle className="text-base">Origem do áudio</CardTitle>
              <CardDescription>Escolha entre gravar agora ou enviar um arquivo previamente autorizado.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <SourceCard
              icon={<Mic className="h-5 w-5" />}
              title="Gravar pelo microfone"
              description="Capture a conversa em tempo real usando o microfone do navegador."
              active={source === "mic"}
              disabled={!canRecord || source === "upload"}
              onClick={() => setSource("mic")}
            />
            <SourceCard
              icon={<Upload className="h-5 w-5" />}
              title="Enviar arquivo"
              description="Faça upload nos formatos mp3, wav, webm ou m4a (até 25 MB)."
              active={source === "upload"}
              disabled={!canRecord || source === "mic"}
              onClick={() => setSource("upload")}
            />
          </div>

          {source === "mic" && (
            <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "relative flex h-11 w-11 items-center justify-center rounded-full border",
                    recording && !paused ? "border-destructive/60 bg-destructive/10" : "border-border bg-background",
                  )}>
                    <Mic className={cn("h-5 w-5", recording && !paused ? "text-destructive" : "text-muted-foreground")} />
                    {recording && !paused && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-destructive/30" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {!recording && !previewBlob && "Pronto para gravar"}
                      {recording && !paused && "Gravando…"}
                      {recording && paused && "Gravação pausada"}
                      {!recording && previewBlob && "Gravação concluída"}
                    </div>
                    <div className="font-mono text-2xl tabular-nums">{formatTime(elapsed)}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!recording && !previewBlob && (
                    <Button onClick={startRecording} disabled={!canRecord}>
                      <Mic className="mr-2 h-4 w-4" /> Iniciar gravação
                    </Button>
                  )}
                  {recording && (
                    <>
                      <Button variant="outline" onClick={pauseRecording}>
                        {paused ? <><Play className="mr-2 h-4 w-4" /> Continuar</> : <><Pause className="mr-2 h-4 w-4" /> Pausar</>}
                      </Button>
                      <Button variant="destructive" onClick={stopRecording}>
                        <Square className="mr-2 h-4 w-4" /> Encerrar
                      </Button>
                    </>
                  )}
                  {!recording && previewBlob && (
                    <Button variant="ghost" onClick={clearAudio}>
                      <Trash2 className="mr-2 h-4 w-4" /> Descartar
                    </Button>
                  )}
                </div>
              </div>

              {/* Audio meter */}
              {recording && (
                <div className="mt-5 flex h-10 items-center gap-1">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const threshold = i / 32;
                    const active = level > threshold * 0.9;
                    return (
                      <span
                        key={i}
                        className={cn(
                          "flex-1 rounded-sm transition-all duration-100",
                          active ? "bg-primary" : "bg-border/60",
                        )}
                        style={{ height: `${20 + Math.min(80, (active ? level : threshold) * 80)}%` }}
                      />
                    );
                  })}
                </div>
              )}

              {previewUrl && !recording && (
                <div className="mt-5 space-y-2">
                  <audio controls src={previewUrl} className="w-full" />
                  <p className="text-xs text-muted-foreground">Duração: {formatTime(elapsed)}</p>
                </div>
              )}
            </div>
          )}

          {source === "upload" && (
            <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-5">
              {!file ? (
                <label className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-10 text-center transition-colors",
                  canRecord && "hover:border-primary/60 hover:bg-primary/[0.03]",
                )}>
                  <input
                    type="file"
                    accept=".mp3,.wav,.webm,.m4a,audio/*"
                    className="hidden"
                    disabled={!canRecord}
                    onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                  />
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <div className="text-sm font-medium">Clique para selecionar um arquivo</div>
                  <div className="text-xs text-muted-foreground">Formatos: mp3, wav, webm, m4a</div>
                </label>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileAudio className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{file.name}</div>
                      <div className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearAudio}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remover
                  </Button>
                </div>
              )}
              {previewUrl && file && (
                <audio controls src={previewUrl} className="mt-4 w-full" />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CTA final */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-medium">Pronto para analisar com IA</div>
            <p className="text-xs text-muted-foreground">
              A transcrição é feita com filtro LGPD automático. Você poderá editar o resumo antes de salvar.
            </p>
          </div>
        </div>
        <Button
          size="lg"
          onClick={() => save.mutate()}
          disabled={save.isPending || !hasAudio || !title.trim() || !consent}
        >
          {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
          Transcrever e gerar resumo
        </Button>
      </div>

      {/* Histórico */}
      <div className="mt-14">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">Histórico de reuniões</h2>
            <p className="text-sm text-muted-foreground">Consulte transcrições, resumos e acordos anteriores.</p>
          </div>
          {recordings && recordings.length > 0 && (
            <Badge variant="secondary" className="font-normal">{recordings.length} {recordings.length === 1 ? "registro" : "registros"}</Badge>
          )}
        </div>

        {recordingsLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : !recordings || recordings.length === 0 ? (
          <EmptyState onStart={() => document.getElementById("title")?.focus()} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {recordings.map((r, i) => (
              <Link
                key={r.id}
                to="/recordings/$id"
                params={{ id: r.id }}
                className={cn(
                  "group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-secondary/50",
                  i !== 0 && "border-t border-border",
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileAudio className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.title}</p>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                      <span>·</span>
                      <span>{KIND_LABEL[r.kind] ?? r.kind}</span>
                      {r.employees?.full_name && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{r.employees.full_name}</span>
                        </>
                      )}
                      {r.duration_seconds && (
                        <>
                          <span>·</span>
                          <span>{formatTime(r.duration_seconds)}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* footer reset */}
      {(title || hasAudio || consent) && (
        <div className="mt-6 text-right">
          <Button variant="ghost" size="sm" onClick={resetAll}>Limpar formulário</Button>
        </div>
      )}
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">
      {n}
    </div>
  );
}

function SourceCard({
  icon, title, description, active, disabled, onClick,
}: {
  icon: React.ReactNode; title: string; description: string;
  active: boolean; disabled: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-all",
        "disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-primary/60 bg-primary/[0.06] shadow-sm ring-1 ring-primary/30"
          : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
      )}
    >
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary/15",
      )}>
        {icon}
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {active && (
        <CheckCircle2 className="absolute right-4 top-4 h-5 w-5 text-primary" />
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const busy = status === "transcribing" || status === "summarizing";
  const variant: "default" | "destructive" | "secondary" =
    status === "ready" ? "default" : status === "error" ? "destructive" : "secondary";
  return (
    <Badge variant={variant} className="whitespace-nowrap">
      {busy && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {status === "error" && <AlertCircle className="mr-1 h-3 w-3" />}
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mic className="h-6 w-6" />
        </div>
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold">Nenhuma reunião registrada ainda</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Registre sua primeira 1:1 ou feedback e deixe a IA cuidar da transcrição, resumo e acordos.
        </p>
      </div>
      <Button onClick={onStart}>
        <Sparkles className="mr-2 h-4 w-4" /> Começar primeira gravação
      </Button>
    </div>
  );
}

function ProcessingView({ progress, stepIndex }: { progress: number; stepIndex: number }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-8 w-8 animate-pulse" />
        </div>
      </div>
      <h2 className="font-display text-2xl font-semibold tracking-tight">Analisando sua reunião</h2>
      <p className="mt-2 text-muted-foreground">
        A IA está transcrevendo o áudio e organizando os pontos-chave. Isso costuma levar alguns segundos.
      </p>

      <div className="mt-8 w-full">
        <Progress value={progress} className="h-2" />
        <div className="mt-1 text-right text-xs text-muted-foreground">{Math.round(progress)}%</div>
      </div>

      <div className="mt-8 w-full space-y-2">
        {PROCESSING_STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < stepIndex || progress >= 100;
          const active = i === stepIndex && progress < 100;
          return (
            <div
              key={s.label}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 text-left transition-all",
                done && "border-primary/30 bg-primary/[0.04]",
                active && "border-primary/50 bg-primary/[0.06] shadow-sm",
                !done && !active && "border-border opacity-60",
              )}
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                done ? "bg-primary text-primary-foreground" :
                active ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
              )}>
                {done ? <CheckCircle2 className="h-5 w-5" /> :
                 active ? <Loader2 className="h-5 w-5 animate-spin" /> :
                 <Icon className="h-5 w-5" />}
              </div>
              <div className="flex-1 text-sm font-medium">{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
