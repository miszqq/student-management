import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Check admin
    const teacher = db.prepare('SELECT * FROM teachers WHERE username = ?').get(username) as any;
    if (teacher) {
      const bcrypt = require('bcryptjs');
      if (bcrypt.compareSync(password, teacher.password)) {
        return NextResponse.json({ success: true, teacher: { id: teacher.id, username: teacher.username, role: 'admin' } });
      }
    }

    // Check student users
    const user = db.prepare(`
      SELECT u.*, s.name as student_name FROM users u
      LEFT JOIN students s ON u.student_id = s.id WHERE u.username = ?
    `).get(username) as any;

    if (user) {
      const bcrypt = require('bcryptjs');
      if (bcrypt.compareSync(password, user.password)) {
        return NextResponse.json({
          success: true,
          teacher: { id: user.id, username: user.username, role: user.role, student_id: user.student_id, student_name: user.student_name }
        });
      }
    }

    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}