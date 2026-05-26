import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const teacher = db.prepare('SELECT * FROM teachers WHERE username = ?').get(username) as any;

    if (!teacher) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, teacher.password);

    if (!isValid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      teacher: { id: teacher.id, username: teacher.username }
    });
  } catch (error) {
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}