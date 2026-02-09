// ============================================================
// Report Analysis Engine - Gemini 2.5 Flash LLM-based
// Analyzes script analysis reports (작품제목/캐릭터 요약/짧은 요약/중간 요약)
// ============================================================
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import {
  AnalysisResult,
  StructuralError,
  GrammarError,
  Typo,
  CharacterError,
  SectionAnalysis,
  ReportStatistics,
  ReportSummary,
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
// Truncate report if too long for LLM context
// ============================================================
function truncateReport(content: string, maxChars: number = 80000): string {
  if (content.length <= maxChars) return content;
  const half = Math.floor(maxChars / 2);
  return (
    content.slice(0, half) +
    '\n\n[... 중략 (리포트가 너무 길어 일부 생략됨) ...]\n\n' +
    content.slice(-half)
  );
}

// ============================================================
// Main Analysis - Orchestrates all LLM calls
// ============================================================
export async function analyzeScript(content: string, title: string): Promise<AnalysisResult> {
  const reportText = truncateReport(content);

  // Run all analyses in parallel for speed
  const [
    summaryAndStats,
    structuralErrors,
    grammarErrors,
    typos,
    characterErrors,
    sectionAnalysis,
  ] = await Promise.all([
    analyzeSummaryAndStats(reportText, title),
    analyzeStructural(reportText),
    analyzeGrammar(reportText),
    analyzeTypos(reportText),
    analyzeCharacters(reportText),
    analyzeSections(reportText),
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
    sectionAnalysis,
    statistics: summaryAndStats.statistics,
    overallScore: score,
    createdAt: new Date().toISOString(),
  };
}

// ============================================================
// 1. Summary & Statistics
// ============================================================
async function analyzeSummaryAndStats(
  report: string,
  title: string
): Promise<{ summary: ReportSummary; statistics: ReportStatistics }> {
  const prompt = `당신은 전문 대본 분석 리포트 검토 전문가입니다. 아래 리포트를 검토하여 요약 및 통계 정보를 JSON으로 반환해주세요.

이 리포트는 **대본 분석 리포트**로서, 일반적으로 다음 섹션으로 구성됩니다:
- 작품제목
- 캐릭터 요약
- 짧은 요약
- 중간 요약

리포트 제목: "${title}"

리포트 내용:
---
${report}
---

다음 JSON 형식으로 정확히 반환해주세요:
{
  "summary": {
    "title": "${title}",
    "genre": "분석된 장르 (예: 드라마, 코미디, 스릴러, 로맨스, SF 등)",
    "totalSections": 리포트의 섹션 수(숫자),
    "totalCharacters": 리포트에서 언급된 등장인물 수(숫자),
    "estimatedReadingTime": "약 N분",
    "synopsis": "리포트 전체 내용을 3-5문장으로 요약"
  },
  "statistics": {
    "totalWords": 총 단어수(숫자),
    "totalLines": 총 줄수(숫자),
    "totalSections": 섹션 수(숫자),
    "totalCharacters": 등장인물 수(숫자),
    "sectionWordCounts": [
      { "section": "섹션 이름", "words": 단어수(숫자) }
    ],
    "characterMentionDistribution": [
      { "character": "인물이름", "percentage": 비율(숫자), "mentionCount": 언급횟수(숫자) }
    ],
    "shortSummaryLength": 짧은 요약 단어수(숫자),
    "mediumSummaryLength": 중간 요약 단어수(숫자)
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
        totalSections: 0,
        totalCharacters: 0,
        estimatedReadingTime: '분석 실패',
        synopsis: 'LLM 분석 중 오류가 발생했습니다.',
      },
      statistics: {
        totalWords: 0,
        totalLines: 0,
        totalSections: 0,
        totalCharacters: 0,
        sectionWordCounts: [],
        characterMentionDistribution: [],
        shortSummaryLength: 0,
        mediumSummaryLength: 0,
      },
    };
  }
}

// ============================================================
// 2. Structural Errors
// ============================================================
async function analyzeStructural(report: string): Promise<StructuralError[]> {
  const prompt = `당신은 전문 대본 분석 리포트 구조 검토 전문가입니다. 아래 대본 분석 리포트의 **구조적 오류**를 찾아주세요.

이 리포트는 **대본 분석 리포트**이며, 일반적으로 다음 섹션들이 포함되어야 합니다:
- 작품제목
- 캐릭터 요약
- 짧은 요약
- 중간 요약

검토 항목:
- 필수 섹션 누락 (작품제목, 캐릭터 요약, 짧은 요약, 중간 요약 중 빠진 것)
- 섹션 순서가 맞지 않는 경우
- 불완전한 섹션 (내용이 없거나 너무 짧은 섹션)
- 리포트 형식 위반 (제목 형식, 구분자 등)
- 짧은 요약과 중간 요약 간의 내용 일관성 문제
- 캐릭터 요약과 본문 내용 간의 일치 여부

리포트:
---
${report}
---

오류가 없으면 빈 배열 []을 반환하세요.
오류가 있으면 다음 JSON 배열 형식으로 반환하세요:
[
  {
    "type": "missing_section|section_order|incomplete_section|format_violation|coherence_issue" 중 하나,
    "severity": "low|medium|high|critical" 중 하나,
    "location": "오류 위치 (예: 캐릭터 요약 섹션, 15번 줄 근처)",
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
async function analyzeGrammar(report: string): Promise<GrammarError[]> {
  const prompt = `당신은 전문 한국어 교정 전문가입니다. 아래 대본 분석 리포트에서 **문법적 오류**를 모두 찾아주세요.

검토 항목:
- 맞춤법 오류
- 띄어쓰기 오류
- 문장 구조 오류 (주어-서술어 호응, 시제 불일치 등)
- 구두점 오류 (마침표, 쉼표, 느낌표, 물음표 등 오남용)
- 문체 불일치 (존칭/반말 혼용, 서술체 혼용)
- 중복 표현
- 어색한 표현 및 자연스러운 대안 제시

리포트:
---
${report}
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
async function analyzeTypos(report: string): Promise<Typo[]> {
  const prompt = `당신은 전문 교정 교열 전문가입니다. 아래 대본 분석 리포트에서 **오타**를 모두 찾아주세요.

검토 항목:
- 한국어 맞춤법 오타 (예: "됬" → "됐", "몇일" → "며칠")
- 영어 오타
- 단어 반복 (같은 단어가 연속으로 나오는 경우)
- 인물 이름 오타 (같은 인물의 이름이 다르게 표기된 경우)
- 잘못된 조사 사용

리포트:
---
${report}
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
async function analyzeCharacters(report: string): Promise<CharacterError[]> {
  const prompt = `당신은 전문 대본 분석 리포트 검토 전문가입니다. 아래 대본 분석 리포트에서 **등장인물 관련 오류**를 찾아주세요.

이 리포트에는 캐릭터 요약 섹션과 짧은/중간 요약 섹션이 있으며, 이들 간의 일관성을 검토해야 합니다.

검토 항목:
- 캐릭터 요약에서 설명된 인물의 성격/특징이 요약 본문과 모순되는 경우
- 인물 정보 누락 (캐릭터 요약에 있는 인물이 요약에 없거나 그 반대)
- 요약 간 연속성 오류 (짧은 요약과 중간 요약에서 인물의 행동/설명이 다른 경우)
- 캐릭터 요약과 본문 요약 간 설명 불일치 (나이, 직업, 성격 등)
- 인물 설명이 요약마다 달라지는 경우

각 오류에 대해 **반드시 리포트에서 근거가 되는 텍스트를 인용**하여 evidence로 제시해주세요.

리포트:
---
${report}
---

오류가 없으면 빈 배열 []을 반환하세요.
오류가 있으면 다음 JSON 배열 형식으로 반환하세요:
[
  {
    "characterName": "해당 인물 이름",
    "type": "inconsistent_description|missing_info|continuity_error|summary_mismatch|description_conflict" 중 하나,
    "severity": "low|medium|high|critical" 중 하나,
    "location": "오류 위치 (예: 캐릭터 요약 vs 중간 요약)",
    "description": "오류에 대한 상세한 설명",
    "evidence": "리포트에서 오류의 근거가 되는 부분을 직접 인용. 모순되는 두 부분을 모두 인용할 것",
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
      type: e.type || 'inconsistent_description',
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
// 6. Section Analysis
// ============================================================
async function analyzeSections(report: string): Promise<SectionAnalysis[]> {
  const prompt = `당신은 전문 대본 분석 리포트 검토 전문가입니다. 아래 대본 분석 리포트의 각 섹션을 분석해주세요.

이 리포트는 일반적으로 다음 섹션들로 구성됩니다:
- 작품제목
- 캐릭터 요약
- 짧은 요약
- 중간 요약

리포트:
---
${report}
---

각 섹션에 대해 다음 JSON 배열 형식으로 반환하세요:
[
  {
    "sectionNumber": 섹션 번호(숫자, 1부터 시작),
    "title": "섹션 제목 (예: 작품제목, 캐릭터 요약, 짧은 요약, 중간 요약)",
    "type": "작품제목|캐릭터 요약|짧은 요약|중간 요약|기타" 중 해당하는 것,
    "characters": ["이 섹션에서 언급된 인물1", "인물2"],
    "wordCount": 이 섹션의 단어 수(숫자),
    "quality": "이 섹션의 품질 평가 (예: 우수, 양호, 보통, 미흡, 부족)",
    "issues": ["이 섹션에서 발견된 문제점들을 문자열 배열로. 없으면 빈 배열"]
  }
]

섹션을 구분할 수 없는 경우 전체를 하나의 섹션으로 분석하세요.`;

  try {
    const raw = await callGemini(prompt);
    const data = JSON.parse(raw);
    const arr = Array.isArray(data) ? data : [];
    return arr.map((e: Partial<SectionAnalysis>) => ({
      sectionNumber: e.sectionNumber || 1,
      title: e.title || '',
      type: e.type || '기타',
      characters: e.characters || [],
      wordCount: e.wordCount || 0,
      quality: e.quality || '—',
      issues: e.issues || [],
    }));
  } catch (err) {
    console.error('Section analysis error:', err);
    return [];
  }
}
