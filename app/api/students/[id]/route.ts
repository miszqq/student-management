import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { name, class: className, studentId, gender } = await request.json();

    db.prepare(`
      UPDATE students SET name = ?, class = ?, student_id = ?, gender = ?
      WHERE id = ?
    `).run(name, className, studentId, gender, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return NextResponse.json({ error: '学号已存在' }, { status: 400 });
    }
    return NextResponse.json({ error: '更新学生失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    db.prepare('DELETE FROM students WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '删除学生失败' }, { status: 500 });
  }
}