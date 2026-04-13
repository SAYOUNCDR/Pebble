export interface ManualDto {
    manualId: string;
    manualName: string;
    originalFileName: string;
    storedFilePath: string;
    mimeType: string;
    fileSizeBytes: number;
    createdAt: string;
    updatedAt: string;
    teamId?: string;
}

export interface GenerateChecklistRequestDto {
    objective: string;
    maxItems: number;
    provider: "local" | "pageindex";
    retrievalMode: "heuristic" | "tree_search";
    strictCitations: boolean;
}
