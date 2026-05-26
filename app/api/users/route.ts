import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const users = db.prepare(`
      SELECT u.id, u.username, u.role, u.student_id, s.name as student_name
      FROM users u LEFT JOIN students s ON u.student_id = s.id
      ORDER BY u.created_at DESC
    `).all();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, role, student_id } = await request.json();
    const bcrypt = require('bcryptjs');
    const hashed = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)').run(username, hashed, role, student_id || null);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') return NextResponse.json({ error: '用户名已存在' }, { status: 400 });
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    db.prepare('DELETE FROM users WHERE id = ? AND role != ?').run(id, 'admin');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}