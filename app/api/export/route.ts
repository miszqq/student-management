import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const examId = searchParams.get('examId');

    let workbook: XLSX.WorkBook;

    if (type === 'students') {
      const students = db.prepare('SELECT name as "姓名", class as "班级", student_id as "学号", gender as "性别", grade as "年级" FROM students ORDER BY class, student_id').all();
      workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(students);
      XLSX.utils.book_append_sheet(workbook, ws, '学生信息');
    } else if (type === 'scores' && examId) {
      const exam = db.prepare('SELECT name FROM exams WHERE id = ?').get(examId) as any;
      const subjects = ['语文', '数学', '英语', '物理', '化学', '生物'];
      const rows = db.prepare(`
        SELECT s.student_id as "学号", s.name as "姓名", s.class as "班级"
        FROM students s
        ORDER BY s.class, s.student_id
      `).all() as any[];

      for (const row of rows) {
        const student = db.prepare('SELECT id FROM students WHERE student_id = ?').get(row['学号']) as any;
        if (!student) continue;
        for (const sub of subjects) {
          const sc = db.prepare('SELECT score FROM scores WHERE student_id = ? AND exam_id = ? AND subject = ?').get(student.id, examId, sub) as any;
          row[sub] = sc?.score ?? '';
        }
      }

      workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, ws, exam?.name || '成绩');
    } else {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const filename = type === 'students' ? '学生信息' : '成绩';
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}.xlsx`
      }
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error?.message || '导出失败' }, { status: 500 });
  }
}