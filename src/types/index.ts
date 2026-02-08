// ============================================================
// Script Review Agent - Type Definitions
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
  summary: ScriptSummary;
  structuralErrors: StructuralError[];
  grammarErrors: GrammarError[];
  typos: Typo[];
  characterErrors: CharacterError[];
  sceneAnalysis: SceneAnalysis[];
  statistics: ScriptStatistics;
  overallScore: number; // 0-100
  createdAt: string;
}

export interface ScriptSummary {
  title: string;
  genre: string;
  totalScenes: number;
  totalCharacters: number;
  estimatedReadingTime: string;
  synopsis: string;
}

export interface StructuralError {
  id: string;
  type: 'scene_order' | 'missing_transition' | 'incomplete_scene' | 'format_violation' | 'pacing_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string; // e.g., "Scene 3, Line 45"
  description: string;
  suggestion: string;
  context: string; // surrounding text
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
  type: 'inconsistent_behavior' | 'missing_motivation' | 'continuity_error' | 'dialogue_mismatch' | 'description_conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  evidence: string; // the specific text/reasoning as evidence
  suggestion: string;
}

export interface SceneAnalysis {
  sceneNumber: number;
  title: string;
  location: string;
  characters: string[];
  dialogueRatio: number; // percentage
  actionRatio: number;
  wordCount: number;
  mood: string;
  issues: string[];
}

export interface ScriptStatistics {
  totalWords: number;
  totalLines: number;
  totalScenes: number;
  totalCharacters: number;
  dialoguePercentage: number;
  actionPercentage: number;
  averageSceneLength: number;
  longestScene: { scene: number; words: number };
  shortestScene: { scene: number; words: number };
  characterDialogueDistribution: { character: string; percentage: number; lineCount: number }[];
}

// Dashboard filter types
export type ErrorCategory = 'all' | 'structural' | 'grammar' | 'typo' | 'character';
export type SeverityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';
