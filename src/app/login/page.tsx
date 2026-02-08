'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">Script Review Agent</h1>
          <p className="text-slate-400">대본 검토 에이전트</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-6">로그인</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="비밀번호 입력"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            계정이 없으신가요?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
