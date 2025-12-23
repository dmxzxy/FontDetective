export interface LoadedFont {
  name: string;
  family: string;
  file: File;
}

export interface AnalysisResult {
  matchFound: boolean;
  bestMatchFontName: string;
  confidence: number;
  reasoning: string;
  similarities: string[];
  differences: string[];
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}
