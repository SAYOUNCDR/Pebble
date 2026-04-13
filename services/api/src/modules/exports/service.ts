import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import PDFDocument from "pdfkit";
import { v4 as uuidv4 } from "uuid";

import type { ChecklistDocument } from "../checklists/model.js";
import { ExportModel } from "./model.js";

function stringifyField(value: unknown, fallback = "-"): string {
    if (typeof value === "string" && value.trim().length > 0) {
        return value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    return fallback;
}

function parseChecklistItem(item: unknown): {
    text: string;
    priority: string;
    frequency: string;
    safetyTag: string;
    evidencePage: string;
    evidenceSection: string;
    excerpt: string;
} {
    if (typeof item !== "object" || item === null) {
        return {
            text: stringifyField(item, "Checklist item"),
            priority: "-",
            frequency: "-",
            safetyTag: "-",
            evidencePage: "-",
            evidenceSection: "-",
            excerpt: "-",
        };
    }

    const source = item as Record<string, unknown>;
    const evidence =
        typeof source.evidence === "object" && source.evidence !== null
            ? (source.evidence as Record<string, unknown>)
            : null;

    return {
        text: stringifyField(source.text ?? source.title, "Checklist item"),
        priority: stringifyField(source.priority),
        frequency: stringifyField(source.frequency),
        safetyTag: stringifyField(source.safety_tag),
        evidencePage: stringifyField(evidence?.page_number),
        evidenceSection: stringifyField(evidence?.section_id),
        excerpt: stringifyField(evidence?.excerpt),
    };
}

async function writeChecklistPdf(outputFilePath: string, checklist: ChecklistDocument): Promise<void> {
    await mkdir(path.dirname(outputFilePath), { recursive: true });

    await new Promise<void>((resolve, reject) => {
        const doc = new PDFDocument({ margin: 48, size: "A4" });
        const stream = createWriteStream(outputFilePath);

        stream.on("finish", () => resolve());
        stream.on("error", (error) => reject(error));
        doc.on("error", (error) => reject(error));

        doc.pipe(stream);

        doc.fontSize(18).text(`Checklist ${checklist.checklistId}`);
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor("#4b5563").text(`Manual: ${checklist.manualId}`);
        doc.text(`Items: ${checklist.itemCount}`);
        doc.text(`Generated: ${new Date(checklist.createdAt).toISOString()}`);
        doc.fillColor("#111827");
        doc.moveDown(1);

        checklist.items.forEach((rawItem, index) => {
            const item = parseChecklistItem(rawItem);
            doc.fontSize(12).text(`${index + 1}. ${item.text}`, { continued: false });
            doc.fontSize(9).fillColor("#374151").text(`Priority: ${item.priority} | Frequency: ${item.frequency} | Safety: ${item.safetyTag}`);
            doc.text(`Citation: Page ${item.evidencePage} | Section ${item.evidenceSection}`);
            doc.text(`Excerpt: ${item.excerpt}`);
            doc.fillColor("#111827");
            doc.moveDown(0.7);
        });

        doc.end();
    });
}

export async function createChecklistPdfExport(ownerUserId: string, checklist: ChecklistDocument, teamId?: string): Promise<{ exportId: string; status: "ready" }> {
    const exportId = `exp-${uuidv4().slice(0, 12)}`;
    const fileName = `${checklist.checklistId}.pdf`;
    const filePath = path.resolve(process.cwd(), "storage", "exports", `${exportId}-${fileName}`);

    await writeChecklistPdf(filePath, checklist);

    await ExportModel.create({
        exportId,
        ownerUserId,
        ...(teamId ? { teamId } : {}),
        checklistId: checklist.checklistId,
        format: "pdf",
        status: "ready",
        fileName,
        filePath,
    });

    return {
        exportId,
        status: "ready",
    };
}
