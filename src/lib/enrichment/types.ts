export interface EnrichmentData {
  company_summary: string;
  industry?: string;
  buying_signals: string[];
}

export interface EnrichmentContext {
  company_summary?: string;
  industry?: string;
  buying_signals?: string[];
}
