import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getScriptById, updateScript, createAnalysis } from '@/lib/db';
import { analyzeScript } from '@/lib/analyzer';

export async function POST(
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

    // Update status to analyzing
    updateScript(params.id, { status: 'analyzing' });

    // Run analysis
    const result = analyzeScript(script.content, script.title);
    result.scriptId = params.id;

    // Save analysis
    createAnalysis(result);

    // Update script status
    updateScript(params.id, {
      status: 'analyzed',
      analyzedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      message: '분석이 완료되었습니다.',
      analysis: result,
    });
  } catch (err) {
    console.error('Analysis error:', err);
    updateScript(params.id, { status: 'error' });
    return NextResponse.json(
      { error: '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
