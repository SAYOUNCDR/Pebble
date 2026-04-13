export interface ChecklistItemEvidenceDto {
    manual_id?: string;
    section_id?: string;
    page_number?: number;
    excerpt?: string;
}

export interface ChecklistItemDto {
    item_id?: string;
    text?: string;
    status?: "todo" | "in_progress" | "done" | "blocked";
    assignee?: string | null;
    notes?: string | null;
    priority?: string;
    frequency?: string;
    safety_tag?: string;
    evidence?: ChecklistItemEvidenceDto;
    [key: string]: unknown;
}

export interface ChecklistDto {
    checklistId: string;
    ownerUserId: string;
    teamId?: string;
    manualId: string;
    sourceJobId: string;
    itemCount: number;
    retrievalMode: "heuristic" | "tree_search";
    warnings: string[];
    selectedNodeIds: string[];
    items: ChecklistItemDto[];
    createdAt: string;
    updatedAt: string;
}
