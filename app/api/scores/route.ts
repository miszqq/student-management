import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const examId = searchParams.get('examId');

    if (type === 'byexam' && examId) {
      const scores = db.prepare(`
        SELECT s.id as student_id, s.name, s.class,
          json_group_array(json_object('subject', sc.subject, 'score', sc.score)) as subjects
        FROM students s
        LEFT JOIN scores sc ON s.id = sc.student_id AND sc.exam_id = ?
        GROUP BY s.id
        ORDER BY s.class, s.student_id
      `).all(Number(examId));
      return NextResponse.json(scores);
    }

    const scores = db.prepare(`
      SELECT s.id, s.name, s.class, s.student_id as studentId,
        e.name as exam_name, e.id as exam_id,
        json_group_array(json_object('subject', sc.subject, 'score', sc.score)) as subjects
      FROM students s
      LEFT JOIN scores sc ON s.id = sc.student_id
      LEFT JOIN exams e ON sc.exam_id = e.id
      GROUP BY s.id, sc.exam_id
      ORDER BY s.class, s.student_id
    `).all();

    return NextResponse.json(scores);
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, examId, subject, score } = await request.json();
    const existing = db.prepare('SELECT id FROM scores WHERE student_id = ? AND exam_id = ? AND subject = ?').get(studentId, examId, subject) as any;

    if (existing) {
      db.prepare('UPDATE scores SET score = ? WHERE id = ?').run(score, existing.id);
    } else {
      db.prepare('INSERT INTO scores (student_id, exam_id, subject, score) VALUES (?, ?, ?, ?)').run(studentId, examId, subject, score);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const examId = searchParams.get('examId');
    const subject = searchParams.get('subject');

    let query = 'DELETE FROM scores WHERE 1=1';
    const params: any[] = [];
    if (studentId) { query += ' AND student_id = ?'; params.push(studentId); }
    if (examId) { query += ' AND exam_id = ?'; params.push(examId); }
    if (subject) { query += ' AND subject = ?'; params.push(subject); }

    db.prepare(query).run(...params);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}