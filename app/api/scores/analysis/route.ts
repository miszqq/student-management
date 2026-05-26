import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: '缺少学生ID' }, { status: 400 });
    }

    const rows = db.prepare(`
      SELECT sc.subject, sc.score, e.name as exam_name, e.exam_date, e.id as exam_id
      FROM scores sc
      JOIN exams e ON sc.exam_id = e.id
      WHERE sc.student_id = ?
      ORDER BY e.exam_date ASC, e.id ASC, sc.subject ASC
    `).all(Number(studentId)) as any[];

    // Group by subject
    const subjects = ['语文', '数学', '英语', '物理', '化学', '生物'];
    const result = subjects.map(subject => {
      const data = rows
        .filter((r: any) => r.subject === subject)
        .map((r: any) => ({
          examId: r.exam_id,
          examName: r.exam_name,
          examDate: r.exam_date,
          score: r.score
        }));
      return { subject, data };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: '获取分析数据失败' }, { status: 500 });
  }
}
