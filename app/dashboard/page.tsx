'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物'];
const GRADES = ['初一', '初二', '初三'];
const MAX_SCORE_SUBJECTS: Record<string, number> = { '语文': 120, '数学': 120, '英语': 120 };
const getMaxScore = (sub: string) => MAX_SCORE_SUBJECTS[sub] || 100;

// ====================== Dashboard Shell ======================
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('teacher');
    if (!data) { router.push('/'); return; }
    setUser(JSON.parse(data));
    fetchStudents();
  }, [router]);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students'); setStudents(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => { localStorage.removeItem('teacher'); router.push('/'); };

  if (!user) return null;
  const isAdmin = user.role === 'admin';

  const tabs = isAdmin
    ? [
        { key: 'students', label: '学生管理' },
        { key: 'exams', label: '考试管理' },
        { key: 'scores', label: '成绩录入' },
        { key: 'compare', label: '成绩对比' },
        { key: 'stats', label: '统计面板' },
        { key: 'users', label: '用户管理' },
      ]
    : [
        { key: 'myscores', label: '我的成绩' },
        { key: 'analysis', label: '成绩分析' },
        { key: 'compare', label: '成绩对比' },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <nav className="bg-white/80 backdrop-blur border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            📚 教学管理系统
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {user.role === 'admin' ? '管理员' : user.student_name || user.username}
            </span>
            <button onClick={handleLogout} className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">退出</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button key={t.key}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-blue-600 text-white shadow-md' : 'bg-white border hover:bg-gray-50'}`}
              onClick={() => setActiveTab(t.key)}
            >{t.label}</button>
          ))}
        </div>

        {activeTab === 'students' && <StudentSection students={students} onUpdate={fetchStudents} isAdmin={isAdmin} />}
        {activeTab === 'exams' && <ExamSection />}
        {activeTab === 'scores' && <ScoreSection students={students} />}
        {activeTab === 'myscores' && <MyScoresSection user={user} />}
        {activeTab === 'analysis' && <MyAnalysisSection user={user} />}
        {activeTab === 'compare' && <CompareSection user={user} />}
        {activeTab === 'stats' && <StatsSection />}
        {activeTab === 'users' && isAdmin && <UserSection students={students} />}
      </div>
    </div>
  );
}

// ====================== Student Management ======================
function StudentSection({ students, onUpdate, isAdmin }: any) {
  const [editing, setEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', class: '', studentId: '', gender: '男', grade: '' });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);

  const filtered = students.filter((s: any) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentId?.includes(searchTerm) ||
    s.class?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (s: any) => { setEditing(s.id); setFormData({ ...s }); };
  const handleSave = async (id: number) => {
    setError('');
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!res.ok) { setError((await res.json()).error || '更新失败'); return; }
      setEditing(null); setError(''); onUpdate();
    } catch (e) { setError('网络错误'); }
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm('确定删除该学生吗？')) return;
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (res.ok) onUpdate(); else alert('删除失败');
  };
  const handleAdd = async () => {
    if (!newStudent.name || !newStudent.class || !newStudent.studentId) { setError('请填写完整信息'); return; }
    try {
      const res = await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newStudent) });
      if (!res.ok) { setError((await res.json()).error || '添加失败'); return; }
      setNewStudent({ name: '', class: '', studentId: '', gender: '男', grade: '' }); setShowAdd(false); onUpdate();
    } catch (e) { setError('网络错误'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true);
    const fd = new FormData(); fd.append('file', file); fd.append('type', 'students');
    const res = await fetch('/api/import', { method: 'POST', body: fd });
    const data = await res.json();
    alert(`导入完成: ${data.count} 条`);
    setImporting(false); onUpdate();
  };

  const handleExport = () => { window.open('/api/export?type=students', '_blank'); };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">学生列表 ({students.length} 人)</h2>
        <div className="flex gap-2">
          {isAdmin && <>
            <label className="px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100">
              📥 导入
              <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" disabled={importing} />
            </label>
            <button onClick={handleExport} className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100">📤 导出</button>
          </>}
        </div>
      </div>

      {/* Add & Search */}
      <div className="mb-4 space-y-3">
        {showAdd && (
          <div className="bg-blue-50 p-4 rounded-lg grid grid-cols-5 gap-3">
            <input className="px-3 py-2 border rounded text-sm" placeholder="姓名 *" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} />
            <input className="px-3 py-2 border rounded text-sm" placeholder="班级 *" value={newStudent.class} onChange={e => setNewStudent({ ...newStudent, class: e.target.value })} />
            <input className="px-3 py-2 border rounded text-sm" placeholder="学号 *" value={newStudent.studentId} onChange={e => setNewStudent({ ...newStudent, studentId: e.target.value })} />
            <select className="px-3 py-2 border rounded text-sm" value={newStudent.gender} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })}>
              <option value="男">男</option><option value="女">女</option>
            </select>
            <select className="px-3 py-2 border rounded text-sm" value={newStudent.grade} onChange={e => setNewStudent({ ...newStudent, grade: e.target.value })}>
              <option value="">选择年级</option>{GRADES.map(g => <option key={g}>{g}</option>)}
            </select>
            <div className="col-span-5 flex gap-2">
              <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">添加</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded-lg text-sm">取消</button>
              {error && <span className="text-red-500 text-sm self-center">{error}</span>}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          {!showAdd && <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ 添加学生</button>}
          <input className="flex-1 px-4 py-2 border rounded-lg text-sm" placeholder="搜索姓名、学号或班级..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500">
            <th className="p-3">姓名</th><th className="p-3">班级</th><th className="p-3">学号</th><th className="p-3">性别</th><th className="p-3">年级</th><th className="p-3">操作</th>
          </tr></thead>
          <tbody>
            {filtered.map((s: any) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                {editing === s.id ? (
                  <>
                    <td className="p-2"><input className="w-24 px-2 py-1 border rounded text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></td>
                    <td className="p-2"><input className="w-24 px-2 py-1 border rounded text-sm" value={formData.class} onChange={e => setFormData({ ...formData, class: e.target.value })} /></td>
                    <td className="p-2"><input className="w-24 px-2 py-1 border rounded text-sm" value={formData.studentId} onChange={e => setFormData({ ...formData, studentId: e.target.value })} /></td>
                    <td className="p-2">
                      <select className="px-2 py-1 border rounded text-sm" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                        <option value="男">男</option><option value="女">女</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <select className="px-2 py-1 border rounded text-sm" value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })}>
                        <option value="">选择</option>{GRADES.map(g => <option key={g}>{g}</option>)}
                      </select>
                    </td>
                    <td className="p-2 flex gap-2">
                      <button onClick={() => handleSave(s.id)} className="px-3 py-1 bg-green-500 text-white rounded text-sm">保存</button>
                      <button onClick={() => { setEditing(null); setError(''); }} className="px-3 py-1 border rounded text-sm">取消</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3">{s.class}</td>
                    <td className="p-3 text-gray-500">{s.studentId}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${s.gender === '男' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{s.gender}</span>
                    </td>
                    <td className="p-3 text-gray-500">{s.grade || '-'}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleEdit(s)} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">编辑</button>
                      {isAdmin && <button onClick={() => handleDelete(s.id)} className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-sm hover:bg-red-100">删除</button>}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ====================== Exam Management ======================
function ExamSection() {
  const [exams, setExams] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', grade: '', exam_date: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const fetchExams = async () => {
    const res = await fetch('/api/exams'); setExams(await res.json());
  };
  useEffect(() => { fetchExams(); }, []);

  const handleAdd = async () => {
    if (!form.name) return;
    await fetch('/api/exams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ name: '', grade: '', exam_date: '' }); setShowAdd(false); fetchExams();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('删除考试将同时删除该次所有成绩，确定？')) return;
    await fetch(`/api/exams/${id}`, { method: 'DELETE' }); fetchExams();
  };

  const handleUpdate = async (id: number) => {
    await fetch(`/api/exams/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
    setEditingId(null); fetchExams();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">考试管理</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          {showAdd ? '取消' : '+ 新建考试'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">考试名称（如：第一中学第1次考试）</label>
            <input className="w-full px-3 py-2 border rounded text-sm" placeholder="例如：第一中学第1次月考" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">年级</label>
            <select className="px-3 py-2 border rounded text-sm" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
              <option value="">全部</option>{GRADES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">考试日期</label>
            <input type="date" className="px-3 py-2 border rounded text-sm" value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} />
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">创建</button>
        </div>
      )}

      <div className="space-y-2">
        {exams.map(e => (
          <div key={e.id} className="border rounded-lg p-4 hover:bg-gray-50">
            {editingId === e.id ? (
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <input className="w-full px-3 py-2 border rounded text-sm" value={editForm.name} onChange={x => setEditForm({ ...editForm, name: x.target.value })} />
                </div>
                <select className="px-3 py-2 border rounded text-sm" value={editForm.grade} onChange={x => setEditForm({ ...editForm, grade: x.target.value })}>
                  <option value="">全部</option>{GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
                <input type="date" className="px-3 py-2 border rounded text-sm" value={editForm.exam_date} onChange={x => setEditForm({ ...editForm, exam_date: x.target.value })} />
                <button onClick={() => handleUpdate(e.id)} className="px-3 py-2 bg-green-500 text-white rounded text-sm">保存</button>
                <button onClick={() => setEditingId(null)} className="px-3 py-2 border rounded text-sm">取消</button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{e.name}</span>
                  {e.grade && <span className="ml-3 text-xs bg-gray-100 px-2 py-0.5 rounded">{e.grade}</span>}
                  {e.exam_date && <span className="ml-3 text-sm text-gray-500">{e.exam_date}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(e.id); setEditForm({ name: e.name, grade: e.grade, exam_date: e.exam_date }); }} className="px-3 py-1 border rounded text-sm">编辑</button>
                  <button onClick={() => handleDelete(e.id)} className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-sm">删除</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {exams.length === 0 && <p className="text-gray-400 text-center py-8">暂无考试，点击上方按钮创建</p>}
      </div>
    </div>
  );
}

// ====================== My Scores (Student View) ======================
function MyScoresSection({ user }: any) {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => { fetch('/api/exams').then(r => r.json()).then(setExams); }, []);

  const loadScores = async () => {
    if (!selectedExam) return;
    const res = await fetch(`/api/scores?type=byexam&examId=${selectedExam}`);
    const data = await res.json();
    const myStudent = data.find((d: any) => d.student_id === user.student_id);
    if (myStudent) {
      try {
        const subs = JSON.parse(myStudent.subjects || '[]');
        const map: Record<string, number> = {};
        subs.forEach((s: any) => { if (s.subject) map[s.subject] = s.score; });
        setScores(map);
      } catch (e) {}
    } else {
      setScores({});
    }
  };

  useEffect(() => { loadScores(); }, [selectedExam]);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-lg font-bold mb-4">我的成绩</h2>
      <div className="mb-6">
        <label className="text-xs text-gray-500 mb-1 block">选择考试</label>
        <select className="w-full px-3 py-2 border rounded-lg text-sm" value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
          <option value="">请选择考试</option>
          {exams.map((e: any) => <option key={e.id} value={e.id}>{e.name}{e.grade ? ` (${e.grade})` : ''}</option>)}
        </select>
      </div>
      {selectedExam && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {SUBJECTS.map(sub => {
            const maxScore = getMaxScore(sub);
            return (
            <div key={sub} className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">{sub}</div>
              <div className={`text-2xl font-bold ${scores[sub] !== undefined ? 'text-blue-600' : 'text-gray-300'}`}>
                {scores[sub] !== undefined ? scores[sub] : '-'}
              </div>
              {scores[sub] !== undefined && <div className="text-xs text-gray-400 mt-1">满分 {maxScore}</div>}
            </div>);
          })}
        </div>
      )}
    </div>
  );
}

// ====================== My Analysis (Student Line Charts) ======================
function MyAnalysisSection({ user }: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.student_id) return;
    fetch(`/api/scores/analysis?studentId=${user.student_id}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [user]);

  const colors = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];
  const subjectsWithData = data.filter((s: any) => s.data.length > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">成绩分析</h2>
      {loading ? (
        <p className="text-gray-400 text-center py-8">加载中...</p>
      ) : subjectsWithData.length === 0 ? (
        <p className="text-gray-400 text-center py-8">暂无成绩数据</p>
      ) : (
        subjectsWithData.map((s: any, i: number) => (
          <div key={s.subject} className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold text-base mb-4" style={{ color: colors[i % colors.length] }}>
              {s.subject} 成绩趋势
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={s.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="examName" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 120]} tick={{ fontSize: 12 }} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
                      <p className="font-medium mb-1">{label}</p>
                      <p style={{ color: colors[i % colors.length] }}>
                        {s.subject}: <span className="font-bold">{payload[0].value}</span>
                      </p>
                    </div>
                  );
                }} />
                <Line type="monotone" dataKey="score" stroke={colors[i % colors.length]}
                  strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))
      )}
    </div>
  );
}

// ====================== Score Entry ======================
function ScoreSection({ students }: any) {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [scores, setScores] = useState<Record<string, any>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => { fetch('/api/exams').then(r => r.json()).then(setExams); }, []);

  const loadScores = async () => {
    if (!selectedExam) return;
    const res = await fetch('/api/scores?type=byexam&examId=' + selectedExam);
    const data = await res.json();
    const map: Record<string, any> = {};
    data.forEach((item: any) => {
      map[item.student_id] = {};
      try {
        const subjects = JSON.parse(item.subjects || '[]');
        subjects.forEach((s: any) => { if (s.subject) map[item.student_id][s.subject] = s.score; });
      } catch (e) {}
    });
    setScores(map);
  };

  useEffect(() => { loadScores(); }, [selectedExam]);

  const updateScore = (studentId: number, subject: string, value: string) => {
    const num = parseFloat(value);
    setScores(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [subject]: isNaN(num) ? undefined : num }
    }));
  };

  const saveAll = async () => {
    if (!selectedExam) return;
    setSaving(true); setMessage('');
    let count = 0;
    for (const student of students) {
      const subScores = scores[student.id];
      if (!subScores) continue;
      for (const subject of SUBJECTS) {
        const score = subScores[subject];
        if (score !== undefined && score !== null) {
          await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: student.id, examId: parseInt(selectedExam), subject, score })
          });
          count++;
        }
      }
    }
    setSaving(false);
    setMessage(`已保存 ${count} 条成绩`);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleImportScores = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true);
    const fd = new FormData(); fd.append('file', file); fd.append('type', 'scores');
    if (selectedExam) fd.append('examId', selectedExam);
    const res = await fetch('/api/import', { method: 'POST', body: fd });
    const data = await res.json();
    alert(`导入完成: ${data.count} 条`);
    setImporting(false);
    if (selectedExam) loadScores();
  };

  const handleExportScores = () => {
    if (selectedExam) window.open(`/api/export?type=scores&examId=${selectedExam}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">成绩录入</h2>
      </div>

      <div className="flex gap-4 items-end mb-6">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">选择考试</label>
          <select className="w-full px-3 py-2 border rounded-lg text-sm" value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
            <option value="">请选择考试</option>
            {exams.map((e: any) => <option key={e.id} value={e.id}>{e.name}{e.grade ? ` (${e.grade})` : ''}</option>)}
          </select>
        </div>
        {selectedExam && (
          <>
            <div className="flex gap-2 items-center">
              <button onClick={saveAll} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? '保存中...' : '💾 一键保存'}
              </button>
              <button onClick={handleExportScores} className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm hover:bg-green-100">
                📤 导出
              </button>
              <label className="px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm hover:bg-orange-100 cursor-pointer">
                📥 导入
                <input type="file" accept=".xlsx,.xls" onChange={handleImportScores} className="hidden" disabled={importing} />
              </label>
              {message && <span className="text-sm text-blue-600">{message}</span>}
            </div>
          </>
        )}
      </div>

      {selectedExam && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3 text-left">姓名</th>
                <th className="p-3 text-left">班级</th>
                {SUBJECTS.map(sub => <th key={sub} className="p-3 text-center">{sub}<br /><span className="text-xs text-gray-400">满分{getMaxScore(sub)}</span></th>)}
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 text-gray-500">{s.class}</td>
                  {SUBJECTS.map(sub => {
                    const maxScore = getMaxScore(sub);
                    return (
                    <td key={sub} className="p-2 text-center">
                      <input
                        type="number" min="0" max={maxScore}
                        className="w-16 px-2 py-1.5 border rounded text-center text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                        value={scores[s.id]?.[sub] ?? ''}
                        onChange={e => updateScore(s.id, sub, e.target.value)}
                      />
                    </td>);
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ====================== Score Comparison ======================
function CompareSection({ user }: any) {
  const [exams, setExams] = useState<any[]>([]);
  const [exam1, setExam1] = useState('');
  const [exam2, setExam2] = useState('');
  const [data, setData] = useState<any[]>([]);
  const isAdmin = user?.role === 'admin';

  useEffect(() => { fetch('/api/exams').then(r => r.json()).then(setExams); }, []);

  const loadCompare = async () => {
    if (!exam1 || !exam2) return;
    let url = `/api/exams/compare?examId=${exam1}&examId2=${exam2}`;
    if (!isAdmin && user?.student_id) url += `&studentId=${user.student_id}`;
    const res = await fetch(url);
    setData(await res.json());
  };

  useEffect(() => { loadCompare(); }, [exam1, exam2]);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-lg font-bold mb-4">成绩对比</h2>
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">当前考试</label>
          <select className="w-full px-3 py-2 border rounded-lg text-sm" value={exam1} onChange={e => setExam1(e.target.value)}>
            <option value="">选择</option>{exams.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">上一次考试</label>
          <select className="w-full px-3 py-2 border rounded-lg text-sm" value={exam2} onChange={e => setExam2(e.target.value)}>
            <option value="">选择</option>{exams.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-left">姓名</th>
              <th className="p-3 text-left">班级</th>
              {SUBJECTS.map(sub => (
                <th key={sub} className="p-3 text-center">{sub}<br /><span className="text-xs text-gray-400">当前/上次/差</span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row: any) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{row.name}</td>
                <td className="p-3 text-gray-500">{row.class}</td>
                {SUBJECTS.map(sub => {
                  const diff = row[sub + '_diff'];
                  const isUp = diff !== '-' && !diff?.startsWith('-');
                  return (
                    <td key={sub} className="p-3 text-center">
                      <span className="font-medium">{row[sub]?.current || '-'}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-gray-500">{row[sub]?.previous || '-'}</span>
                      {diff !== '-' && (
                        <span className={`ml-1 text-xs ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                          ({diff})
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <p className="text-gray-400 text-center py-8">请选择两次考试进行对比</p>}
      </div>
    </div>
  );
}

// ====================== Statistics with Charts ======================
function StatsSection() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [stats, setStats] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/exams').then(r => r.json()).then(setExams);
    fetch('/api/students').then(r => r.json()).then((data: any[]) => {
      const unique = [...new Set(data.map((s: any) => s.class).filter(Boolean))] as string[];
      setClasses(unique.sort());
    });
  }, []);

  const fetchStats = async () => {
    const params = new URLSearchParams();
    if (selectedExam) params.set('examId', selectedExam);
    if (selectedGrade) params.set('grade', selectedGrade);
    if (selectedClass) params.set('class', selectedClass);
    const res = await fetch('/api/stats?' + params);
    setStats(await res.json());
  };

  useEffect(() => { fetchStats(); }, [selectedExam, selectedGrade, selectedClass]);

  const chartData = stats.map(s => ({ name: s.subject, 平均分: s.平均分, 最高分: s.最高分, 最高分学生: s.最高分学生, 最低分: s.最低分 }));

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-lg font-bold mb-4">统计面板</h2>
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">考试</label>
          <select className="w-full px-3 py-2 border rounded-lg text-sm" value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
            <option value="">所有考试</option>{exams.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="w-36">
          <label className="text-xs text-gray-500 mb-1 block">年级</label>
          <select className="w-full px-3 py-2 border rounded-lg text-sm" value={selectedGrade} onChange={e => { setSelectedGrade(e.target.value); setSelectedClass(''); }}>
            <option value="">全部</option>{GRADES.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div className="w-36">
          <label className="text-xs text-gray-500 mb-1 block">班级</label>
          <select className="w-full px-3 py-2 border rounded-lg text-sm" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">全部</option>{classes.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">各科目平均分对比</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 120]} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
                    <p className="font-medium mb-1">{d?.name}</p>
                    <p>平均分: <span className="text-blue-600 font-bold">{d?.平均分}</span></p>
                    <p>最高分: <span className="text-green-600 font-bold">{d?.最高分}</span>
                      {d?.最高分学生 && <span className="text-green-700 ml-1">({d.最高分学生})</span>}
                    </p>
                    <p>最低分: <span className="text-red-600 font-bold">{d?.最低分}</span></p>
                  </div>
                );
              }} />
              <Legend />
              <Bar dataKey="平均分" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="最高分" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="最低分" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-left">科目</th>
              <th className="p-3 text-center">平均分</th>
              <th className="p-3 text-center">最高分</th>
              <th className="p-3 text-center">最高分学生</th>
              <th className="p-3 text-center">最低分</th>
              <th className="p-3 text-center">参考人数</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s: any) => (
              <tr key={s.subject} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{s.subject}</td>
                <td className="p-3 text-center">
                  <span className="text-lg font-bold text-blue-600">{s.平均分}</span>
                </td>
                <td className="p-3 text-center text-green-600 font-medium">{s.最高分}</td>
                <td className="p-3 text-center text-green-700 text-sm">{s.最高分学生 || '-'}</td>
                <td className="p-3 text-center text-red-600 font-medium">{s.最低分}</td>
                <td className="p-3 text-center text-gray-500">{s.人数}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {stats.length === 0 && <p className="text-gray-400 text-center py-8">暂无统计数据</p>}
      </div>
    </div>
  );
}

// ====================== User Management ======================
function UserSection({ students }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'student', student_id: '' });

  const fetchUsers = async () => { const res = await fetch('/api/users'); setUsers(await res.json()); };
  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async () => {
    if (!form.username || !form.password) return;
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ username: '', password: '', role: 'student', student_id: '' }); setShowAdd(false); fetchUsers(); }
    else { alert((await res.json()).error); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定删除此用户？')) return;
    await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchUsers();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">用户管理</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">+ 新建用户</button>
      </div>

      {showAdd && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4 grid grid-cols-5 gap-3">
          <input className="px-3 py-2 border rounded text-sm" placeholder="用户名 *" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
          <input className="px-3 py-2 border rounded text-sm" type="password" placeholder="密码 *" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <select className="px-3 py-2 border rounded text-sm" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="student">学生（只读）</option>
          </select>
          <select className="px-3 py-2 border rounded text-sm" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}>
            <option value="">关联学生</option>
            {students.map((s: any) => <option key={s.id} value={s.id}>{s.name} - {s.class}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">创建</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded text-sm">取消</button>
          </div>
        </div>
      )}

      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-gray-500">
          <th className="p-3">用户名</th><th className="p-3">角色</th><th className="p-3">关联学生</th><th className="p-3">操作</th>
        </tr></thead>
        <tbody>
          {users.map((u: any) => (
            <tr key={u.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{u.username}</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                  {u.role === 'admin' ? '管理员' : '学生'}
                </span>
              </td>
              <td className="p-3 text-gray-500">{u.student_name || '-'}</td>
              <td className="p-3">
                {u.role !== 'admin' && <button onClick={() => handleDelete(u.id)} className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-sm">删除</button>}
                {u.role === 'admin' && <span className="text-gray-400 text-sm">-</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
