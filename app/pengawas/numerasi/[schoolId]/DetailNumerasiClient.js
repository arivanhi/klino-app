'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, ChevronRight, Eye, AlertTriangle, ArrowLeft, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function DetailNumerasiClient({ schoolId, schoolName, schoolInfo, metrics, classes, chartData }) {
  const [activeTab, setActiveTab] = useState(classes.length > 0 ? classes[0].id : null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [activeSemesterTab, setActiveSemesterTab] = useState('Semester 1');

  const itemsPerPage = 10; // Maximun 10 students per page

  useEffect(() => {
    const event = new CustomEvent('setTopbarTitle', { detail: schoolName });
    window.dispatchEvent(event);
    return () => window.dispatchEvent(new CustomEvent('setTopbarTitle', { detail: '' }));
  }, [schoolName]);

  const confirmExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(0, 66, 130);
    doc.text(`Laporan Numerasi: ${schoolName}`, 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Klinik Literasi Numerasi (KLiNO)", 14, 28);
    
    let allTasks = [];
    classes.forEach(cls => {
      cls.students.forEach(s => {
        s.tasks.forEach(t => {
          const tDate = new Date(t.date);
          if (exportStartDate && tDate < new Date(exportStartDate)) return;
          if (exportEndDate && tDate > new Date(exportEndDate + 'T23:59:59')) return;
          allTasks.push([cls.name, s.name, s.nis, t.title, tDate.toLocaleDateString('id-ID'), s.avgScore || '-']);
        });
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
              head: [['Kelas', 'Nama Siswa', 'NIS', 'Judul Tugas', 'Tanggal', 'Rata-rata Nilai Siswa']],
              body: chunk,
              startY: chunkIdx === 0 ? 35 : 20,
              theme: 'striped',
              styles: { fontSize: 10 },
              headStyles: { fillColor: [0, 66, 130] }
          });
      });
    }
    
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Halaman ${i}`, 105, 290, { align: 'center' });
    }
    doc.save(`Laporan_Numerasi_${schoolName}.pdf`);
    setShowExportModal(false);
  };

  const activeClass = classes.find(c => c.id === activeTab);
  let students = activeClass ? [...activeClass.students] : [];

  if (sortConfig.key) {
    students.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(students.length / itemsPerPage);
  const paginatedStudents = students.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Unggul': return { bg: '#cffafe', text: '#0891b2', border: '#67e8f9' };
      case 'Aman': return { bg: '#d1fae5', text: '#059669', border: '#6ee7b7' };
      case 'Pantau': return { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' };
      case 'Klinik': return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
      default: return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' };
    }
  };

  // Recharts custom dot
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (payload.score === null) return null;
    return (
      <circle cx={cx} cy={cy} r={6} fill="#fbbf24" stroke="white" strokeWidth={2} />
    );
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
        <Link href="/pengawas/numerasi" style={{ color: '#004282', textDecoration: 'none' }}>Numeracy</Link>
        <ChevronRight size={14} />
        <span style={{ color: '#111827' }}>{schoolName}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <Link href="/pengawas/numerasi" className="hover-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #e5e7eb', color: '#4b5563', textDecoration: 'none', transition: 'all 0.2s', flexShrink: 0 }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <h1 style={{ fontSize: '2rem', color: '#111827', margin: 0, fontWeight: 700 }}>Detail Numerasi - {schoolName}</h1>
          <button 
            onClick={() => setShowExportModal(true)}
            className="hover-btn"
            style={{ 
              backgroundColor: '#004282', color: 'white', padding: '10px 20px', 
              borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Download size={18} /> Export Laporan Numerasi
          </button>
        </div>
      </div>

      {/* Informasi Sekolah */}
      {schoolInfo && (
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#111827', margin: '0 0 8px 0', fontWeight: 700 }}>Informasi Sekolah</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
            <div><span style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>NPSN</span><strong style={{ color: '#111827' }}>{schoolInfo.npsn}</strong></div>
            <div><span style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Kecamatan</span><strong style={{ color: '#111827' }}>{schoolInfo.kecamatan}</strong></div>
            <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Alamat</span><strong style={{ color: '#111827' }}>{schoolInfo.address}</strong></div>
            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', margin: '8px 0' }}></div>
            <div><span style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Guru Pendamping</span><strong style={{ color: '#111827' }}>{schoolInfo.guruNames}</strong></div>
            <div><span style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Mentor</span><strong style={{ color: '#111827' }}>{schoolInfo.mentorNames}</strong></div>
          </div>
        </div>
      )}

      {/* Top Cards (3 Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        <div className="hover-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#004282', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 16px 0', maxWidth: '60%' }}>Rata-rata Nilai Numerasi</h3>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#004282', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.25rem' }}>
              &Sigma;
            </div>
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#111827', marginBottom: '8px', lineHeight: 1 }}>{metrics.avgScore}</div>
          <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
            +2.1% dari periode lalu
          </div>
        </div>

        <div className="hover-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#004282', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 16px 0', maxWidth: '60%' }}>Progres Asesmen</h3>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#111827', marginBottom: '16px', lineHeight: 1 }}>{metrics.progressPercent}%</div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ width: `${Math.min(100, metrics.progressPercent)}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '4px' }}></div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'right', fontWeight: 600 }}>
            {metrics.studentsWithTask}/{metrics.totalStudents} Siswa
          </div>
        </div>

        <div className="hover-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#dc2626', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 16px 0', maxWidth: '80%' }}>Siswa Membutuhkan Klinik</h3>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#dc2626', marginBottom: '8px', lineHeight: 1 }}>{metrics.clinicStudentsCount}</div>
          <div style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
             Siswa dengan nilai di bawah KKM
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#111827', margin: 0, fontWeight: 700 }}>Tren Perkembangan Numerasi</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setActiveSemesterTab('Semester 1')}
              style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #e5e7eb',
                backgroundColor: activeSemesterTab === 'Semester 1' ? 'white' : 'transparent',
                color: activeSemesterTab === 'Semester 1' ? '#4b5563' : '#9ca3af'
               }}
            >
              Semester 1
            </button>
            <button 
              onClick={() => setActiveSemesterTab('Semester 2')}
              style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                backgroundColor: activeSemesterTab === 'Semester 2' ? '#004282' : 'transparent',
                color: activeSemesterTab === 'Semester 2' ? 'white' : '#9ca3af'
               }}
            >
              Semester 2
            </button>
          </div>
        </div>
        
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={{ stroke: '#d1d5db' }} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#4b5563', fontWeight: 600 }}
                itemStyle={{ color: '#111827', fontWeight: 700 }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#f59e0b" 
                strokeWidth={3} 
                dot={<CustomDot />} 
                activeDot={{ r: 8, fill: '#f59e0b', stroke: 'white', strokeWidth: 2 }}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Section */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {/* Table Header with Dropdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#111827', margin: 0, fontWeight: 700 }}>Daftar Nilai Numerasi Siswa</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: 500 }}>Pilih Kelas:</span>
            <select 
              value={activeTab || ''} 
              onChange={(e) => { setActiveTab(parseInt(e.target.value)); setPage(1); }}
              style={{ padding: '8px 32px 8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.875rem', fontWeight: 500, color: '#111827', appearance: 'none', background: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right 12px center / 10px 10px' }}
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', width: '5%' }}>No</th>
                <th onClick={() => handleSort('name')} style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', cursor: 'pointer', width: '20%' }}>Nama Siswa {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('nis')} style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', cursor: 'pointer', width: '15%' }}>NIS {sortConfig.key === 'nis' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>JML TUGAS (DINILAI)</th>
                <th onClick={() => handleSort('avgScore')} style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', cursor: 'pointer' }}>Rata-rata {sortConfig.key === 'avgScore' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Tidak ada siswa di kelas ini.</td>
                </tr>
              ) : (
                paginatedStudents.map((s, idx) => {
                  const badge = getStatusBadge(s.status);
                  return (
                  <tr 
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', backgroundColor: 'white', transition: 'background-color 0.2s' }}
                    className="hover:bg-gray-50"
                  >
                    <td style={{ padding: '20px 24px', color: '#4b5563', fontSize: '0.875rem' }}>{(page - 1) * itemsPerPage + idx + 1}</td>
                    <td style={{ padding: '20px 24px', color: '#111827', fontSize: '0.875rem', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '20px 24px', color: '#4b5563', fontSize: '0.875rem' }}>{s.nis || '-'}</td>
                    <td style={{ padding: '20px 24px', color: '#4b5563', fontSize: '0.875rem' }}>{s.tasks.filter(t => t.score !== null).length}</td>
                    <td style={{ padding: '20px 24px', color: '#111827', fontSize: '0.875rem', fontWeight: 700 }}>{s.avgScore}</td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ 
                        padding: '4px 12px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600,
                        backgroundColor: badge.bg, color: badge.text, border: `1px solid ${badge.border}`
                      }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: 'white' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
              Menampilkan {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, students.length)} dari {students.length} Siswa ({activeClass?.name})
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setPage(1)}
                disabled={page === 1}
                style={{ padding: '8px 12px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#4b5563' }}
              >
                &laquo;
              </button>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '8px 12px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#4b5563', display: 'flex', alignItems: 'center' }}
              >
                <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }}/>
              </button>
              <button style={{ padding: '8px 14px', border: 'none', backgroundColor: '#004282', color: 'white', borderRadius: '6px', fontWeight: 600 }}>
                {page}
              </button>
              {page < totalPages && (
                <button 
                  onClick={() => setPage(p => p + 1)}
                  style={{ padding: '8px 14px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}
                >
                  {page + 1}
                </button>
              )}
              {page < totalPages - 1 && <span style={{ padding: '8px 4px', color: '#6b7280' }}>...</span>}
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '8px 12px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#4b5563', display: 'flex', alignItems: 'center' }}
              >
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Export Laporan Numerasi</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '24px' }}>Pilih periode waktu tugas yang ingin di-export (opsional).</p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Tanggal Mulai</label>
              <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }} />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Tanggal Akhir</label>
              <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowExportModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
              <button onClick={confirmExport} className="hover-btn" style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#004282', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={16}/> Download PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '600px', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Detail Penugasan: {selectedStudent.name}</h2>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 0 0 0' }}>NIS: {selectedStudent.nis || '-'}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#9ca3af', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
              {selectedStudent.tasks.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '8px' }}>Belum ada tugas numerasi yang dikerjakan.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedStudent.tasks.map(t => (
                    <div key={t.id} style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem', marginBottom: '4px' }}>{t.title}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{new Date(t.date).toLocaleDateString('id-ID')} {t.score ? `• Nilai Tugas: ${t.score}` : ''}</div>
                      </div>
                      {t.fileUrl ? (
                        <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" className="hover-btn" style={{ width: '40px', height: '40px', backgroundColor: '#eff6ff', color: '#004282', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Eye size={18} />
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>No File</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button onClick={() => setSelectedStudent(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', fontWeight: 600, cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
