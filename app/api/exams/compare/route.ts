import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const examId = searchParams.get('examId');
    const examId2 = searchParams.get('examId2');

    if (!examId || !examId2) {
      return NextResponse.json({ error: '需要两个考试ID' }, { status: 400 });
    }

    const students = db.prepare('SELECT * FROM students ORDER BY class, student_id').all() as any[];
    const subjects = ['语文', '数学', '英语', '物理', '化学', '生物'];

    const result = students.map(s => {
      const row: any = { id: s.id, name: s.name, class: s.class, studentId: s.student_id };
      for (const sub of subjects) {
        const s1 = db.prepare('SELECT score FROM scores WHERE student_id = ? AND exam_id = ? AND subject = ?').get(s.id, examId, sub) as any;
        const s2 = db.prepare('SELECT score FROM scores WHERE student_id = ? AND exam_id = ? AND subject = ?').get(s.id, examId2, sub) as any;
        row[sub] = { current: s1?.score || '-', previous: s2?.score || '-' };
        if (s1?.score && s2?.score) {
          row[sub + '_diff'] = (s1.score - s2.score > 0 ? '+' : '') + (s1.score - s2.score).toFixed(0);
        } else {
          row[sub + '_diff'] = '-';
        }
      }
      return row;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}