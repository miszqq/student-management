import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const examId = searchParams.get('examId');
    const grade = searchParams.get('grade');
    const className = searchParams.get('class');

    const subjects = ['语文', '数学', '英语', '物理', '化学', '生物'];
    const stats: any[] = [];
    const needJoin = !!(grade || className);

    for (const subject of subjects) {
      const qParams: any[] = [subject];
      if (examId) qParams.push(examId);
      if (grade) qParams.push(grade);
      if (className) qParams.push(className);

      let query = `SELECT AVG(sc.score) as avg, MAX(sc.score) as max, MIN(sc.score) as min, COUNT(*) as count
        FROM scores sc${needJoin ? ' JOIN students s ON sc.student_id = s.id' : ''}
        WHERE sc.subject = ?${examId ? ' AND sc.exam_id = ?' : ''}${grade ? ' AND s.grade = ?' : ''}${className ? ' AND s.class = ?' : ''}`;

      const result = db.prepare(query).get(...qParams) as any;

      if (result && result.count > 0) {
        // Get the student name with the highest score
        const topParams: any[] = [subject, result.max];
        if (examId) topParams.push(examId);
        if (grade) topParams.push(grade);
        if (className) topParams.push(className);

        const topQuery = `SELECT s.name FROM scores sc JOIN students s ON sc.student_id = s.id
          WHERE sc.subject = ? AND sc.score = ?${examId ? ' AND sc.exam_id = ?' : ''}${grade ? ' AND s.grade = ?' : ''}${className ? ' AND s.class = ?' : ''}
          LIMIT 1`;

        const topResult = db.prepare(topQuery).get(...topParams) as any;

        stats.push({
          subject,
          平均分: Math.round(result.avg * 10) / 10,
          最高分: result.max,
          最高分学生: topResult?.name || '',
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