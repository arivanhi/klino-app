'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, ChevronRight, ChevronDown, Eye, AlertTriangle, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function DetailClient({ schoolId, schoolName, metrics, classes }) {
  const [activeTab, setActiveTab] = useState(classes.length > 0 ? classes[0].id : null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const itemsPerPage = 10;

  useEffect(() => {
    const event = new CustomEvent('setTopbarTitle', { detail: schoolName });
    window.dispatchEvent(event);
    return () => window.dispatchEvent(new CustomEvent('setTopbarTitle', { detail: '' }));
  }, [schoolName]);

  // Handle Export
  const confirmExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(0, 66, 130);
    doc.text(`Laporan Literasi: ${schoolName}`, 14, 20);
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
          allTasks.push([cls.name, s.name, s.nis, t.title, tDate.toLocaleDateString('id-ID'), t.score || '-']);
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
              head: [['Kelas', 'Nama Siswa', 'NIS', 'Judul Tugas', 'Tanggal', 'Nilai']],
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
        doc.setTextColor(150, 150, 150);
        doc.text(`Halaman ${i}`, 105, 290, { align: 'center' });
    }
    doc.save(`Laporan_${schoolName}.pdf`);
    setShowExportModal(false);
  };

  // Sort and Paginate
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

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
        <Link href="/pengawas/literasi" style={{ color: '#004282', textDecoration: 'none' }}>Literasi</Link>
        <ChevronRight size={14} />
        <span style={{ color: '#111827' }}>{schoolName}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <Link href="/pengawas/literasi" className="hover-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #e5e7eb', color: '#4b5563', textDecoration: 'none', transition: 'all 0.2s', flexShrink: 0 }}>
          <ArrowLeft size={24} />
        </Link>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <h1 style={{ fontSize: '2rem', color: '#111827', margin: 0, fontWeight: 700 }}>Detail Literasi - {schoolName}</h1>
          <button 
            onClick={() => setShowExportModal(true)}
            className="hover-btn"
            style={{ 
              backgroundColor: 'white', color: '#004282', padding: '10px 20px', 
              borderRadius: '8px', border: '1px solid #004282', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Download size={18} /> Export Laporan Literasi
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        <div className="hover-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#004282' }}></div>
          <h3 style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rata-rata Nilai Literasi</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>{metrics.avgScore}</span>
            <span style={{ color: '#4b5563', fontSize: '1.25rem', fontWeight: 600 }}>%</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, metrics.avgScore)}%`, height: '100%', backgroundColor: '#004282', borderRadius: '4px' }}></div>
          </div>
        </div>

        <div className="hover-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#059669' }}></div>
          <h3 style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Tugas Selesai</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>{metrics.totalTasks}</span>
            <span style={{ color: '#4b5563', fontSize: '1rem', fontWeight: 600 }}>Tugas</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `100%`, height: '100%', backgroundColor: '#059669', borderRadius: '4px' }}></div>
          </div>
        </div>

        <div className="hover-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#f59e0b' }}></div>
          <h3 style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Siswa Aktif</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>{metrics.activeStudents}</span>
            <span style={{ color: '#4b5563', fontSize: '1rem', fontWeight: 600 }}>Siswa</span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#059669', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
            +5% dari bulan lalu
          </div>
        </div>

        <div className="hover-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #fee2e2', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#dc2626' }}></div>
          <h3 style={{ color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kelas Butuh Klinik</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#b91c1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{metrics.classNeedingClinic}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
             <AlertTriangle size={14} /> Nilai rata-rata &lt; 60
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '24px', display: 'flex', gap: '32px', overflowX: 'auto' }}>
        {classes.length === 0 ? (
          <div style={{ paddingBottom: '12px', color: '#6b7280' }}>Tidak ada kelas ditemukan</div>
        ) : (
          classes.map(c => (
            <button 
              key={c.id} 
              onClick={() => { setActiveTab(c.id); setPage(1); }}
              style={{ 
                background: 'none', border: 'none', padding: '0 0 16px 0', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                color: activeTab === c.id ? '#004282' : '#6b7280',
                borderBottom: activeTab === c.id ? '3px solid #004282' : '3px solid transparent',
                whiteSpace: 'nowrap'
              }}
            >
              {c.name}
            </button>
          ))
        )}
      </div>

      {/* Table */}
      {classes.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', width: '5%' }}>No</th>
                  <th onClick={() => handleSort('name')} style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', cursor: 'pointer', width: '35%' }}>Nama {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => handleSort('nis')} style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', cursor: 'pointer', width: '25%' }}>NIS {sortConfig.key === 'nis' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th onClick={() => handleSort('taskCount')} style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', cursor: 'pointer', width: '25%' }}>Jml Tugas {sortConfig.key === 'taskCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th style={{ padding: '16px', width: '10%' }}></th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Tidak ada siswa di kelas ini.</td>
                  </tr>
                ) : (
                  paginatedStudents.map((s, idx) => (
                      <tr 
                        key={s.id}
                        onClick={() => setSelectedStudent(s)}
                        style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', backgroundColor: 'white', transition: 'background-color 0.2s' }}
                        className="hover:bg-gray-50"
                      >
                        <td style={{ padding: '16px', color: '#4b5563', fontSize: '0.875rem' }}>{(page - 1) * itemsPerPage + idx + 1}</td>
                        <td style={{ padding: '16px', color: '#111827', fontSize: '0.875rem', fontWeight: 500 }}>{s.name}</td>
                        <td style={{ padding: '16px', color: '#4b5563', fontSize: '0.875rem' }}>{s.nis || '-'}</td>
                        <td style={{ padding: '16px', color: '#4b5563', fontSize: '0.875rem' }}>{s.taskCount}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <ChevronRight size={18} color="#6b7280" />
                        </td>
                      </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: 'white', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Halaman {page} dari {totalPages}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '6px 12px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#4b5563', fontSize: '0.875rem' }}
                >
                  Prev
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: '6px 12px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#4b5563', fontSize: '0.875rem' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Export Laporan Literasi</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '24px' }}>Pilih periode waktu tugas yang ingin di-export (opsional).</p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Tanggal Mulai</label>
              <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Tanggal Akhir</label>
              <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
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
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '8px' }}>Belum ada tugas yang dikerjakan.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedStudent.tasks.map(t => (
                    <div key={t.id} style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem', marginBottom: '4px' }}>{t.title}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{new Date(t.date).toLocaleDateString('id-ID')} {t.score ? `• Nilai: ${t.score}` : ''}</div>
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
