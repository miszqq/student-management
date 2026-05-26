import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const exams = db.prepare('SELECT * FROM exams ORDER BY created_at DESC').all();
    return NextResponse.json(exams);
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, grade, exam_date } = await request.json();
    const result = db.prepare('INSERT INTO exams (name, grade, exam_date) VALUES (?, ?, ?)').run(name, grade || '', exam_date || '');
    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    return NextResponse.json({ error: '创建考试失败' }, { status: 500 });
  }
}