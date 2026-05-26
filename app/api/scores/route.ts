import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subject = searchParams.get('subject');

    let query = `
      SELECT s.id, s.name, s.class, s.student_id,
        json_object(
          '语文', (SELECT score FROM scores WHERE student_id = s.id AND subject = '语文'),
          '数学', (SELECT score FROM scores WHERE student_id = s.id AND subject = '数学'),
          '英语', (SELECT score FROM scores WHERE student_id = s.id AND subject = '英语'),
          '物理', (SELECT score FROM scores WHERE student_id = s.id AND subject = '物理'),
          '化学', (SELECT score FROM scores WHERE student_id = s.id AND subject = '化学'),
          '生物', (SELECT score FROM scores WHERE student_id = s.id AND subject = '生物')
        ) as scores
      FROM students s
      ORDER BY s.class, s.student_id
    `;

    const results = db.prepare(query).all().map((r: any) => ({
      ...r,
      studentId: r.student_id,
      student_id: undefined,
      scores: JSON.parse(r.scores),
      total: Object.values(JSON.parse(r.scores)).reduce((a: number, b: any) => a + (b || 0), 0)
    }));

    const withRank = results.map((r: any, i: number) => ({
      ...r,
      rank: i + 1
    }));

    return NextResponse.json(withRank);
  } catch (error) {
    return NextResponse.json({ error: '获取成绩失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, subject, score } = await request.json();

    db.prepare(`
      INSERT INTO scores (student_id, subject, score)
      VALUES (?, ?, ?)
      ON CONFLICT(student_id, subject) DO UPDATE SET score = excluded.score
    `).run(studentId, subject, score);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '保存成绩失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const subject = searchParams.get('subject');

    if (!studentId || !subject) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    db.prepare('DELETE FROM scores WHERE student_id = ? AND subject = ?').run(
      parseInt(studentId),
      subject
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '删除成绩失败' }, { status: 500 });
  }
}