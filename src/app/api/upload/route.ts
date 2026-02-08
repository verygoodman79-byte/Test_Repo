import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '@/lib/auth';
import { createScript } from '@/lib/db';
import { parseFile, getFileType } from '@/lib/fileParser';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '파일을 선택해주세요.' }, { status: 400 });
    }

    const fileType = getFileType(file.name);
    if (!['pdf', 'txt', 'docx'].includes(fileType)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다. PDF, TXT, DOCX 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const content = await parseFile(buffer, fileType);

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '파일에서 텍스트를 추출할 수 없습니다.' },
        { status: 400 }
      );
    }

    const userId = (session.user as { id?: string }).id || '';
    const scriptId = uuidv4();
    const title = file.name.replace(/\.[^.]+$/, '');

    const script = {
      id: scriptId,
      userId,
      title,
      fileName: file.name,
      fileType: fileType as 'pdf' | 'txt' | 'docx',
      content,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded' as const,
    };

    createScript(script);

    return NextResponse.json({
      message: '파일이 업로드되었습니다.',
      script: { id: scriptId, title, fileName: file.name, status: 'uploaded' },
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
