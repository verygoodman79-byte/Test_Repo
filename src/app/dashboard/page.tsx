'use client';

import { useSession } from 'next-auth/react';

export default function DashboardHome() {
  const { data: session } = useSession();

  return (
    <div className="p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          안녕하세요, {session?.user?.name || '사용자'}님
        </h1>
        <p className="text-slate-400 mb-8">분석 리포트를 업로드하여 자동 검토를 시작하세요.</p>

        {/* Guide cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
              </div>
              <h3 className="font-semibold">1. 리포트 업로드</h3>
            </div>
            <p className="text-sm text-slate-400">
              왼쪽 사이드바에서 &quot;리포트 업로드&quot; 버튼을 클릭하여 PDF, TXT, DOCX 형식의 분석 리포트를 업로드하세요.
            </p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
              </div>
              <h3 className="font-semibold">2. 자동 분석</h3>
            </div>
            <p className="text-sm text-slate-400">
              &quot;분석 시작&quot; 버튼을 클릭하면 리포트의 구조, 문법, 오타, 인물 일관성을 자동으로 검토합니다.
            </p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3 className="font-semibold">3. 대시보드 확인</h3>
            </div>
            <p className="text-sm text-slate-400">
              분석 결과를 대시보드에서 카테고리별로 확인하고, 상세한 오류 내용과 수정 제안을 검토하세요.
            </p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-600/20 rounded-lg">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <h3 className="font-semibold">4. PDF 다운로드</h3>
            </div>
            <p className="text-sm text-slate-400">
              분석 결과를 PDF로 다운로드하여 팀과 공유하거나 보관하세요.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="card">
          <h3 className="font-semibold mb-4 text-blue-400">검토 항목</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '🔍', title: '구조 검토', desc: '섹션 구성, 누락, 형식 일관성' },
              { icon: '📝', title: '문법 검토', desc: '맞춤법, 문장 구조, 문체 일관성' },
              { icon: '✏️', title: '오타 검토', desc: '단어 오타, 반복 단어, 띄어쓰기' },
              { icon: '👥', title: '인물 일관성', desc: '캐릭터 요약과 본문 간 일관성 검토' },
              { icon: '📊', title: '통계 분석', desc: '단어 수, 섹션별 길이, 인물 분포' },
              { icon: '📋', title: '섹션 분석', desc: '섹션별 품질 평가 및 문제점 분석' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
