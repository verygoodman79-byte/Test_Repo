// ============================================================
// Script Report Review Agent - Type Definitions
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // hashed
  createdAt: string;
}

export interface Script {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  fileType: 'pdf' | 'txt' | 'docx';
  content: string; // extracted text
  uploadedAt: string;
  analyzedAt?: string;
  status: 'uploaded' | 'analyzing' | 'analyzed' | 'error';
}

export interface AnalysisResult {
  scriptId: string;
  summary: ReportSummary;
  structuralErrors: StructuralError[];
  grammarErrors: GrammarError[];
  typos: Typo[];
  characterErrors: CharacterError[];
  sectionAnalysis: SectionAnalysis[];
  statistics: ReportStatistics;
  overallScore: number; // 0-100
  createdAt: string;
}

export interface ReportSummary {
  title: string;
  genre: string;
  totalSections: number;
  totalCharacters: number;
  estimatedReadingTime: string;
  synopsis: string;
}

export interface StructuralError {
  id: string;
  type: 'missing_section' | 'section_order' | 'incomplete_section' | 'format_violation' | 'coherence_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  suggestion: string;
  context: string;
}

export interface GrammarError {
  id: string;
  type: 'grammar' | 'punctuation' | 'style' | 'redundancy' | 'awkward_phrasing';
  severity: 'low' | 'medium' | 'high';
  location: string;
  original: string;
  suggestion: string;
  explanation: string;
}

export interface Typo {
  id: string;
  location: string;
  original: string;
  correction: string;
  context: string;
}

export interface CharacterError {
  id: string;
  characterName: string;
  type: 'inconsistent_description' | 'missing_info' | 'continuity_error' | 'summary_mismatch' | 'description_conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  evidence: string;
  suggestion: string;
}

export interface SectionAnalysis {
  sectionNumber: number;
  title: string;
  type: string; // 작품제목, 캐릭터 요약, 짧은 요약, 중간 요약
  characters: string[];
  wordCount: number;
  quality: string; // 품질 평가
  issues: string[];
}

export interface ReportStatistics {
  totalWords: number;
  totalLines: number;
  totalSections: number;
  totalCharacters: number;
  sectionWordCounts: { section: string; words: number }[];
  characterMentionDistribution: { character: string; percentage: number; mentionCount: number }[];
  shortSummaryLength: number;
  mediumSummaryLength: number;
}

// Dashboard filter types
export type ErrorCategory = 'all' | 'structural' | 'grammar' | 'typo' | 'character';
export type SeverityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';
