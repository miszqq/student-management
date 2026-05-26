import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const examId = searchParams.get('examId');
    const grade = searchParams.get('grade');

    let where = '';
    const params: any[] = [];
    if (examId) { where += ' AND sc.exam_id = ?'; params.push(examId); }

    let gradeJoin = '';
    if (grade) { gradeJoin = ' JOIN students s2 ON s.id = s2.id'; where += ' AND s2.grade = ?'; params.push(grade); }

    const rankings = db.prepare(`
      SELECT s.id, s.name, s.class, s.student_id,
        COALESCE(SUM(sc.score), 0) as total_score
      FROM students s
      LEFT JOIN scores sc ON s.id = sc.student_id
      WHERE 1=1 ${where}
      GROUP BY s.id
      ORDER BY total_score DESC
    `).all(...params);

    const mapped = rankings.map((r: any) => ({
      ...r,
      studentId: r.student_id,
      student_id: undefined
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: '获取排名失败' }, { status: 500 });
  }
}