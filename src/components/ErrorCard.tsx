'use client';

import { useState } from 'react';

interface ErrorCardProps {
  severity: string;
  type: string;
  location: string;
  description: string;
  suggestion?: string;
  context?: string;
  evidence?: string;
  original?: string;
  correction?: string;
}

export default function ErrorCard({
  severity,
  type,
  location,
  description,
  suggestion,
  context,
  evidence,
  original,
  correction,
}: ErrorCardProps) {
  const [expanded, setExpanded] = useState(false);

  const severityConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
    critical: { bg: 'bg-red-900/20', border: 'border-red-700/50', text: 'text-red-300', label: '심각' },
    high: { bg: 'bg-orange-900/20', border: 'border-orange-700/50', text: 'text-orange-300', label: '높음' },
    medium: { bg: 'bg-yellow-900/20', border: 'border-yellow-700/50', text: 'text-yellow-300', label: '보통' },
    low: { bg: 'bg-green-900/20', border: 'border-green-700/50', text: 'text-green-300', label: '낮음' },
  };

  const config = severityConfig[severity] || severityConfig.medium;

  const typeLabels: Record<string, string> = {
    missing_section: '섹션 누락',
    section_order: '섹션 순서',
    incomplete_section: '불완전한 섹션',
    format_violation: '형식 위반',
    coherence_issue: '일관성 문제',
    grammar: '문법',
    punctuation: '구두점',
    style: '문체',
    redundancy: '중복 표현',
    awkward_phrasing: '어색한 표현',
    inconsistent_description: '설명 불일치',
    missing_info: '정보 누락',
    continuity_error: '연속성 오류',
    summary_mismatch: '요약 불일치',
    description_conflict: '설명 충돌',
  };

  return (
    <div
      className={`${config.bg} border ${config.border} rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-opacity-80`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`badge badge-${severity}`}>
              {config.label}
            </span>
            <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
              {typeLabels[type] || type}
            </span>
            <span className="text-xs text-slate-500">{location}</span>
          </div>
          <p className="text-sm text-slate-200">{description}</p>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2 animate-fade-in">
          {original && correction && (
            <div className="text-sm">
              <span className="text-red-400 line-through">{original}</span>
              <span className="text-slate-500 mx-2">&rarr;</span>
              <span className="text-green-400">{correction}</span>
            </div>
          )}
          {suggestion && (
            <div className="text-sm">
              <span className="text-blue-400 font-medium">제안: </span>
              <span className="text-slate-300">{suggestion}</span>
            </div>
          )}
          {evidence && (
            <div className="text-sm">
              <span className="text-purple-400 font-medium">근거: </span>
              <span className="text-slate-300">{evidence}</span>
            </div>
          )}
          {context && (
            <div className="mt-2 p-2 bg-slate-800/80 rounded text-xs text-slate-400 font-mono whitespace-pre-wrap">
              {context}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
