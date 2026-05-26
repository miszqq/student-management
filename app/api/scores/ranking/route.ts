import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const rankings = db.prepare(`
      SELECT s.id, s.name, s.class, s.student_id,
        COALESCE(SUM(sc.score), 0) as total_score
      FROM students s
      LEFT JOIN scores sc ON s.id = sc.student_id
      GROUP BY s.id
      ORDER BY total_score DESC
    `).all();

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