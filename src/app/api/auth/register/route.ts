import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getUserByEmail, createUser } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      email,
      name,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    createUser(user);

    return NextResponse.json(
      { message: '회원가입이 완료되었습니다.', userId: user.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
