export type JobStatus = "queued" | "ingesting" | "indexing" | "generating" | "verifying" | "completed" | "failed";

export interface JobDto {
    queueJobId: string;
    ownerUserId: string;
    teamId?: string;
    manualId: string;
    status: JobStatus;
    provider: "local" | "pageindex";
    retrievalMode: "heuristic" | "tree_search";
    objective: string;
    maxItems: number;
    strictCitations: boolean;
    checklistId?: string;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
}
