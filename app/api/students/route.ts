import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const students = db.prepare(`
      SELECT s.*,
        GROUP_CONCAT(json_object('subject', sc.subject, 'score', sc.score, 'id', sc.id)) as scores
      FROM students s
      LEFT JOIN scores sc ON s.id = sc.student_id
      GROUP BY s.id
      ORDER BY s.class, s.student_id
    `).all();

    const parsed = students.map((s: any) => ({
      ...s,
      studentId: s.student_id,
      student_id: undefined,
      scores: s.scores ? JSON.parse(`[${s.scores}]`) : []
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: '获取学生列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, class: className, studentId, gender } = await request.json();

    const result = db.prepare(`
      INSERT INTO students (name, class, student_id, gender)
      VALUES (?, ?, ?, ?)
    `).run(name, className, studentId, gender);

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return NextResponse.json({ error: '学号已存在' }, { status: 400 });
    }
    return NextResponse.json({ error: '添加学生失败' }, { status: 500 });
  }
}