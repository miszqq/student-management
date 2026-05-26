import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const formExamId = formData.get('examId') as string;

    if (!file) return NextResponse.json({ error: '请上传文件' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    let imported = 0;

    if (type === 'students') {
      const stmt = db.prepare('INSERT OR IGNORE INTO students (name, class, student_id, gender, grade) VALUES (?, ?, ?, ?, ?)');
      for (const row of data) {
        stmt.run(row['姓名'] || row.name, row['班级'] || row.class, String(row['学号'] || row.student_id || row.studentId), row['性别'] || row.gender || '男', row['年级'] || row.grade || '');
        imported++;
      }
    } else if (type === 'scores') {
      const stmt = db.prepare('INSERT OR REPLACE INTO scores (student_id, exam_id, subject, score) VALUES (?, ?, ?, ?)');
      for (const row of data) {
        const sid = row['学号'] || row.student_id || row.studentId;
        const student = db.prepare('SELECT id FROM students WHERE student_id = ?').get(String(sid)) as any;
        if (student) {
          const subjects = ['语文', '数学', '英语', '物理', '化学', '生物'];
          const examId = row['考试ID'] || row.exam_id || formExamId || 0;
          for (const sub of subjects) {
            if (row[sub] !== undefined) {
              stmt.run(student.id, examId, sub, Number(row[sub]));
            }
          }
        }
        imported++;
      }
    }

    return NextResponse.json({ success: true, count: imported });
  } catch (error) {
    return NextResponse.json({ error: '导入失败' }, { status: 500 });
  }
}