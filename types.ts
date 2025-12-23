export interface LoadedFont {
  name: string;
  family: string;
  file: File;
}

export interface FontPairing {
  name: string;
  reason: string;
  usage: string;
}

export interface DetailedMatch {
  textSegment: string;
  fontName: string;
  confidence: number;
  reasoning: string;
}

export interface AnalysisResult {
  matchFound: boolean;
  bestMatchFontName: string;
  confidence: number;
  reasoning: string;
  similarities: string[];
  differences: string[];
  detailedMatches: DetailedMatch[];
  recommendations?: FontPairing[];
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}