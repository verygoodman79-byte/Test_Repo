import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getScriptById, deleteScript, getAnalysisByScriptId } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const script = getScriptById(params.id);
    if (!script) {
      return NextResponse.json({ error: '대본을 찾을 수 없습니다.' }, { status: 404 });
    }

    const userId = (session.user as { id?: string }).id || '';
    if (script.userId !== userId) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    const analysis = getAnalysisByScriptId(params.id);

    return NextResponse.json({ script, analysis });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const script = getScriptById(params.id);
    if (!script) {
      return NextResponse.json({ error: '대본을 찾을 수 없습니다.' }, { status: 404 });
    }

    const userId = (session.user as { id?: string }).id || '';
    if (script.userId !== userId) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    deleteScript(params.id);

    return NextResponse.json({ message: '대본이 삭제되었습니다.' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
