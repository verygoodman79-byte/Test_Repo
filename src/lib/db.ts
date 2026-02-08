// ============================================================
// Simple JSON file-based database
// ============================================================
import fs from 'fs';
import path from 'path';
import { User, Script, AnalysisResult } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filename: string): T[] {
  ensureDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8');
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function writeJson<T>(filename: string, data: T[]): void {
  ensureDir();
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Users
export function getUsers(): User[] {
  return readJson<User>('users.json');
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email === email);
}

export function getUserById(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

export function createUser(user: User): void {
  const users = getUsers();
  users.push(user);
  writeJson('users.json', users);
}

// Scripts
export function getScripts(): Script[] {
  return readJson<Script>('scripts.json');
}

export function getScriptsByUser(userId: string): Script[] {
  return getScripts().filter(s => s.userId === userId);
}

export function getScriptById(id: string): Script | undefined {
  return getScripts().find(s => s.id === id);
}

export function createScript(script: Script): void {
  const scripts = getScripts();
  scripts.push(script);
  writeJson('scripts.json', scripts);
}

export function updateScript(id: string, updates: Partial<Script>): void {
  const scripts = getScripts();
  const idx = scripts.findIndex(s => s.id === id);
  if (idx >= 0) {
    scripts[idx] = { ...scripts[idx], ...updates };
    writeJson('scripts.json', scripts);
  }
}

export function deleteScript(id: string): void {
  let scripts = getScripts();
  scripts = scripts.filter(s => s.id !== id);
  writeJson('scripts.json', scripts);
  // Also delete associated analysis
  let analyses = getAnalyses();
  analyses = analyses.filter(a => a.scriptId !== id);
  writeJson('analyses.json', analyses);
}

// Analyses
export function getAnalyses(): AnalysisResult[] {
  return readJson<AnalysisResult>('analyses.json');
}

export function getAnalysisByScriptId(scriptId: string): AnalysisResult | undefined {
  return getAnalyses().find(a => a.scriptId === scriptId);
}

export function createAnalysis(analysis: AnalysisResult): void {
  const analyses = getAnalyses();
  // Replace if exists
  const idx = analyses.findIndex(a => a.scriptId === analysis.scriptId);
  if (idx >= 0) {
    analyses[idx] = analysis;
  } else {
    analyses.push(analysis);
  }
  writeJson('analyses.json', analyses);
}
