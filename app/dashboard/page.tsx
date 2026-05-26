'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Student {
  id: number;
  name: string;
  class: string;
  studentId: string;
  gender: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'students' | 'scores' | 'ranking'>('students');
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const teacher = localStorage.getItem('teacher');
    if (!teacher) {
      router.push('/');
    }
    fetchStudents();
  }, [router]);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      console.log('获取学生列表:', data);
      setStudents(data);
    } catch (e) {
      console.error('获取学生失败', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teacher');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">教学管理系统</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            退出登录
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-lg ${activeTab === 'students' ? 'bg-gray-900 text-white' : 'bg-white border hover:bg-gray-50'}`}
            onClick={() => setActiveTab('students')}
          >
            学生管理
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeTab === 'scores' ? 'bg-gray-900 text-white' : 'bg-white border hover:bg-gray-50'}`}
            onClick={() => setActiveTab('scores')}
          >
            成绩管理
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeTab === 'ranking' ? 'bg-gray-900 text-white' : 'bg-white border hover:bg-gray-50'}`}
            onClick={() => setActiveTab('ranking')}
          >
            成绩排名
          </button>
        </div>

        {activeTab === 'students' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">学生列表 ({students.length} 人)</h2>
            <StudentTable students={students} onUpdate={fetchStudents} />
          </div>
        )}

        {activeTab === 'scores' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">成绩录入</h2>
            <ScoreManagement students={students} />
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">总分排名</h2>
            <RankingView />
          </div>
        )}
      </div>
    </div>
  );
}

function StudentTable({ students, onUpdate }: { students: Student[], onUpdate: () => void }) {
  const [editing, setEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', class: '', studentId: '', gender: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', class: '', studentId: '', gender: '男' });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentId.includes(searchTerm) ||
    s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (student: Student) => {
    console.log('编辑学生:', student);
    setEditing(student.id);
    setFormData(student);
  };

  const handleSave = async (id: number) => {
    console.log('保存学生:', id, formData);
    setError('');
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      console.log('保存响应:', data);
      if (!res.ok) {
        setError(data.error || '更新失败');
        return;
      }
      setEditing(null);
      setError('');
      onUpdate();
    } catch (e) {
      console.error('保存失败', e);
      setError('网络错误');
    }
  };

  const handleDelete = async (id: number) => {
    console.log('删除学生:', id);
    if (window.confirm('确定删除该学生吗？此操作无法撤销。')) {
      try {
        const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
        const data = await res.json();
        console.log('删除响应状态:', res.status, data);
        if (res.ok && data.success) {
          console.log('删除成功，刷新列表');
          onUpdate();
        } else {
          alert('删除失败: ' + (data.error || '未知错误'));
        }
      } catch (e) {
        console.error('删除失败', e);
        alert('删除失败，请检查网络连接');
      }
    } else {
      console.log('取消删除');
    }
  };

  const handleAdd = async () => {
    console.log('添加学生:', newStudent);
    setError('');
    if (!newStudent.name || !newStudent.class || !newStudent.studentId) {
      setError('请填写完整信息');
      return;
    }
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      const data = await res.json();
      console.log('添加响应:', data);
      if (!res.ok) {
        setError(data.error || '添加失败');
        return;
      }
      setNewStudent({ name: '', class: '', studentId: '', gender: '男' });
      setShowAdd(false);
      onUpdate();
    } catch (e) {
      console.error('添加失败', e);
      setError('网络错误');
    }
  };

  return (
    <div>
      {showAdd && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <div className="grid grid-cols-4 gap-4">
            <input
              className="px-3 py-2 border rounded"
              placeholder="姓名 *"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              required
            />
            <input
              className="px-3 py-2 border rounded"
              placeholder="班级 *"
              value={newStudent.class}
              onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
              required
            />
            <input
              className="px-3 py-2 border rounded"
              placeholder="学号 *"
              value={newStudent.studentId}
              onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
              required
            />
            <select
              className="px-3 py-2 border rounded"
              value={newStudent.gender}
              onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
            >
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800">
              添加
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded hover:bg-gray-50">
              取消
            </button>
          </div>
        </div>
      )}
      {!showAdd && (
        <div className="mb-4">
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 mb-3">
            + 添加学生
          </button>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="搜索学生姓名、学号或班级..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="text-sm text-gray-500 mt-1">
            显示 {filteredStudents.length} 位学生（共 {students.length} 位）
          </div>
        </div>
      )}

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">姓名</th>
            <th className="text-left p-2">班级</th>
            <th className="text-left p-2">学号</th>
            <th className="text-left p-2">性别</th>
            <th className="text-left p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student) => (
            <tr key={student.id} className="border-b">
              {editing === student.id ? (
                <>
                  <td className="p-2">
                    <input
                      className="w-full px-2 py-1 border rounded"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full px-2 py-1 border rounded"
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full px-2 py-1 border rounded"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      className="w-full px-2 py-1 border rounded"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => handleSave(student.id)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => { setEditing(null); setError(''); }}
                      className="px-3 py-1 border rounded hover:bg-gray-50"
                    >
                      取消
                    </button>
                    {error && <span className="text-red-500 text-sm self-center ml-2">{error}</span>}
                  </td>
                </>
              ) : (
                <>
                  <td className="p-2">{student.name}</td>
                  <td className="p-2">{student.class}</td>
                  <td className="p-2">{student.studentId}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${student.gender === '男' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                      {student.gender}
                    </span>
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(student)}
                      className="px-3 py-1 border rounded hover:bg-gray-50 text-sm"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      删除
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScoreManagement({ students }: { students: Student[] }) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [subject, setSubject] = useState('语文');
  const [score, setScore] = useState('');
  const [scores, setScores] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const fetchScores = async () => {
    try {
      const res = await fetch('/api/scores');
      const data = await res.json();
      setScores(data);
    } catch (e) {
      console.error('获取成绩失败', e);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const handleSave = async () => {
    console.log('保存成绩:', { studentId: selectedStudent, subject, score });
    if (!selectedStudent || !score) {
      setMessage('请选择学生并输入成绩');
      return;
    }
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: parseInt(selectedStudent), subject, score: parseFloat(score) })
      });
      const data = await res.json();
      console.log('保存成绩响应:', data);
      if (data.success) {
        setScore('');
        setMessage('保存成功');
        setTimeout(() => setMessage(''), 2000);
        fetchScores();
      } else {
        setMessage('保存失败');
      }
    } catch (e) {
      console.error('保存失败', e);
      setMessage('网络错误');
    }
  };

  const handleDeleteScore = async (studentId: number, subject: string) => {
    if (!window.confirm(`确定要删除该学生的${subject}成绩吗？`)) return;
    try {
      const res = await fetch(`/api/scores?studentId=${studentId}&subject=${subject}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMessage('删除成功');
        setTimeout(() => setMessage(''), 2000);
        fetchScores();
      } else {
        setMessage('删除失败');
      }
    } catch (e) {
      console.error('删除失败', e);
      setMessage('网络错误');
    }
  };

  return (
    <div className="space-y-6">
      {message && <div className="p-2 bg-blue-100 text-blue-800 rounded">{message}</div>}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">选择学生</label>
          <select
            className="w-full px-3 py-2 border rounded"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">请选择学生</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.class}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">科目</label>
          <select
            className="px-3 py-2 border rounded"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="语文">语文</option>
            <option value="数学">数学</option>
            <option value="英语">英语</option>
            <option value="物理">物理</option>
            <option value="化学">化学</option>
            <option value="生物">生物</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">成绩</label>
          <input
            type="number"
            min="0"
            max="100"
            className="w-24 px-3 py-2 border rounded"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
        >
          保存
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">排名</th>
            <th className="text-left p-2">姓名</th>
            <th className="text-left p-2">班级</th>
            <th className="text-left p-2">学号</th>
            <th className="text-center p-2">语文</th>
            <th className="text-center p-2">数学</th>
            <th className="text-center p-2">英语</th>
            <th className="text-center p-2">物理</th>
            <th className="text-center p-2">化学</th>
            <th className="text-center p-2">生物</th>
            <th className="text-center p-2">总分</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((item, index) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="p-2">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${index < 3 ? 'bg-yellow-100 font-bold' : 'bg-gray-100'}`}>
                  {index + 1}
                </span>
              </td>
              <td className="p-2">{item.name}</td>
              <td className="p-2">{item.class}</td>
              <td className="p-2">{item.studentId}</td>
              {['语文', '数学', '英语', '物理', '化学', '生物'].map(sub => (
                <td key={sub} className="text-center p-2">
                  <span className="inline-flex items-center gap-1">
                    {item.scores[sub] || '-'}
                    {item.scores[sub] && (
                      <button
                        onClick={() => handleDeleteScore(item.id, sub)}
                        className="text-red-400 hover:text-red-600 text-xs ml-1"
                        title={`删除${sub}成绩`}
                      >
                        ✕
                      </button>
                    )}
                  </span>
                </td>
              ))}
              <td className="text-center p-2 font-bold">{item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankingView() {
  const [rankings, setRankings] = useState<any[]>([]);

  const fetchRankings = async () => {
    try {
      const res = await fetch('/api/scores/ranking');
      const data = await res.json();
      setRankings(data);
    } catch (e) {
      console.error('获取排名失败', e);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b">
          <th className="text-left p-2">排名</th>
          <th className="text-left p-2">姓名</th>
          <th className="text-left p-2">班级</th>
          <th className="text-left p-2">学号</th>
          <th className="text-center p-2">总分</th>
        </tr>
      </thead>
      <tbody>
        {rankings.map((item, index) => (
          <tr key={item.id} className="border-b hover:bg-gray-50">
            <td className="p-2">
              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold ${
                index === 0 ? 'bg-yellow-400 text-white' :
                index === 1 ? 'bg-gray-300 text-white' :
                index === 2 ? 'bg-orange-300 text-white' : 'bg-gray-100'
              }`}>
                {index + 1}
              </span>
            </td>
            <td className="p-2 font-medium">{item.name}</td>
            <td className="p-2">{item.class}</td>
            <td className="p-2">{item.studentId}</td>
            <td className="text-center p-2 text-xl font-bold text-blue-600">{item.total_score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}