/**
 * Client-side PDF and Excel exporters.
 * PDF is generated in the browser to avoid sending sensitive content over the wire.
 */
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import * as XLSX from "xlsx";
import React from "react";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, color: "#0f172a" },
  brand: { fontSize: 10, color: "#0f3460", marginBottom: 12, letterSpacing: 1 },
  h1: { fontSize: 20, marginBottom: 4, color: "#0f3460" },
  meta: { fontSize: 10, color: "#475569", marginBottom: 16 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 12, marginBottom: 4, color: "#0f3460" },
  body: { fontSize: 11, lineHeight: 1.5, whiteSpace: "pre-wrap" },
  actionRow: { paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0" },
  actionMeta: { fontSize: 9, color: "#64748b", marginTop: 2 },
});

type BlockLike = { kind: string; label: string; content: string };
type ActionLike = { description: string; owner: string; due_date: string | null; status: string };

export type MeetingExport = {
  employeeName: string;
  scheduledAt: string | null;
  duration: number | null;
  cadence: string | null;
  blocks: BlockLike[];
  actions: ActionLike[];
};

function MeetingDocument({ data }: { data: MeetingExport }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>CLEARIT · ASSISTENTE 1:1</Text>
        <Text style={styles.h1}>Reunião de 1:1 com {data.employeeName}</Text>
        <Text style={styles.meta}>
          {data.scheduledAt ? new Date(data.scheduledAt).toLocaleString("pt-BR") : "Sem data"}
          {data.duration ? ` · ${data.duration} min` : ""}
          {data.cadence ? ` · cadência ${data.cadence}` : ""}
        </Text>
        {data.blocks.map((b) => (
          <View key={b.kind} style={styles.section}>
            <Text style={styles.sectionTitle}>{b.label}</Text>
            <Text style={styles.body}>{b.content || "—"}</Text>
          </View>
        ))}
        {data.actions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acordos e próximos passos</Text>
            {data.actions.map((a, i) => (
              <View key={i} style={styles.actionRow}>
                <Text style={styles.body}>• {a.description}</Text>
                <Text style={styles.actionMeta}>
                  Responsável: {a.owner} · Prazo: {a.due_date ? new Date(a.due_date).toLocaleDateString("pt-BR") : "—"} · Status: {a.status}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function exportMeetingPdf(data: MeetingExport) {
  const blob = await pdf(<MeetingDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `1on1-${data.employeeName.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMeetingsCsv(rows: Record<string, any>[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "1on1s");
  XLSX.writeFile(wb, `clearit-1on1-${Date.now()}.xlsx`);
}
