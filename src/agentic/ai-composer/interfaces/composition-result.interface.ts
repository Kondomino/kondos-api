export interface CompositionResult {
  success: boolean;
  kondoId: number;
  kondoName: string;
  fieldsUpdated: string[];
  description?: string;
  infraDescription?: string;
  amenitiesCount?: number;
  duration?: number;
  error?: string;
}

export interface ComposeOptions {
  force?: boolean; // Recompose even if already composed
}
