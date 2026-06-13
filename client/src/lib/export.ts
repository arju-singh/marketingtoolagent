
import JSZip from "jszip";
import type { ProductContext, Deliverable } from "./types";

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Combine all deliverables into one Markdown document. */
export function combinedMarkdown(ctx: ProductContext, deliverables: Deliverable[]): string {
  const header = `# Marketing suite — ${ctx.summary.productName}

> ${ctx.summary.oneLiner}

- **Category:** ${ctx.summary.category}
- **Audience:** ${ctx.summary.audience}
- **Tech stack:** ${ctx.summary.techStack.join(", ") || "—"}
- **Generated:** ${new Date(ctx.createdAt).toLocaleString()}

---
`;
  const body = deliverables
    .filter((d) => d.ok)
    .map((d) => `\n\n<!-- skill: ${d.skill} -->\n${d.markdown}`)
    .join("\n\n---\n");
  return header + body;
}

export function downloadCombinedMarkdown(ctx: ProductContext, deliverables: Deliverable[]) {
  const md = combinedMarkdown(ctx, deliverables);
  triggerDownload(new Blob([md], { type: "text/markdown" }), `${slug(ctx.summary.productName)}-marketing.md`);
}

/** One .md file per deliverable, zipped, plus a combined file and the raw context. */
export async function downloadZip(ctx: ProductContext, deliverables: Deliverable[]) {
  const zip = new JSZip();
  const folder = zip.folder("deliverables")!;
  for (const d of deliverables) {
    if (d.ok) folder.file(`${slug(d.skill)}.md`, d.markdown);
  }
  zip.file("00-combined.md", combinedMarkdown(ctx, deliverables));
  zip.file("product-context.json", JSON.stringify(ctx, null, 2));
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, `${slug(ctx.summary.productName)}-marketing.zip`);
}
