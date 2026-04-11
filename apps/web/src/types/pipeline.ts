export interface HealthResponse {
  status: 'ok'
  service: string
  timestamp: string
}

export interface IngestRequest {
  manual_id: string
  file_path: string
  manual_name?: string
}

export interface IngestResponse {
  manual_id: string
  manual_name: string
  file_path: string
  page_count: number
  word_count: number
  status: 'ingested'
}

export interface BuildIndexRequest {
  manual_id: string
  chunk_size_pages?: number
}

export interface SectionOutline {
  section_id: string
  title: string
  page_start: number
  page_end: number
  summary: string
}

export interface BuildIndexResponse {
  manual_id: string
  section_count: number
  sections: SectionOutline[]
  status: 'indexed'
}

export interface Evidence {
  manual_id: string
  section_id: string
  page_number: number
  excerpt: string
}

export interface ChecklistItem {
  item_id: string
  text: string
  priority: 'must_do' | 'optional'
  frequency: string
  safety_tag: 'safety' | 'standard'
  confidence: number
  evidence: Evidence
  status: 'todo' | 'done' | 'na'
  assignee?: string | null
  notes?: string | null
}

export interface GenerateChecklistRequest {
  manual_id: string
  objective: string
  max_items: number
  strict_citations: boolean
}

export interface GenerateChecklistResponse {
  manual_id: string
  checklist_id: string
  item_count: number
  items: ChecklistItem[]
  warnings: string[]
  status: 'generated'
}

export interface VerifyChecklistRequest {
  manual_id: string
  checklist_id?: string
  strict_citations: boolean
}

export interface RejectedItem {
  text: string
  reason: string
}

export interface VerifyChecklistResponse {
  manual_id: string
  checklist_id?: string | null
  accepted_count: number
  rejected_count: number
  accepted_items: ChecklistItem[]
  rejected_items: RejectedItem[]
  status: 'verified'
}

