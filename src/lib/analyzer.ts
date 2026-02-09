// ============================================================
// Script Analysis Engine - Gemini 2.5 Flash LLM-based
// ============================================================
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import {
  AnalysisResult,
  StructuralError,
  GrammarError,
  Typo,
  CharacterError,
  SceneAnalysis,
  ScriptStatistics,
  ScriptSummary,
} from '@/types';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  }
  return new GoogleGenerativeAI(apiKey);
}

async function callGemini(prompt: string): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });

  const response = result.response;
  return response.text();
}

// ============================================================
// Truncate script if too long for LLM context
// ============================================================
function truncateScript(content: string, maxChars: number = 80000): string {
  if (content.length <= maxChars) return content;
  const half = Math.floor(maxChars / 2);
  return (
    content.slice(0, half) +
    '\n\n[... 중략 (대본이 너무 길어 일부 생략됨) ...]\n\n' +
    content.slice(-half)
  );
}

// ============================================================
// Main Analysis - Orchestrates all LLM calls
// ============================================================
export async function analyzeScript(content: string, title: string): Promise<AnalysisResult> {
  const scriptText = truncateScript(content);

  // Run all analyses in parallel for speed
  const [
    summaryAndStats,
    structuralErrors,
    grammarErrors,
    typos,
    characterErrors,
    sceneAnalysis,
  ] = await Promise.all([
    analyzeSummaryAndStats(scriptText, title),
    analyzeStructural(scriptText),
    analyzeGrammar(scriptText),
    analyzeTypos(scriptText),
    analyzeCharacters(scriptText),
    analyzeScenes(scriptText),
  ]);

  // Calculate score
  const totalIssues =
    structuralErrors.length + grammarErrors.length + typos.length + characterErrors.length;
  const criticalCount =
    structuralErrors.filter(e => e.severity === 'critical').length +
    characterErrors.filter(e => e.severity === 'critical').length;
  const highCount =
    structuralErrors.filter(e => e.severity === 'high').length +
    grammarErrors.filter(e => e.severity === 'high').length +
    characterErrors.filter(e => e.severity === 'high').length;

  let score = 100;
  score -= criticalCount * 10;
  score -= highCount * 5;
  score -= (totalIssues - criticalCount - highCount) * 1;
  score = Math.max(0, Math.min(100, score));

  return {
    scriptId: '',
    summary: summaryAndStats.summary,
    structuralErrors,
    grammarErrors,
    typos,
    characterErrors,
    sceneAnalysis,
    statistics: summaryAndStats.statistics,
    overallScore: score,
    createdAt: new Date().toISOString(),
  };
}

// ============================================================
// 1. Summary & Statistics
// ============================================================
async function analyzeSummaryAndStats(
  script: string,
  title: string
): Promise<{ summary: ScriptSummary; statistics: ScriptStatistics }> {
  const prompt = `당신은 전문 대본 분석가입니다. 아래 대본을 분석하여 요약 및 통계 정보를 JSON으로 반환해주세요.

대본 제목: "${title}"

대본 내용:
---
${script}
---

다음 JSON 형식으로 정확히 반환해주세요:
{
  "summary": {
    "title": "${title}",
    "genre": "분석된 장르 (예: 드라마, 코미디, 스릴러, 로맨스, SF 등)",
    "totalScenes": 씬 개수(숫자),
    "totalCharacters": 등장인물 수(숫자),
    "estimatedReadingTime": "약 N분",
    "synopsis": "대본 전체 줄거리를 3-5문장으로 요약"
  },
  "statistics": {
    "totalWords": 총 단어수(숫자),
    "totalLines": 총 줄수(숫자),
    "totalScenes": 씬 개수(숫자),
    "totalCharacters": 등장인물 수(숫자),
    "dialoguePercentage": 대사 비율(0-100 숫자),
    "actionPercentage": 지문 비율(0-100 숫자),
    "averageSceneLength": 평균 씬 단어수(숫자),
    "longestScene": { "scene": 씬번호, "words": 단어수 },
    "shortestScene": { "scene": 씬번호, "words": 단어수 },
    "characterDialogueDistribution": [
      { "character": "인물이름", "percentage": 비율(숫자), "lineCount": 대사줄수(숫자) }
    ]
  }
}`;

  try {
    const raw = await callGemini(prompt);
    const data = JSON.parse(raw);
    return {
      summary: data.summary,
      statistics: data.statistics,
    };
  } catch (err) {
    console.error('Summary analysis error:', err);
    return {
      summary: {
        title,
        genre: '미분류',
        totalScenes: 0,
        totalCharacters: 0,
        estimatedReadingTime: '분석 실패',
        synopsis: 'LLM 분석 중 오류가 발생했습니다.',
      },
      statistics: {
        totalWords: 0,
        totalLines: 0,
        totalScenes: 0,
        totalCharacters: 0,
        dialoguePercentage: 0,
        actionPercentage: 0,
        averageSceneLength: 0,
        longestScene: { scene: 0, words: 0 },
        shortestScene: { scene: 0, words: 0 },
        characterDialogueDistribution: [],
      },
    };
  }
}

// ============================================================
// 2. Structural Errors
// ============================================================
async function analyzeStructural(script: string): Promise<StructuralError[]> {
  const prompt = `당신은 전문 대본 구조 분석가입니다. 아래 대본의 **구조적 오류**를 찾아주세요.

검토 항목:
- 씬 번호 순서가 맞지 않는 경우
- 씬 전환 지시어(CUT TO, DISSOLVE 등) 누락
- 불완전한 씬 (시작만 있고 내용이 없거나 너무 짧은 씬)
- 대본 형식 위반 (씬 헤딩 형식, 인물명 표기 등)
- 페이싱 문제 (너무 긴 씬, 너무 짧은 씬, 균형 문제)
- 플롯 구조 문제 (발단-전개-위기-절정-결말 흐름)
- 장면 전환의 논리적 연결이 어색한 부분

대본:
---
${script}
---

오류가 없으면 빈 배열 []을 반환하세요.
오류가 있으면 다음 JSON 배열 형식으로 반환하세요:
[
  {
    "type": "scene_order|missing_transition|incomplete_scene|format_violation|pacing_issue" 중 하나,
    "severity": "low|medium|high|critical" 중 하나,
    "location": "오류 위치 (예: 씬 3, 45번 줄 근처)",
    "description": "오류에 대한 상세한 한국어 설명",
    "suggestion": "구체적인 수정 제안",
    "context": "오류가 발생한 부분의 원문 인용"
  }
]`;

  try {
    const raw = await callGemini(prompt);
    const data = JSON.parse(raw);
    const arr = Array.isArray(data) ? data : [];
    return arr.map((e: Partial<StructuralError>) => ({
      id: uuidv4(),
      type: e.type || 'format_violation',
      severity: e.severity || 'medium',
      location: e.location || '',
      description: e.description || '',
      suggestion: e.suggestion || '',
      context: e.context || '',
    })) as StructuralError[];
  } catch (err) {
    console.error('Structural analysis error:', err);
    return [];
  }
}

// ============================================================
// 3. Grammar Errors
// ============================================================
async function analyzeGrammar(script: string): Promise<GrammarError[]> {
  const prompt = `당신은 전문 한국어 교정 전문가입니다. 아래 대본에서 **문법적 오류**를 모두 찾아주세요.

검토 항목:
- 맞춤법 오류
- 띄어쓰기 오류
- 문장 구조 오류 (주어-서술어 호응, 시제 불일치 등)
- 구두점 오류 (마침표, 쉼표, 느낌표, 물음표 등 오남용)
- 문체 불일치 (존칭/반말 혼용, 서술체 혼용)
- 중복 표현
- 어색한 표현 및 자연스러운 대안 제시

대본:
---
${script}
---

오류가 없으면 빈 배열 []을 반환하세요.
오류가 있으면 다음 JSON 배열 형식으로 반환하세요:
[
  {
    "type": "grammar|punctuation|style|redundancy|awkward_phrasing" 중 하나,
    "severity": "low|medium|high" 중 하나,
    "location": "오류 위치 (예: 15번 줄)",
    "original": "원문에서 오류가 있는 부분 인용",
    "suggestion": "수정된 문장 또는 표현",
    "explanation": "왜 오류인지, 어떤 문법 규칙에 위반되는지 상세 설명"
  }
]`;

  try {
    const raw = await callGemini(prompt);
    const data = JSON.parse(raw);
    const arr = Array.isArray(data) ? data : [];
    return arr.map((e: Partial<GrammarError>) => ({
      id: uuidv4(),
      type: e.type || 'grammar',
      severity: e.severity || 'medium',
      location: e.location || '',
      original: e.original || '',
      suggestion: e.suggestion || '',
      explanation: e.explanation || '',
    })) as GrammarError[];
  } catch (err) {
    console.error('Grammar analysis error:', err);
    return [];
  }
}

// ============================================================
// 4. Typos
// ============================================================
async function analyzeTypos(script: string): Promise<Typo[]> {
  const prompt = `당신은 전문 교정 교열 전문가입니다. 아래 대본에서 **오타**를 모두 찾아주세요.

검토 항목:
- 한국어 맞춤법 오타 (예: "됬" → "됐", "몇일" → "며칠")
- 영어 오타
- 단어 반복 (같은 단어가 연속으로 나오는 경우)
- 인물 이름 오타 (같은 인물의 이름이 다르게 표기된 경우)
- 잘못된 조사 사용

대본:
---
${script}
---

오타가 없으면 빈 배열 []을 반환하세요.
오타가 있으면 다음 JSON 배열 형식으로 반환하세요:
[
  {
    "location": "오타 위치 (예: 12번 줄)",
    "original": "오타가 있는 원문",
    "correction": "올바른 표기",
    "context": "오타가 포함된 문장 전체"
  }
]`;

  try {
    const raw = await callGemini(prompt);
    const data = JSON.parse(raw);
    const arr = Array.isArray(data) ? data : [];
    return arr.map((e: Partial<Typo>) => ({
      id: uuidv4(),
      location: e.location || '',
      original: e.original || '',
      correction: e.correction || '',
      context: e.context || '',
    }));
  } catch (err) {
    console.error('Typo analysis error:', err);
    return [];
  }
}

// ============================================================
// 5. Character Consistency
// ============================================================
async function analyzeCharacters(script: string): Promise<CharacterError[]> {
  const prompt = `당신은 전문 대본 캐릭터 분석가입니다. 아래 대본에서 **등장인물 관련 오류**를 찾아주세요.

검토 항목:
- 인물의 성격/행동이 설정과 모순되는 경우 (예: 소심한 인물이 갑자기 폭력적으로 변함)
- 인물의 동기가 불분명한 행동
- 연속성 오류 (이전 씬에서 떠난 인물이 설명 없이 다시 등장하는 등)
- 대사가 인물의 성격/배경에 맞지 않는 경우 (예: 어린이가 성인 어투 사용)
- 인물 설명/묘사가 씬마다 달라지는 경우 (나이, 외모, 직업 등)
- 인물 간 관계 설정의 모순

각 오류에 대해 **반드시 대본에서 근거가 되는 텍스트를 인용**하여 evidence로 제시해주세요.

대본:
---
${script}
---

오류가 없으면 빈 배열 []을 반환하세요.
오류가 있으면 다음 JSON 배열 형식으로 반환하세요:
[
  {
    "characterName": "해당 인물 이름",
    "type": "inconsistent_behavior|missing_motivation|continuity_error|dialogue_mismatch|description_conflict" 중 하나,
    "severity": "low|medium|high|critical" 중 하나,
    "location": "오류 위치 (예: 씬 5, 78번 줄 근처)",
    "description": "오류에 대한 상세한 설명",
    "evidence": "대본에서 오류의 근거가 되는 부분을 직접 인용. 모순되는 두 부분을 모두 인용할 것",
    "suggestion": "구체적인 수정 제안"
  }
]`;

  try {
    const raw = await callGemini(prompt);
    const data = JSON.parse(raw);
    const arr = Array.isArray(data) ? data : [];
    return arr.map((e: Partial<CharacterError>) => ({
      id: uuidv4(),
      characterName: e.characterName || '',
      type: e.type || 'inconsistent_behavior',
      severity: e.severity || 'medium',
      location: e.location || '',
      description: e.description || '',
      evidence: e.evidence || '',
      suggestion: e.suggestion || '',
    })) as CharacterError[];
  } catch (err) {
    console.error('Character analysis error:', err);
    return [];
  }
}

// ============================================================
// 6. Scene Analysis
// ============================================================
async function analyzeScenes(script: string): Promise<SceneAnalysis[]> {
  const prompt = `당신은 전문 대본 분석가입니다. 아래 대본의 각 씬을 분석해주세요.

대본:
---
${script}
---

각 씬에 대해 다음 JSON 배열 형식으로 반환하세요:
[
  {
    "sceneNumber": 씬 번호(숫자),
    "title": "씬 헤딩 전체 텍스트",
    "location": "장소",
    "characters": ["등장인물1", "등장인물2"],
    "dialogueRatio": 대사 비율(0-100 숫자),
    "actionRatio": 지문 비율(0-100 숫자),
    "wordCount": 씬 내 단어 수(숫자),
    "mood": "씬의 분위기 (예: 긴장감, 로맨틱, 유머러스, 슬픔, 평화로움 등)",
    "issues": ["이 씬에서 발견된 문제점들을 문자열 배열로. 없으면 빈 배열"]
  }
]

씬을 구분할 수 없는 경우 전체를 하나의 씬으로 분석하세요.`;

  try {
    const raw = await callGemini(prompt);
    const data = JSON.parse(raw);
    const arr = Array.isArray(data) ? data : [];
    return arr.map((e: Partial<SceneAnalysis>) => ({
      sceneNumber: e.sceneNumber || 1,
      title: e.title || '',
      location: e.location || '',
      characters: e.characters || [],
      dialogueRatio: e.dialogueRatio || 0,
      actionRatio: e.actionRatio || 0,
      wordCount: e.wordCount || 0,
      mood: e.mood || '—',
      issues: e.issues || [],
    }));
  } catch (err) {
    console.error('Scene analysis error:', err);
    return [];
  }
}
