import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getScriptsByUser } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id || '';
    const scripts = getScriptsByUser(userId);

    return NextResponse.json({
      scripts: scripts.map(s => ({
        id: s.id,
        title: s.title,
        fileName: s.fileName,
        fileType: s.fileType,
        uploadedAt: s.uploadedAt,
        analyzedAt: s.analyzedAt,
        status: s.status,
      })),
    });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
