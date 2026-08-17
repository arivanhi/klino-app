'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, Plus, Search, CheckCircle, AlertTriangle, Eye, Edit3, Trash2, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast, { Toaster } from 'react-hot-toast';

export default function DetailKelasClient({ kelas, schoolName }) {
  const [students, setStudents] = useState(kelas.siswa || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [uploadingTaskId, setUploadingTaskId] = useState(null);

  // Hardcode KKM target variable for easy changing
  const TARGET_KKM = 75;

  useEffect(() => {
    const event = new CustomEvent('setTopbarTitle', { detail: `Numerasi - ${kelas.name}` });
    window.dispatchEvent(event);
    return () => window.dispatchEvent(new CustomEvent('setTopbarTitle', { detail: '' }));
  }, [kelas.name]);

  // Extract all unique task titles across all students
  const taskTitles = [];
  students.forEach(s => {
    s.tugasNum.forEach(t => {
      if (!taskTitles.includes(t.title)) {
        taskTitles.push(t.title);
      }
    });
  });

  const chartData = taskTitles.map(title => {
    let sum = 0;
    let count = 0;
    students.forEach(s => {
      const task = s.tugasNum.find(t => t.title === title);
      if (task && task.score !== null) {
        sum += task.score;
        count++;
      }
    });
    return {
      name: title,
      rataRataKelas: count > 0 ? parseFloat((sum / count).toFixed(1)) : null,
      targetKKM: TARGET_KKM
    };
  });

  let studentsAboveKKM = 0;
  let totalClassScore = 0;
  let totalScoreCount = 0;

  students.forEach(s => {
    let sSum = 0;
    let sCount = 0;
    s.tugasNum.forEach(t => {
      if (t.score !== null) {
        sSum += t.score;
        sCount++;
        totalClassScore += t.score;
        totalScoreCount++;
      }
    });
    const sAvg = sCount > 0 ? sSum / sCount : 0;
    if (sAvg >= TARGET_KKM) studentsAboveKKM++;
  });

  const classAverage = totalScoreCount > 0 ? (totalClassScore / totalScoreCount).toFixed(1) : 0;

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.nis.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleAddTopic = async () => {
    if (!newTopicTitle.trim()) {
      toast.error('Judul topik tidak boleh kosong');
      return;
    }
    setIsAddingTopic(true);
    try {
      const res = await fetch('/api/guru/numerasi/tambah-tugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kelasId: kelas.id, title: newTopicTitle })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Topik baru berhasil ditambahkan');
        setShowAddTopicModal(false);
        setNewTopicTitle('');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(data.error || 'Gagal menambah topik');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan');
    }
    setIsAddingTopic(false);
  };

  const handleUploadAndScore = async (e, taskId) => {
    e.preventDefault();
    setUploadingTaskId(taskId);
    
    const formData = new FormData(e.target);
    formData.append('taskId', taskId);

    // If file input is empty and score is empty, do nothing
    const file = formData.get('file');
    const score = formData.get('score');
    if ((!file || file.size === 0) && (!score || score.trim() === '')) {
      toast.error('Harap pilih file atau masukkan nilai');
      setUploadingTaskId(null);
      return;
    }

    try {
      const res = await fetch('/api/guru/numerasi/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Data numerasi berhasil disimpan');
        // Update local state directly so we don't need to reload immediately
        const updatedStudents = students.map(s => {
          if (s.id === selectedStudent.id) {
            const updatedTugas = s.tugasNum.map(t => {
              if (t.id === taskId) {
                return { 
                  ...t, 
                  fileUrl: data.fileUrl !== undefined ? data.fileUrl : t.fileUrl, 
                  score: data.score !== undefined ? data.score : t.score 
                };
              }
              return t;
            });
            return { ...s, tugasNum: updatedTugas };
          }
          return s;
        });
        setStudents(updatedStudents);
        setSelectedStudent(updatedStudents.find(s => s.id === selectedStudent.id));
      } else {
        toast.error(data.error || 'Gagal menyimpan data');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat mengunggah');
    }
    setUploadingTaskId(null);
  };

  const handleDeleteTaskData = async (taskId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data tugas (file dan nilai) ini?')) return;
    try {
      const res = await fetch(`/api/guru/numerasi/upload?taskId=${taskId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Data tugas berhasil dihapus');
        const updatedStudents = students.map(s => {
          if (s.id === selectedStudent.id) {
            const updatedTugas = s.tugasNum.map(t => {
              if (t.id === taskId) {
                return { ...t, fileUrl: null, score: null };
              }
              return t;
            });
            return { ...s, tugasNum: updatedTugas };
          }
          return s;
        });
        setStudents(updatedStudents);
        setSelectedStudent(updatedStudents.find(s => s.id === selectedStudent.id));
      } else {
        toast.error('Gagal menghapus data');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const confirmExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(0, 66, 130);
    doc.text(`Laporan Numerasi: ${kelas.name}`, 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Klinik Literasi Numerasi (KLiNO)", 14, 28);
    
    let allTasks = [];
    students.forEach(s => {
      s.tugasNum.forEach(t => {
        const tDate = new Date(t.date);
        if (exportStartDate && tDate < new Date(exportStartDate)) return;
        if (exportEndDate && tDate > new Date(exportEndDate + 'T23:59:59')) return;
        allTasks.push([s.name, s.nis, t.title, tDate.toLocaleDateString('id-ID'), t.score !== null ? t.score : '-']);
      });
    });

    if (allTasks.length === 0) {
      doc.text("Tidak ada data.", 14, 40);
    } else {
      const chunks = [];
      for (let i = 0; i < allTasks.length; i += 15) {
          chunks.push(allTasks.slice(i, i + 15));
      }
      chunks.forEach((chunk, chunkIdx) => {
          if (chunkIdx > 0) doc.addPage();
          doc.autoTable({
              head: [['Nama Siswa', 'NIS', 'Topik/Tugas', 'Tanggal', 'Nilai']],
              body: chunk,
              startY: chunkIdx === 0 ? 35 : 20,
              theme: 'striped',
              styles: { fontSize: 10 },
              headStyles: { fillColor: [0, 66, 130] }
          });
      });
    }
    doc.save(`Laporan_Numerasi_${kelas.name.replace(/ /g, '_')}.pdf`);
    setShowExportModal(false);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <Toaster position="top-right" />
      
      {/* Back Button */}
      <div style={{ marginBottom: '16px' }}>
        <Link href="/guru/numerasi" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#4b5563', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Kembali ke Numerasi
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: '#111827', margin: 0, fontWeight: 700 }}>Laporan Numerasi: {kelas.name}</h1>
          <p style={{ color: '#4b5563', margin: '8px 0 0 0', fontSize: '1rem' }}>
            Diagnostic assessment of numerical literacy growth and performance metrics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setShowAddTopicModal(true)}
            className="hover-btn"
            style={{ 
              backgroundColor: 'white', color: '#059669', padding: '10px 20px', 
              borderRadius: '8px', border: '1px solid #059669', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Plus size={18} /> Tambah Topik Numerasi
          </button>
          <button 
            onClick={() => setShowExportModal(true)}
            className="hover-btn"
            style={{ 
              backgroundColor: '#004282', color: 'white', padding: '10px 20px', 
              borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Download size={18} /> Export Laporan Kelas
          </button>
        </div>
      </div>

      {/* Top Section: Chart and Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Chart */}
        <div style={{ backgroundColor: 'white', border: '1px solid #004282', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 24px 0' }}>Tren Grafik Nilai</h3>
          <div style={{ flex: 1, minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '14px' }} />
                <Line type="monotone" name="Rata-rata Kelas" dataKey="rataRataKelas" stroke="#004282" strokeWidth={4} dot={{ r: 6, fill: '#004282' }} activeDot={{ r: 8 }} />
                <Line type="monotone" name={`Target KKM (${TARGET_KKM})`} dataKey="targetKKM" stroke="#f59e0b" strokeWidth={3} strokeDasharray="10 10" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 12px 0' }}>RATA-RATA KELAS</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '3.5rem', fontWeight: 800, color: '#004282', lineHeight: 1 }}>{classAverage}</span>
            </div>
          </div>
          <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 12px 0' }}>SISWA DI ATAS KKM</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '3.5rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>{studentsAboveKKM}</span>
              <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 600 }}>/ {students.length} Total</span>
            </div>
            <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${(studentsAboveKKM / (students.length || 1)) * 100}%`, height: '100%', backgroundColor: '#059669' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Data Nilai Numerasi Siswa</h2>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
            <input 
              type="text" 
              placeholder="Cari siswa..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              style={{ padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db', width: '250px', outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>NO</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>NAMA SISWA</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>NIS</th>
                {taskTitles.map((title, idx) => (
                  <th key={idx} style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>
                    {title}
                  </th>
                ))}
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#004282', textTransform: 'uppercase', backgroundColor: '#eff6ff' }}>RATA-RATA</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length > 0 ? paginatedStudents.map((siswa, index) => {
                let sSum = 0;
                let sCount = 0;
                siswa.tugasNum.forEach(t => {
                  if (t.score !== null) {
                    sSum += t.score;
                    sCount++;
                  }
                });
                const sAvg = sCount > 0 ? (sSum / sCount).toFixed(1) : '-';
                
                return (
                  <tr 
                    key={siswa.id} 
                    onClick={() => setSelectedStudent(siswa)}
                    style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px', color: '#4b5563' }}>{(page - 1) * itemsPerPage + index + 1}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: '#111827' }}>{siswa.name}</td>
                    <td style={{ padding: '16px 24px', color: '#6b7280' }}>{siswa.nis}</td>
                    {taskTitles.map((title, idx) => {
                      const task = siswa.tugasNum.find(t => t.title === title);
                      const score = task && task.score !== null ? task.score : '-';
                      const scoreColor = score !== '-' && score < TARGET_KKM ? '#dc2626' : '#111827';
                      return (
                        <td key={idx} style={{ padding: '16px 24px', textAlign: 'center', color: scoreColor, fontWeight: 500 }}>
                          {score}
                        </td>
                      );
                    })}
                    <td style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, color: sAvg !== '-' && sAvg < TARGET_KKM ? '#dc2626' : '#004282', backgroundColor: '#eff6ff' }}>
                      {sAvg}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={taskTitles.length + 3} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                    Tidak ada data siswa ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Menampilkan {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, filteredStudents.length)} dari {filteredStudents.length} siswa
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: page === 1 ? '#f3f4f6' : 'white', color: page === 1 ? '#9ca3af' : '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  style={{
                    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                    border: page === i + 1 ? 'none' : '1px solid #d1d5db',
                    backgroundColor: page === i + 1 ? '#004282' : 'white',
                    color: page === i + 1 ? 'white' : '#374151',
                    fontWeight: page === i + 1 ? 'bold' : 'normal'
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: page === totalPages ? '#f3f4f6' : 'white', color: page === totalPages ? '#9ca3af' : '#374151', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Topic Modal */}
      {showAddTopicModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>Tambah Topik Numerasi</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '24px' }}>
              Topik ini akan ditambahkan sebagai kolom baru untuk semua siswa di kelas ini.
            </p>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Judul Topik</label>
              <input 
                type="text" 
                value={newTopicTitle} 
                onChange={e => setNewTopicTitle(e.target.value)} 
                placeholder="Misal: Tes 1, Ulangan Harian..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }} 
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddTopicModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
              <button onClick={handleAddTopic} disabled={isAddingTopic} className="hover-btn" style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#059669', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                {isAddingTopic ? 'Menyimpan...' : 'Simpan Topik'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>Export Laporan Kelas</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '24px' }}>Unduh data nilai siswa dalam bentuk PDF.</p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Dari Tanggal (Opsional)</label>
              <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Sampai Tanggal (Opsional)</label>
              <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowExportModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
              <button onClick={confirmExport} className="hover-btn" style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#004282', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={16}/> Download PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Interaction Modal */}
      {selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>{selectedStudent.name}</h2>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>NIS: {selectedStudent.nis}</div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { window.location.reload(); }} className="hover-btn" style={{ padding: '8px 16px', backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #059669', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                  Simpan Data
                </button>
                <button onClick={() => setSelectedStudent(null)} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Tutup</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedStudent.tugasNum.length > 0 ? selectedStudent.tugasNum.map(tugas => (
                <div key={tugas.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                  <div style={{ flex: '1' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{tugas.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {tugas.fileUrl || tugas.score !== null ? (
                        <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Data tersimpan</span>
                      ) : 'Belum ada data'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {tugas.fileUrl || tugas.score !== null ? (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Nilai</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>{tugas.score !== null ? tugas.score : '-'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {tugas.fileUrl && (
                            <a href={tugas.fileUrl} target="_blank" rel="noreferrer" style={{ padding: '8px', backgroundColor: '#eff6ff', color: '#004282', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Eye size={18} />
                            </a>
                          )}
                          <button onClick={() => {
                            // Enable edit mode by temporarily clearing it in state to show the form
                            const updatedStudents = students.map(s => {
                              if (s.id === selectedStudent.id) {
                                const updatedTugas = s.tugasNum.map(t => {
                                  if (t.id === tugas.id) {
                                    return { ...t, _isEditing: true }; 
                                  }
                                  return t;
                                });
                                return { ...s, tugasNum: updatedTugas };
                              }
                              return s;
                            });
                            setStudents(updatedStudents);
                            setSelectedStudent(updatedStudents.find(s => s.id === selectedStudent.id));
                          }} style={{ padding: '8px', backgroundColor: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Edit3 size={18} />
                          </button>
                          <button onClick={() => handleDeleteTaskData(tugas.id)} style={{ padding: '8px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </>
                    ) : null}

                    {(!tugas.fileUrl && tugas.score === null) || tugas._isEditing ? (
                      <form onSubmit={(e) => handleUploadAndScore(e, tugas.id)} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px dashed #d1d5db', marginLeft: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>File Bukti (Opsional)</label>
                          <div style={{ position: 'relative', width: '220px', height: '36px' }}>
                            <input 
                              type="file" 
                              name="file" 
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                              style={{ 
                                position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 2 
                              }} 
                              onChange={(e) => {
                                const el = document.getElementById(`filename-display-${tugas.id}`);
                                if (el) {
                                  el.innerText = e.target.files[0] ? e.target.files[0].name : 'Pilih File...';
                                }
                              }}
                            />
                            <div style={{ 
                              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                              padding: '0 12px', borderRadius: '6px', backgroundColor: '#f3f4f6', 
                              border: '1px solid #d1d5db', color: '#4b5563', fontSize: '0.75rem', 
                              display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                              <span id={`filename-display-${tugas.id}`}>Pilih File...</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Nilai</label>
                          <input type="number" name="score" defaultValue={tugas.score || ''} placeholder="0-100" min="0" max="100" step="0.1" style={{ width: '80px', height: '36px', padding: '0 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '8px', paddingTop: '19px' }}>
                          <button type="submit" disabled={uploadingTaskId === tugas.id} style={{ height: '36px', padding: '0 16px', backgroundColor: '#004282', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                            {uploadingTaskId === tugas.id ? 'Menyimpan...' : 'Simpan'}
                          </button>
                          {tugas._isEditing && (
                            <button type="button" onClick={() => {
                              const updatedStudents = students.map(s => {
                                if (s.id === selectedStudent.id) {
                                  const updatedTugas = s.tugasNum.map(t => {
                                    if (t.id === tugas.id) {
                                      const { _isEditing, ...rest } = t;
                                      return rest;
                                    }
                                    return t;
                                  });
                                  return { ...s, tugasNum: updatedTugas };
                                }
                                return s;
                              });
                              setStudents(updatedStudents);
                              setSelectedStudent(updatedStudents.find(s => s.id === selectedStudent.id));
                            }} style={{ height: '36px', padding: '0 16px', marginLeft: '8px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                              Batal
                            </button>
                          )}
                        </div>
                      </form>
                    ) : null}
                  </div>

                </div>
              )) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '24px' }}>
                  Belum ada topik tugas untuk kelas ini. Klik "Tambah Topik Numerasi" untuk memulai.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
