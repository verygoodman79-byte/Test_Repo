'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

interface ScriptItem {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  analyzedAt?: string;
  status: string;
}

export default function Sidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const fetchScripts = useCallback(async () => {
    try {
      const res = await fetch('/api/scripts');
      if (res.ok) {
        const data = await res.json();
        setScripts(data.scripts);
      }
    } catch (err) {
      console.error('Failed to fetch scripts:', err);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchScripts();
    }
  }, [session, fetchScripts]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        await fetchScripts();
        router.push(`/dashboard/${data.script.id}`);
      } else {
        const err = await res.json();
        alert(err.error || '업로드 실패');
      }
    } catch {
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('이 리포트를 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/scripts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchScripts();
        if (pathname === `/dashboard/${id}`) {
          router.push('/dashboard');
        }
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />;
      case 'analyzing':
        return <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block animate-pulse" />;
      case 'analyzed':
        return <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />;
      case 'error':
        return <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />;
      default:
        return null;
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return (
          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
          </svg>
        );
      case 'txt':
        return (
          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
          </svg>
        );
      case 'docx':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
          </svg>
        );
      default:
        return null;
    }
  };

  if (collapsed) {
    return (
      <div className="w-16 bg-slate-900 border-r border-slate-700 flex flex-col items-center py-4 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 hover:bg-slate-800 rounded-lg mb-4"
          title="메뉴 펼치기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
          </svg>
        </button>
        <label className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer" title="리포트 업로드">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          <input type="file" className="hidden" accept=".pdf,.txt,.docx,.doc" onChange={handleUpload} />
        </label>
      </div>
    );
  }

  return (
    <div className="w-72 bg-slate-900 border-r border-slate-700 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h1
            className="text-lg font-bold text-blue-400 cursor-pointer"
            onClick={() => router.push('/dashboard')}
          >
            Script Review
          </h1>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 hover:bg-slate-800 rounded-lg"
            title="메뉴 접기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
            </svg>
          </button>
        </div>

        {/* Upload button */}
        <label className={`flex items-center justify-center gap-2 w-full btn-primary cursor-pointer text-sm ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {isUploading ? (
            <>
              <svg className="w-4 h-4 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              업로드 중...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              리포트 업로드
            </>
          )}
          <input
            type="file"
            className="hidden"
            accept=".pdf,.txt,.docx,.doc"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
        <p className="text-xs text-slate-500 mt-2 text-center">PDF, TXT, DOCX 지원</p>
      </div>

      {/* Script list */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="px-2 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
          내 리포트 ({scripts.length})
        </div>

        {scripts.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500 text-sm">
            등록된 리포트가 없습니다.
            <br />
            리포트를 업로드해 주세요.
          </div>
        ) : (
          <div className="space-y-1">
            {scripts.map(script => (
              <div
                key={script.id}
                onClick={() => router.push(`/dashboard/${script.id}`)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                  pathname === `/dashboard/${script.id}`
                    ? 'bg-blue-600/20 border border-blue-500/30'
                    : 'hover:bg-slate-800 border border-transparent'
                }`}
              >
                {getFileIcon(script.fileType)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(script.status)}
                    <span className="text-sm truncate">{script.title}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(script.uploadedAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDelete(script.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                  title="삭제"
                >
                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User info */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
            {session?.user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{session?.user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-1.5 hover:bg-slate-800 rounded-lg"
            title="로그아웃"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
