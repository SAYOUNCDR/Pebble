export interface ExportArtifactDto {
    exportId: string;
    ownerUserId: string;
    teamId?: string;
    checklistId: string;
    format: "pdf";
    status: "ready" | "failed";
    fileName: string;
    filePath: string;
    downloadPath?: string;
    createdAt: string;
    updatedAt: string;
}
