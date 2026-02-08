// ============================================================
// Script Analysis Engine
// Rule-based analysis for screenplay/script review
// ============================================================
import { v4 as uuidv4 } from 'uuid';
import {
  AnalysisResult,
  ScriptSummary,
  StructuralError,
  GrammarError,
  Typo,
  CharacterError,
  SceneAnalysis,
  ScriptStatistics,
} from '@/types';

// ---- Korean common typos dictionary ----
const KOREAN_TYPOS: Record<string, string> = {
  '됬': '됐',
  '돼었': '되었',
  '되서': '돼서',
  '됴': '돼',
  '안됀다': '안된다',
  '왠지': '웬지',
  '웬만하면': '왠만하면',
  '몇일': '며칠',
  '금새': '금세',
  '오랫만에': '오랜만에',
  '일일히': '일일이',
  '어의없': '어이없',
  '어의가 없': '어이가 없',
  '바램': '바람',
  '설레임': '설렘',
  '갈께': '갈게',
  '할께': '할게',
  '먹을께': '먹을게',
  '해야겟': '해야겠',
  '그러치': '그렇지',
  '어떻게': '어떡해',
  '안녕하세여': '안녕하세요',
  '고마워여': '고마워요',
  '감사합니다': '감사합니다',
  '어떻해': '어떡해',
  '뵈요': '봬요',
  '봬요': '뵈요',
  '예기': '얘기',
  '걔내': '걔네',
  '댕기다': '다니다',
  '낳다': '낫다',
  '낫다': '낳다',
  '으로서': '으로써',
  '로서': '로써',
  '문안하다': '무난하다',
};

// ---- Common grammar patterns ----
const GRAMMAR_PATTERNS: { pattern: RegExp; type: GrammarError['type']; message: string; suggestion: string }[] = [
  {
    pattern: /\.\.\.\.\./g,
    type: 'punctuation',
    message: '말줄임표는 세 개(...)가 표준입니다.',
    suggestion: '...',
  },
  {
    pattern: /!{3,}/g,
    type: 'punctuation',
    message: '과도한 느낌표 사용은 효과를 줄입니다.',
    suggestion: '느낌표를 1-2개로 줄이세요.',
  },
  {
    pattern: /\?{3,}/g,
    type: 'punctuation',
    message: '과도한 물음표 사용입니다.',
    suggestion: '물음표를 1-2개로 줄이세요.',
  },
  {
    pattern: /\s{2,}/g,
    type: 'style',
    message: '불필요한 다중 공백이 있습니다.',
    suggestion: '공백을 하나로 줄이세요.',
  },
  {
    pattern: /([가-힣])\1{3,}/g,
    type: 'style',
    message: '같은 글자의 과도한 반복입니다.',
    suggestion: '반복을 줄여 표현하세요.',
  },
  {
    pattern: /그리고\s+그리고/g,
    type: 'redundancy',
    message: '"그리고"가 연속으로 사용되었습니다.',
    suggestion: '하나를 삭제하거나 다른 접속사로 대체하세요.',
  },
  {
    pattern: /하지만\s+하지만/g,
    type: 'redundancy',
    message: '"하지만"이 연속으로 사용되었습니다.',
    suggestion: '하나를 삭제하거나 다른 접속사로 대체하세요.',
  },
  {
    pattern: /그래서\s+그래서/g,
    type: 'redundancy',
    message: '"그래서"가 연속으로 사용되었습니다.',
    suggestion: '하나를 삭제하거나 다른 접속사로 대체하세요.',
  },
];

// ---- Scene detection patterns ----
const SCENE_PATTERNS = [
  /^S#?\s*(\d+)/im,           // S#1, S1
  /^씬\s*#?\s*(\d+)/im,       // 씬 #1
  /^SCENE\s*#?\s*(\d+)/im,    // SCENE #1
  /^장면\s*#?\s*(\d+)/im,     // 장면 #1
  /^#\s*(\d+)\s*[.\-:]/im,    // #1. or #1-
  /^(\d+)\.\s*(INT|EXT|내부|외부|실내|실외)/im, // 1. INT/EXT
];

const LOCATION_PATTERNS = [
  /(?:INT|EXT|내부|외부|실내|실외)[.\s\-\/]*(.+?)(?:\s*[-–—]\s*|\s*$)/i,
];

// ---- Character name detection ----
// Korean screenplay format: character name appears before dialogue, often in caps or special format
const CHARACTER_LINE_PATTERN = /^([A-Z가-힣][A-Z가-힣\s]{0,20})\s*(?:\(.*?\))?\s*$/;

interface ParsedScene {
  number: number;
  title: string;
  location: string;
  startLine: number;
  endLine: number;
  lines: string[];
  characters: Set<string>;
  dialogueLines: number;
  actionLines: number;
}

interface ParsedCharacter {
  name: string;
  firstAppearance: number;
  lastAppearance: number;
  dialogueCount: number;
  scenes: Set<number>;
  descriptions: string[];
}

// ============================================================
// Main Analysis Function
// ============================================================
export function analyzeScript(content: string, title: string): AnalysisResult {
  const lines = content.split('\n');
  const scenes = parseScenes(lines);
  const characters = parseCharacters(lines, scenes);

  const structuralErrors = analyzeStructure(scenes, lines);
  const grammarErrors = analyzeGrammar(lines);
  const typos = analyzeTypos(lines);
  const characterErrors = analyzeCharacters(characters, scenes, lines);
  const sceneAnalysis = buildSceneAnalysis(scenes);
  const statistics = buildStatistics(lines, scenes, characters);
  const summary = buildSummary(title, scenes, characters, lines);

  const totalIssues =
    structuralErrors.length + grammarErrors.length + typos.length + characterErrors.length;

  const criticalCount =
    structuralErrors.filter(e => e.severity === 'critical').length +
    characterErrors.filter(e => e.severity === 'critical').length;
  const highCount =
    structuralErrors.filter(e => e.severity === 'high').length +
    grammarErrors.filter(e => e.severity === 'high').length +
    characterErrors.filter(e => e.severity === 'high').length;

  // Score calculation
  let score = 100;
  score -= criticalCount * 10;
  score -= highCount * 5;
  score -= (totalIssues - criticalCount - highCount) * 1;
  score = Math.max(0, Math.min(100, score));

  return {
    scriptId: '',
    summary,
    structuralErrors,
    grammarErrors,
    typos,
    characterErrors,
    sceneAnalysis,
    statistics,
    overallScore: score,
    createdAt: new Date().toISOString(),
  };
}

// ============================================================
// Scene Parsing
// ============================================================
function parseScenes(lines: string[]): ParsedScene[] {
  const scenes: ParsedScene[] = [];
  let currentScene: ParsedScene | null = null;
  let sceneCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    let isSceneHeader = false;
    let sceneNum = 0;
    let location = '';

    for (const pattern of SCENE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        isSceneHeader = true;
        sceneNum = parseInt(match[1]) || ++sceneCount;
        break;
      }
    }

    // Also detect INT/EXT pattern without number
    if (!isSceneHeader && /^(?:INT|EXT|내부|외부|실내|실외)[.\s\-\/]/i.test(line)) {
      isSceneHeader = true;
      sceneNum = ++sceneCount;
    }

    if (isSceneHeader) {
      if (currentScene) {
        currentScene.endLine = i - 1;
        scenes.push(currentScene);
      }
      // Extract location
      for (const lp of LOCATION_PATTERNS) {
        const lm = line.match(lp);
        if (lm) {
          location = lm[1].trim();
          break;
        }
      }

      currentScene = {
        number: sceneNum,
        title: line,
        location: location || line,
        startLine: i,
        endLine: lines.length - 1,
        lines: [],
        characters: new Set(),
        dialogueLines: 0,
        actionLines: 0,
      };
    }

    if (currentScene) {
      currentScene.lines.push(line);

      // Detect character dialogue
      if (CHARACTER_LINE_PATTERN.test(line) && line.length < 30 && line.length > 0) {
        const charName = line.replace(/\(.*?\)/, '').trim();
        if (charName.length > 0 && charName.length < 20) {
          currentScene.characters.add(charName);
        }
      }

      // Count dialogue vs action
      if (line.startsWith('(') || line.startsWith('"') || line.startsWith("'") || line.startsWith('"')) {
        currentScene.dialogueLines++;
      } else if (line.length > 0 && !isSceneHeader) {
        currentScene.actionLines++;
      }
    }
  }

  if (currentScene) {
    scenes.push(currentScene);
  }

  // If no scenes detected, treat entire content as one scene
  if (scenes.length === 0) {
    scenes.push({
      number: 1,
      title: '전체 내용',
      location: '미지정',
      startLine: 0,
      endLine: lines.length - 1,
      lines: lines,
      characters: new Set(),
      dialogueLines: 0,
      actionLines: lines.filter(l => l.trim().length > 0).length,
    });
  }

  return scenes;
}

// ============================================================
// Character Parsing
// ============================================================
function parseCharacters(lines: string[], scenes: ParsedScene[]): Map<string, ParsedCharacter> {
  const characters = new Map<string, ParsedCharacter>();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (CHARACTER_LINE_PATTERN.test(line) && line.length > 0 && line.length < 30) {
      const name = line.replace(/\(.*?\)/, '').trim();
      if (name.length > 0 && name.length < 20) {

        if (!characters.has(name)) {
          characters.set(name, {
            name,
            firstAppearance: i,
            lastAppearance: i,
            dialogueCount: 0,
            scenes: new Set(),
            descriptions: [],
          });
        }

        const char = characters.get(name)!;
        char.lastAppearance = i;
        char.dialogueCount++;

        // Find which scene this is in
        for (const scene of scenes) {
          if (i >= scene.startLine && i <= scene.endLine) {
            char.scenes.add(scene.number);
            break;
          }
        }
      }
    }

    // Look for character descriptions (e.g., "민수(30대, 회사원)")
    const descMatch = line.match(/([A-Z가-힣]+)\s*\(([^)]+)\)/);
    if (descMatch && characters.has(descMatch[1])) {
      characters.get(descMatch[1])!.descriptions.push(descMatch[2]);
    }
  }

  return characters;
}

// ============================================================
// Structural Analysis
// ============================================================
function analyzeStructure(scenes: ParsedScene[], lines: string[]): StructuralError[] {
  const errors: StructuralError[] = [];

  // Check scene numbering
  for (let i = 1; i < scenes.length; i++) {
    if (scenes[i].number !== scenes[i - 1].number + 1 && scenes[i].number > 1) {
      errors.push({
        id: uuidv4(),
        type: 'scene_order',
        severity: 'medium',
        location: `씬 ${scenes[i].number} (${scenes[i].startLine + 1}번 줄)`,
        description: `씬 번호가 연속적이지 않습니다. 씬 ${scenes[i - 1].number} 다음에 씬 ${scenes[i].number}이(가) 옵니다.`,
        suggestion: `씬 번호를 ${scenes[i - 1].number + 1}로 수정하거나, 누락된 씬을 추가하세요.`,
        context: scenes[i].title,
      });
    }
  }

  // Check very short scenes
  for (const scene of scenes) {
    const contentLines = scene.lines.filter(l => l.trim().length > 0);
    if (contentLines.length < 3 && scenes.length > 1) {
      errors.push({
        id: uuidv4(),
        type: 'incomplete_scene',
        severity: 'medium',
        location: `씬 ${scene.number} (${scene.startLine + 1}번 줄)`,
        description: `씬이 매우 짧습니다 (${contentLines.length}줄). 내용이 불완전할 수 있습니다.`,
        suggestion: '씬의 내용을 보충하거나, 인접 씬과 병합을 고려하세요.',
        context: scene.lines.slice(0, 3).join('\n'),
      });
    }

    // Check very long scenes
    if (contentLines.length > 100) {
      errors.push({
        id: uuidv4(),
        type: 'pacing_issue',
        severity: 'low',
        location: `씬 ${scene.number} (${scene.startLine + 1}번 줄)`,
        description: `씬이 매우 깁니다 (${contentLines.length}줄). 페이싱에 영향을 줄 수 있습니다.`,
        suggestion: '씬을 두 개 이상으로 분할하는 것을 고려하세요.',
        context: scene.title,
      });
    }

    // Check scenes without characters/dialogue
    if (scene.characters.size === 0 && scene.dialogueLines === 0 && contentLines.length > 5) {
      errors.push({
        id: uuidv4(),
        type: 'incomplete_scene',
        severity: 'low',
        location: `씬 ${scene.number} (${scene.startLine + 1}번 줄)`,
        description: '이 씬에 등장인물의 대사가 없습니다.',
        suggestion: '의도적인 것이 아니라면 등장인물 지정과 대사를 추가하세요.',
        context: scene.title,
      });
    }
  }

  // Check for missing scene transitions
  for (let i = 0; i < scenes.length - 1; i++) {
    const lastLines = scenes[i].lines.slice(-3).join(' ').toLowerCase();
    const hasTransition = /(?:cut to|dissolve|fade|전환|컷|디졸브|페이드)/i.test(lastLines);
    if (!hasTransition && scenes.length > 3) {
      // Only flag if there are enough scenes to make this meaningful
      errors.push({
        id: uuidv4(),
        type: 'missing_transition',
        severity: 'low',
        location: `씬 ${scenes[i].number} → 씬 ${scenes[i + 1].number}`,
        description: '씬 전환 지시어가 없습니다.',
        suggestion: 'CUT TO, DISSOLVE TO, FADE 등의 전환 지시어를 추가하세요.',
        context: scenes[i].lines.slice(-2).join('\n'),
      });
    }
  }

  // Check for format violations
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Tab/space inconsistency
    if (line.startsWith('\t') && lines.some(l => l.startsWith('    ') && l.trim().length > 0)) {
      errors.push({
        id: uuidv4(),
        type: 'format_violation',
        severity: 'low',
        location: `${i + 1}번 줄`,
        description: '탭과 공백이 혼용되고 있습니다.',
        suggestion: '일관된 들여쓰기 방식을 사용하세요.',
        context: line,
      });
      break; // Only report once
    }
  }

  return errors;
}

// ============================================================
// Grammar Analysis
// ============================================================
function analyzeGrammar(lines: string[]): GrammarError[] {
  const errors: GrammarError[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().length === 0) continue;

    for (const rule of GRAMMAR_PATTERNS) {
      const matches = line.matchAll(new RegExp(rule.pattern));
      for (const match of matches) {
        errors.push({
          id: uuidv4(),
          type: rule.type,
          severity: 'medium',
          location: `${i + 1}번 줄`,
          original: match[0],
          suggestion: rule.suggestion,
          explanation: rule.message,
        });
      }
    }

    // Check for incomplete sentences (ending with comma or no punctuation in dialogue)
    if (line.trim().startsWith('"') && !line.trim().endsWith('"') && !line.trim().endsWith('...')) {
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      if (!nextLine.includes('"')) {
        errors.push({
          id: uuidv4(),
          type: 'punctuation',
          severity: 'medium',
          location: `${i + 1}번 줄`,
          original: line.trim(),
          suggestion: '따옴표를 닫아주세요.',
          explanation: '열린 따옴표가 닫히지 않았습니다.',
        });
      }
    }

    // Check sentence ending consistency in Korean
    const koreanEndings = line.match(/(?:습니다|합니다|입니다|됩니다|해요|하세요|해라|한다|이다)/g);
    if (koreanEndings && koreanEndings.length >= 2) {
      const styles = new Set(koreanEndings.map(e => {
        if (/습니다|합니다|입니다|됩니다/.test(e)) return 'formal';
        if (/해요|하세요/.test(e)) return 'polite';
        if (/해라|한다|이다/.test(e)) return 'casual';
        return 'other';
      }));
      if (styles.size > 1) {
        errors.push({
          id: uuidv4(),
          type: 'style',
          severity: 'low',
          location: `${i + 1}번 줄`,
          original: line.trim(),
          suggestion: '한 문장 내에서 일관된 어미를 사용하세요.',
          explanation: '한 문장에서 서로 다른 존칭/반말 어미가 혼용되고 있습니다.',
        });
      }
    }
  }

  return errors;
}

// ============================================================
// Typo Analysis
// ============================================================
function analyzeTypos(lines: string[]): Typo[] {
  const typos: Typo[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().length === 0) continue;

    for (const [wrong, correct] of Object.entries(KOREAN_TYPOS)) {
      const idx = line.indexOf(wrong);
      if (idx !== -1) {
        typos.push({
          id: uuidv4(),
          location: `${i + 1}번 줄, ${idx + 1}번째 글자`,
          original: wrong,
          correction: correct,
          context: line.trim(),
        });
      }
    }

    // Check for repeated words (e.g., "나는 나는")
    const repeatedWordMatch = line.match(/(\S{2,})\s+\1/g);
    if (repeatedWordMatch) {
      for (const match of repeatedWordMatch) {
        const word = match.split(/\s+/)[0];
        typos.push({
          id: uuidv4(),
          location: `${i + 1}번 줄`,
          original: match,
          correction: word,
          context: line.trim(),
        });
      }
    }

    // English typos check - common ones
    const englishTypos: Record<string, string> = {
      'teh ': 'the ',
      'adn ': 'and ',
      'taht ': 'that ',
      'wiht ': 'with ',
      'thier ': 'their ',
      'recieve': 'receive',
      'occured': 'occurred',
      'seperate': 'separate',
    };
    const lowerLine = line.toLowerCase();
    for (const [wrong, correct] of Object.entries(englishTypos)) {
      if (lowerLine.includes(wrong)) {
        typos.push({
          id: uuidv4(),
          location: `${i + 1}번 줄`,
          original: wrong.trim(),
          correction: correct.trim(),
          context: line.trim(),
        });
      }
    }
  }

  return typos;
}

// ============================================================
// Character Consistency Analysis
// ============================================================
function analyzeCharacters(
  characters: Map<string, ParsedCharacter>,
  _scenes: ParsedScene[],
  _lines: string[]
): CharacterError[] {
  const errors: CharacterError[] = [];

  // Check for characters that appear only once (might be typos in character names)
  const charArray = Array.from(characters.values());
  for (const char of charArray) {
    if (char.dialogueCount === 1 && charArray.length > 2) {
      // Check if similar names exist (possible typo)
      for (const otherChar of charArray) {
        if (otherChar.name !== char.name && isSimilarName(char.name, otherChar.name)) {
          errors.push({
            id: uuidv4(),
            characterName: char.name,
            type: 'dialogue_mismatch',
            severity: 'high',
            location: `${char.firstAppearance + 1}번 줄`,
            description: `"${char.name}"이(가) 한 번만 등장합니다. "${otherChar.name}"의 오타일 수 있습니다.`,
            evidence: `"${char.name}"은(는) ${char.firstAppearance + 1}번 줄에서만 등장하며, 비슷한 이름 "${otherChar.name}"은(는) ${otherChar.dialogueCount}번 등장합니다.`,
            suggestion: `"${char.name}"을(를) "${otherChar.name}"으로 수정하세요.`,
          });
          break;
        }
      }
    }
  }

  // Check for character description conflicts
  for (const char of charArray) {
    if (char.descriptions.length > 1) {
      const uniqueDescs = [...new Set(char.descriptions)];
      if (uniqueDescs.length > 1) {
        errors.push({
          id: uuidv4(),
          characterName: char.name,
          type: 'description_conflict',
          severity: 'medium',
          location: `${char.name}의 설명`,
          description: `"${char.name}"에 대한 서로 다른 설명이 발견되었습니다.`,
          evidence: `설명들: ${uniqueDescs.map(d => `"${d}"`).join(', ')}`,
          suggestion: '등장인물 설명을 일관되게 수정하세요.',
        });
      }
    }
  }

  // Check for characters that disappear and reappear with gaps
  for (const char of charArray) {
    if (char.scenes.size > 2) {
      const sceneNums = Array.from(char.scenes).sort((a, b) => a - b);
      for (let i = 1; i < sceneNums.length; i++) {
        const gap = sceneNums[i] - sceneNums[i - 1];
        if (gap > 5) {
          errors.push({
            id: uuidv4(),
            characterName: char.name,
            type: 'continuity_error',
            severity: 'low',
            location: `씬 ${sceneNums[i - 1]} → 씬 ${sceneNums[i]}`,
            description: `"${char.name}"이(가) 씬 ${sceneNums[i - 1]} 이후 ${gap}개 씬 동안 등장하지 않다가 씬 ${sceneNums[i]}에서 다시 등장합니다.`,
            evidence: `등장 씬: ${sceneNums.join(', ')}. 씬 ${sceneNums[i - 1]}과 씬 ${sceneNums[i]} 사이에 긴 공백이 있습니다.`,
            suggestion: '의도적인 것이 아니라면, 중간에 해당 인물에 대한 언급을 추가하세요.',
          });
        }
      }
    }
  }

  return errors;
}

// ============================================================
// Helper Functions
// ============================================================
function isSimilarName(a: string, b: string): boolean {
  if (a.length === 0 || b.length === 0) return false;
  if (Math.abs(a.length - b.length) > 2) return false;

  // Simple Levenshtein distance check
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[a.length][b.length];
  return distance === 1 || distance === 2;
}

function buildSceneAnalysis(scenes: ParsedScene[]): SceneAnalysis[] {
  return scenes.map(scene => {
    const totalContentLines = scene.dialogueLines + scene.actionLines;
    const dialogueRatio = totalContentLines > 0 ? (scene.dialogueLines / totalContentLines) * 100 : 0;
    const wordCount = scene.lines.join(' ').split(/\s+/).filter(w => w.length > 0).length;

    const issues: string[] = [];
    if (dialogueRatio > 80) issues.push('대사 비중이 과도하게 높습니다.');
    if (dialogueRatio < 10 && scene.lines.length > 10) issues.push('대사가 거의 없습니다.');
    if (scene.characters.size === 0 && scene.lines.length > 5) issues.push('등장인물이 감지되지 않았습니다.');
    if (scene.characters.size > 6) issues.push('한 씬에 등장인물이 많습니다 (6명 이상).');

    return {
      sceneNumber: scene.number,
      title: scene.title,
      location: scene.location,
      characters: Array.from(scene.characters),
      dialogueRatio: Math.round(dialogueRatio),
      actionRatio: Math.round(100 - dialogueRatio),
      wordCount,
      mood: '—',
      issues,
    };
  });
}

function buildStatistics(
  lines: string[],
  scenes: ParsedScene[],
  characters: Map<string, ParsedCharacter>
): ScriptStatistics {
  const totalWords = lines.join(' ').split(/\s+/).filter(w => w.length > 0).length;
  const totalLines = lines.length;
  const nonEmptyLines = lines.filter(l => l.trim().length > 0).length;

  let totalDialogue = 0;
  for (const scene of scenes) {
    totalDialogue += scene.dialogueLines;
  }
  const dialoguePercentage = nonEmptyLines > 0 ? (totalDialogue / nonEmptyLines) * 100 : 0;

  const sceneWordCounts = scenes.map(s => ({
    scene: s.number,
    words: s.lines.join(' ').split(/\s+/).filter(w => w.length > 0).length,
  }));

  const avgWords = sceneWordCounts.length > 0
    ? sceneWordCounts.reduce((a, b) => a + b.words, 0) / sceneWordCounts.length
    : 0;

  const sorted = [...sceneWordCounts].sort((a, b) => b.words - a.words);

  const charArray = Array.from(characters.values());
  const totalDialogueCount = charArray.reduce((a, b) => a + b.dialogueCount, 0);
  const charDistribution = charArray
    .map(c => ({
      character: c.name,
      percentage: totalDialogueCount > 0 ? Math.round((c.dialogueCount / totalDialogueCount) * 100) : 0,
      lineCount: c.dialogueCount,
    }))
    .sort((a, b) => b.lineCount - a.lineCount);

  return {
    totalWords,
    totalLines,
    totalScenes: scenes.length,
    totalCharacters: characters.size,
    dialoguePercentage: Math.round(dialoguePercentage),
    actionPercentage: Math.round(100 - dialoguePercentage),
    averageSceneLength: Math.round(avgWords),
    longestScene: sorted.length > 0 ? sorted[0] : { scene: 0, words: 0 },
    shortestScene: sorted.length > 0 ? sorted[sorted.length - 1] : { scene: 0, words: 0 },
    characterDialogueDistribution: charDistribution,
  };
}

function buildSummary(
  title: string,
  scenes: ParsedScene[],
  characters: Map<string, ParsedCharacter>,
  lines: string[]
): ScriptSummary {
  const totalWords = lines.join(' ').split(/\s+/).filter(w => w.length > 0).length;
  const readingMinutes = Math.ceil(totalWords / 200); // ~200 words per minute for screenplay

  return {
    title,
    genre: '미분류',
    totalScenes: scenes.length,
    totalCharacters: characters.size,
    estimatedReadingTime: `약 ${readingMinutes}분`,
    synopsis: lines.slice(0, 10).filter(l => l.trim().length > 0).join(' ').slice(0, 200) + '...',
  };
}
