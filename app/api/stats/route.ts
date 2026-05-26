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

    const subjects = ['语文', '数学', '英语', '物理', '化学', '生物'];
    const stats: any[] = [];

    for (const subject of subjects) {
      let gradeJoin = '';
      let gradeWhere = '';
      if (grade) {
        gradeJoin = ' JOIN students s ON sc.student_id = s.id';
        gradeWhere = ' AND s.grade = ?';
        params.push(grade);
      }

      const subjectParams = [subject, ...params.filter(() => true)];
      // Reset params for each query
      const qParams: any[] = [subject];
      if (examId) qParams.push(examId);
      if (grade) qParams.push(grade);

      let query = `SELECT AVG(sc.score) as avg, MAX(sc.score) as max, MIN(sc.score) as min, COUNT(*) as count
        FROM scores sc${grade ? ' JOIN students s ON sc.student_id = s.id' : ''}
        WHERE sc.subject = ?${examId ? ' AND sc.exam_id = ?' : ''}${grade ? ' AND s.grade = ?' : ''}`;

      const result = db.prepare(query).get(...qParams) as any;

      if (result && result.count > 0) {
        stats.push({
          subject,
          平均分: Math.round(result.avg * 10) / 10,
          最高分: result.max,
          最低分: result.min,
          人数: result.count
        });
      }
    }

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 });
  }
}