import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:4000";
const RUN_E2E = process.env.RUN_E2E === "1";

async function findPdfFile() {
  const manualsDir = path.resolve(process.cwd(), "..", "..", "test_manuals");
  const entries = await readdir(manualsDir);
  const pdf = entries.find((name) => name.toLowerCase().endsWith(".pdf"));
  if (!pdf) {
    throw new Error("No PDF found in test_manuals.");
  }
  return path.join(manualsDir, pdf);
}

test(
  "e2e pipeline flow: register -> upload -> generate -> checklist edit -> export",
  { skip: !RUN_E2E },
  async () => {
    const email = `e2e_${Date.now()}@pebble.local`;
    const password = "Passw0rd!123";

    const register = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "E2E User", email, password }),
    });
    assert.equal(register.status, 201);
    const registerBody = await register.json();
    const token = registerBody?.token;
    assert.equal(typeof token, "string");

    const pdfPath = await findPdfFile();
    const fileBuffer = await readFile(pdfPath);
    const fileName = path.basename(pdfPath);

    const uploadForm = new FormData();
    uploadForm.append("manualId", `e2e-${Date.now()}`);
    uploadForm.append("manualName", "E2E Manual");
    uploadForm.append(
      "file",
      new Blob([fileBuffer], { type: "application/pdf" }),
      fileName,
    );

    const upload = await fetch(`${API_BASE}/api/manuals`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: uploadForm,
    });
    assert.equal(upload.status, 201);
    const uploadBody = await upload.json();
    const manualId = uploadBody?.manual?.manualId;
    assert.equal(typeof manualId, "string");

    const generate = await fetch(
      `${API_BASE}/api/manuals/${encodeURIComponent(manualId)}/checklists/generate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          objective: "Generate checklist",
          maxItems: 8,
          provider: "local",
          retrievalMode: "heuristic",
          strictCitations: true,
        }),
      },
    );

    assert.equal(generate.status, 202);
    const generateBody = await generate.json();
    const jobId = generateBody?.jobId;
    assert.equal(typeof jobId, "string");

    let lastStatus = "queued";
    for (let i = 0; i < 20; i += 1) {
      const jobResponse = await fetch(
        `${API_BASE}/api/jobs/${encodeURIComponent(jobId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      assert.equal(jobResponse.status, 200);
      const jobBody = await jobResponse.json();
      lastStatus = jobBody?.job?.status ?? lastStatus;
      if (lastStatus === "completed" || lastStatus === "failed") {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    assert.equal(lastStatus, "completed");

    const finalJobResponse = await fetch(
      `${API_BASE}/api/jobs/${encodeURIComponent(jobId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    assert.equal(finalJobResponse.status, 200);
    const finalJobBody = await finalJobResponse.json();
    const checklistId = finalJobBody?.job?.checklistId;
    assert.equal(typeof checklistId, "string");

    const checklistResponse = await fetch(
      `${API_BASE}/api/checklists/${encodeURIComponent(checklistId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    assert.equal(checklistResponse.status, 200);
    const checklistBody = await checklistResponse.json();
    const checklistItems = checklistBody?.checklist?.items;
    assert.ok(Array.isArray(checklistItems));
    assert.ok(checklistItems.length > 0);

    const firstItem = checklistItems[0];
    const firstItemId =
      typeof firstItem === "object" && firstItem !== null
        ? String(firstItem.item_id ?? firstItem.itemId ?? "")
        : "";
    assert.ok(firstItemId.length > 0);

    const patchItemResponse = await fetch(
      `${API_BASE}/api/checklists/${encodeURIComponent(checklistId)}/items/${encodeURIComponent(firstItemId)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "in_progress", assignee: "e2e-user" }),
      },
    );
    assert.equal(patchItemResponse.status, 200);
    const patchedChecklistBody = await patchItemResponse.json();
    const patchedItems = patchedChecklistBody?.checklist?.items;
    assert.ok(Array.isArray(patchedItems));
    const patchedFirstItem = patchedItems.find((item) => {
      if (typeof item !== "object" || item === null) return false;
      return String(item.item_id ?? item.itemId ?? "") === firstItemId;
    });
    assert.ok(patchedFirstItem);
    assert.equal(patchedFirstItem.status, "in_progress");
    assert.equal(patchedFirstItem.assignee, "e2e-user");

    const exportResponse = await fetch(
      `${API_BASE}/api/checklists/${encodeURIComponent(checklistId)}/export/pdf`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    assert.equal(exportResponse.status, 201);
    const exportBody = await exportResponse.json();
    const exportId = exportBody?.exportId;
    assert.equal(typeof exportId, "string");
    assert.equal(exportBody?.status, "ready");

    const exportMetadataResponse = await fetch(
      `${API_BASE}/api/exports/${encodeURIComponent(exportId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    assert.equal(exportMetadataResponse.status, 200);
    const exportMetadataBody = await exportMetadataResponse.json();
    assert.equal(exportMetadataBody?.export?.exportId, exportId);
    assert.equal(exportMetadataBody?.export?.status, "ready");

    const exportFileResponse = await fetch(
      `${API_BASE}/api/exports/${encodeURIComponent(exportId)}/file`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    assert.equal(exportFileResponse.status, 200);
    const fileBufferOut = await exportFileResponse.arrayBuffer();
    assert.ok(fileBufferOut.byteLength > 0);
  },
);
