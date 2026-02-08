'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import ScoreRing from '@/components/ScoreRing';
import StatCard from '@/components/StatCard';
import ErrorCard from '@/components/ErrorCard';
import { AnalysisResult } from '@/types';
import { exportToPdf } from '@/lib/pdfExport';

type TabType = 'overview' | 'structural' | 'grammar' | 'typos' | 'characters' | 'scenes' | 'stats';

interface ScriptData {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  status: string;
  uploadedAt: string;
  analyzedAt?: string;
  content: string;
}

export default function ScriptDashboard() {
  const params = useParams();
  const scriptId = params.id as string;

  const [script, setScript] = useState<ScriptData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/scripts/${scriptId}`);
      if (res.ok) {
        const data = await res.json();
        setScript(data.script);
        setAnalysis(data.analysis || null);
      } else {
        setError('대본을 불러올 수 없습니다.');
      }
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [scriptId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const res = await fetch(`/api/analyze/${scriptId}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis);
        setScript(prev => prev ? { ...prev, status: 'analyzed', analyzedAt: new Date().toISOString() } : null);
      } else {
        const data = await res.json();
        setError(data.error || '분석 중 오류가 발생했습니다.');
      }
    } catch {
      setError('분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExportPdf = () => {
    if (analysis && script) {
      exportToPdf(analysis, script.title);
    }
  };

  const filterBySeverity = <T extends { severity: string }>(items: T[]): T[] => {
    if (severityFilter === 'all') return items;
    return items.filter(item => item.severity === severityFilter);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="w-12 h-12 text-blue-400 animate-spin-slow mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          <p className="text-slate-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error && !script) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (!script) return null;

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'overview', label: '개요' },
    { key: 'structural', label: '구조 오류', count: analysis?.structuralErrors.length },
    { key: 'grammar', label: '문법 오류', count: analysis?.grammarErrors.length },
    { key: 'typos', label: '오타', count: analysis?.typos.length },
    { key: 'characters', label: '인물 일관성', count: analysis?.characterErrors.length },
    { key: 'scenes', label: '씬 분석', count: analysis?.sceneAnalysis.length },
    { key: 'stats', label: '통계' },
  ];

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{script.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-slate-400">{script.fileName}</span>
            <span className="text-xs text-slate-500">
              업로드: {new Date(script.uploadedAt).toLocaleDateString('ko-KR')}
            </span>
            {script.analyzedAt && (
              <span className="text-xs text-slate-500">
                분석: {new Date(script.analyzedAt).toLocaleDateString('ko-KR')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {analysis && (
            <button onClick={handleExportPdf} className="btn-secondary flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              PDF 다운로드
            </button>
          )}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {analyzing ? (
              <>
                <svg className="w-4 h-4 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                분석 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                {analysis ? '재분석' : '분석 시작'}
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300 mb-6">
          {error}
        </div>
      )}

      {/* Pre-analysis state */}
      {!analysis && !analyzing && (
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="w-24 h-24 text-slate-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
          </svg>
          <h2 className="text-xl font-semibold text-slate-400 mb-2">분석 대기 중</h2>
          <p className="text-slate-500 mb-6">상단의 &quot;분석 시작&quot; 버튼을 클릭하여 대본 검토를 시작하세요.</p>
          <button onClick={handleAnalyze} className="btn-primary text-lg px-8 py-3">
            분석 시작
          </button>
        </div>
      )}

      {/* Analyzing state */}
      {analyzing && (
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="w-16 h-16 text-blue-400 animate-spin-slow mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          <h2 className="text-xl font-semibold mb-2">대본 분석 중...</h2>
          <p className="text-slate-400">구조, 문법, 오타, 인물 일관성을 검토하고 있습니다.</p>
        </div>
      )}

      {/* Analysis results */}
      {analysis && !analyzing && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-700 mb-6 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.key ? 'tab-active' : 'tab-inactive'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Severity filter (for error tabs) */}
          {['structural', 'grammar', 'characters'].includes(activeTab) && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-slate-500">심각도:</span>
              {['all', 'critical', 'high', 'medium', 'low'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                    severityFilter === sev
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {sev === 'all' ? '전체' : sev === 'critical' ? '심각' : sev === 'high' ? '높음' : sev === 'medium' ? '보통' : '낮음'}
                </button>
              ))}
            </div>
          )}

          {/* Tab Content */}
          <div className="animate-fade-in">
            {activeTab === 'overview' && <OverviewTab analysis={analysis} />}
            {activeTab === 'structural' && <StructuralTab errors={filterBySeverity(analysis.structuralErrors)} />}
            {activeTab === 'grammar' && <GrammarTab errors={filterBySeverity(analysis.grammarErrors)} />}
            {activeTab === 'typos' && <TyposTab typos={analysis.typos} />}
            {activeTab === 'characters' && <CharactersTab errors={filterBySeverity(analysis.characterErrors)} />}
            {activeTab === 'scenes' && <ScenesTab scenes={analysis.sceneAnalysis} />}
            {activeTab === 'stats' && <StatsTab stats={analysis.statistics} />}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Overview Tab
// ============================================================
function OverviewTab({ analysis }: { analysis: AnalysisResult }) {
  const totalErrors =
    analysis.structuralErrors.length +
    analysis.grammarErrors.length +
    analysis.typos.length +
    analysis.characterErrors.length;

  const criticalErrors =
    analysis.structuralErrors.filter(e => e.severity === 'critical').length +
    analysis.characterErrors.filter(e => e.severity === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Score + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card flex flex-col items-center justify-center">
          <ScoreRing score={analysis.overallScore} size={140} />
          <p className="text-sm text-slate-400 mt-4">종합 점수</p>
        </div>

        <div className="lg:col-span-2 card">
          <h3 className="font-semibold mb-3">대본 요약</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">제목</p>
              <p className="text-sm">{analysis.summary.title}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">예상 읽기 시간</p>
              <p className="text-sm">{analysis.summary.estimatedReadingTime}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">총 씬 수</p>
              <p className="text-sm">{analysis.summary.totalScenes}개</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">등장인물 수</p>
              <p className="text-sm">{analysis.summary.totalCharacters}명</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-500 mb-1">시놉시스</p>
            <p className="text-sm text-slate-300 leading-relaxed">{analysis.summary.synopsis}</p>
          </div>
        </div>
      </div>

      {/* Error summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="구조 오류"
          value={analysis.structuralErrors.length}
          color="text-red-400"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
          }
        />
        <StatCard
          label="문법 오류"
          value={analysis.grammarErrors.length}
          color="text-yellow-400"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          }
        />
        <StatCard
          label="오타"
          value={analysis.typos.length}
          color="text-orange-400"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          }
        />
        <StatCard
          label="인물 오류"
          value={analysis.characterErrors.length}
          color="text-purple-400"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          }
        />
      </div>

      {/* Quick insights */}
      <div className="card">
        <h3 className="font-semibold mb-4">검토 요약</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
            <p className="text-sm text-slate-300">
              총 <span className="font-semibold text-white">{totalErrors}개</span>의 검토 항목이 발견되었습니다.
              {criticalErrors > 0 && (
                <span className="text-red-400"> 그 중 {criticalErrors}개는 심각한 수준입니다.</span>
              )}
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
            <p className="text-sm text-slate-300">
              대사 비율 <span className="font-semibold text-white">{analysis.statistics.dialoguePercentage}%</span>,
              지문 비율 <span className="font-semibold text-white">{analysis.statistics.actionPercentage}%</span>
              {analysis.statistics.dialoguePercentage > 70
                ? ' — 대사 비중이 높은 편입니다.'
                : analysis.statistics.dialoguePercentage < 30
                ? ' — 지문 비중이 높은 편입니다.'
                : ' — 균형 잡힌 구성입니다.'}
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
            <p className="text-sm text-slate-300">
              총 <span className="font-semibold text-white">{analysis.statistics.totalCharacters}명</span>의 등장인물이 감지되었으며,
              평균 씬 길이는 <span className="font-semibold text-white">{analysis.statistics.averageSceneLength}단어</span>입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Structural Errors Tab
// ============================================================
function StructuralTab({ errors }: { errors: AnalysisResult['structuralErrors'] }) {
  if (errors.length === 0) {
    return <EmptyState message="구조 오류가 발견되지 않았습니다." />;
  }

  return (
    <div className="space-y-3">
      {errors.map(err => (
        <ErrorCard
          key={err.id}
          severity={err.severity}
          type={err.type}
          location={err.location}
          description={err.description}
          suggestion={err.suggestion}
          context={err.context}
        />
      ))}
    </div>
  );
}

// ============================================================
// Grammar Errors Tab
// ============================================================
function GrammarTab({ errors }: { errors: AnalysisResult['grammarErrors'] }) {
  if (errors.length === 0) {
    return <EmptyState message="문법 오류가 발견되지 않았습니다." />;
  }

  return (
    <div className="space-y-3">
      {errors.map(err => (
        <ErrorCard
          key={err.id}
          severity={err.severity}
          type={err.type}
          location={err.location}
          description={err.explanation}
          original={err.original}
          correction={err.suggestion}
          suggestion={err.suggestion}
        />
      ))}
    </div>
  );
}

// ============================================================
// Typos Tab
// ============================================================
function TyposTab({ typos }: { typos: AnalysisResult['typos'] }) {
  if (typos.length === 0) {
    return <EmptyState message="오타가 발견되지 않았습니다." />;
  }

  return (
    <div className="space-y-3">
      {typos.map(typo => (
        <div key={typo.id} className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="badge bg-orange-900/50 text-orange-300 border border-orange-700">오타</span>
            <span className="text-xs text-slate-500">{typo.location}</span>
          </div>
          <div className="text-sm mb-2">
            <span className="text-red-400 line-through font-medium">{typo.original}</span>
            <span className="text-slate-500 mx-2">&rarr;</span>
            <span className="text-green-400 font-medium">{typo.correction}</span>
          </div>
          {typo.context && (
            <div className="p-2 bg-slate-700/50 rounded text-xs text-slate-400 font-mono">
              {typo.context}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Characters Tab
// ============================================================
function CharactersTab({ errors }: { errors: AnalysisResult['characterErrors'] }) {
  if (errors.length === 0) {
    return <EmptyState message="인물 일관성 오류가 발견되지 않았습니다." />;
  }

  return (
    <div className="space-y-3">
      {errors.map(err => (
        <ErrorCard
          key={err.id}
          severity={err.severity}
          type={err.type}
          location={err.location}
          description={`[${err.characterName}] ${err.description}`}
          suggestion={err.suggestion}
          evidence={err.evidence}
        />
      ))}
    </div>
  );
}

// ============================================================
// Scenes Tab
// ============================================================
function ScenesTab({ scenes }: { scenes: AnalysisResult['sceneAnalysis'] }) {
  if (scenes.length === 0) {
    return <EmptyState message="씬이 감지되지 않았습니다." />;
  }

  return (
    <div className="space-y-4">
      {scenes.map(scene => (
        <div key={scene.sceneNumber} className="card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium">씬 {scene.sceneNumber}</h4>
              <p className="text-sm text-slate-400">{scene.title}</p>
            </div>
            <span className="text-xs text-slate-500">{scene.wordCount}단어</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="bg-slate-700/40 rounded-lg p-2.5 text-center">
              <p className="text-xs text-slate-500">장소</p>
              <p className="text-sm truncate">{scene.location || '—'}</p>
            </div>
            <div className="bg-slate-700/40 rounded-lg p-2.5 text-center">
              <p className="text-xs text-slate-500">등장인물</p>
              <p className="text-sm">{scene.characters.length}명</p>
            </div>
            <div className="bg-slate-700/40 rounded-lg p-2.5 text-center">
              <p className="text-xs text-slate-500">대사 비율</p>
              <p className="text-sm">{scene.dialogueRatio}%</p>
            </div>
            <div className="bg-slate-700/40 rounded-lg p-2.5 text-center">
              <p className="text-xs text-slate-500">지문 비율</p>
              <p className="text-sm">{scene.actionRatio}%</p>
            </div>
          </div>

          {/* Dialogue/Action bar */}
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${scene.dialogueRatio}%` }}
            />
          </div>

          {scene.characters.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {scene.characters.map(char => (
                <span key={char} className="text-xs px-2 py-0.5 bg-slate-700 rounded-full text-slate-300">
                  {char}
                </span>
              ))}
            </div>
          )}

          {scene.issues.length > 0 && (
            <div className="mt-2 space-y-1">
              {scene.issues.map((issue, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-yellow-400">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01"/>
                  </svg>
                  {issue}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Statistics Tab
// ============================================================
function StatsTab({ stats }: { stats: AnalysisResult['statistics'] }) {
  return (
    <div className="space-y-6">
      {/* Basic stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="총 단어 수" value={stats.totalWords.toLocaleString()} color="text-blue-400"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
        />
        <StatCard label="총 줄 수" value={stats.totalLines.toLocaleString()} color="text-green-400"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>}
        />
        <StatCard label="총 씬 수" value={stats.totalScenes} color="text-purple-400"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2m0 2a2 2 0 100 4m0-4a2 2 0 110 4m0-4v2m0 6V8m10 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V2"/></svg>}
        />
        <StatCard label="등장인물 수" value={stats.totalCharacters} color="text-orange-400"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>}
        />
      </div>

      {/* Dialogue vs Action */}
      <div className="card">
        <h3 className="font-semibold mb-4">대사 vs 지문 비율</h3>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-sm text-slate-300">대사 {stats.dialoguePercentage}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-500" />
            <span className="text-sm text-slate-300">지문 {stats.actionPercentage}%</span>
          </div>
        </div>
        <div className="w-full h-6 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${stats.dialoguePercentage}%` }} />
        </div>
      </div>

      {/* Scene length */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-3">씬 길이</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-sm text-slate-400">평균 씬 길이</span>
              <span className="text-sm font-medium">{stats.averageSceneLength}단어</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-sm text-slate-400">가장 긴 씬</span>
              <span className="text-sm font-medium">씬 {stats.longestScene.scene} ({stats.longestScene.words}단어)</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-sm text-slate-400">가장 짧은 씬</span>
              <span className="text-sm font-medium">씬 {stats.shortestScene.scene} ({stats.shortestScene.words}단어)</span>
            </div>
          </div>
        </div>

        {/* Character distribution */}
        <div className="card">
          <h3 className="font-semibold mb-3">등장인물 대사 분포</h3>
          {stats.characterDialogueDistribution.length === 0 ? (
            <p className="text-sm text-slate-500">등장인물 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {stats.characterDialogueDistribution.slice(0, 8).map((char, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{char.character}</span>
                    <span className="text-slate-500">{char.percentage}% ({char.lineCount}줄)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${char.percentage}%`,
                        backgroundColor: `hsl(${(i * 45 + 200) % 360}, 70%, 55%)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <svg className="w-16 h-16 text-green-500/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p className="text-slate-400">{message}</p>
    </div>
  );
}
