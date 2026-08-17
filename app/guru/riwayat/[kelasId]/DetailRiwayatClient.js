'use client';

import React, { useState, useEffect } from 'react';
import { Download, ChevronRight, Eye, ChevronLeft, Search } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function DetailRiwayatClient({ kelasName, schoolName, students }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [showExportModal, setShowExportModal] = useState(false);

  const itemsPerPage = 5;

  useEffect(() => {
    const event = new CustomEvent('setTopbarTitle', { detail: `Riwayat: Kelas ${kelasName}` });
    window.dispatchEvent(event);
    return () => window.dispatchEvent(new CustomEvent('setTopbarTitle', { detail: '' }));
  }, [kelasName]);

  const confirmExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(0, 66, 130);
    doc.text(`Riwayat Lino: Kelas ${kelasName}`, 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(schoolName, 14, 28);
    
    let tableData = students.map((s, idx) => [
      idx + 1, s.name, s.nis, s.avgLit, s.avgNum, s.status
    ]);

    if (tableData.length === 0) {
      doc.text("Tidak ada data.", 14, 40);
    } else {
      doc.autoTable({
          head: [['No', 'Nama Siswa', 'NIS', 'Rata-Rata Literasi', 'Rata-Rata Numerasi', 'Status']],
          body: tableData,
          startY: 35,
          theme: 'striped',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [0, 66, 130] }
      });
    }
    
    doc.save(`Riwayat_${kelasName}.pdf`);
    setShowExportModal(false);
  };

  let filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.nis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (sortConfig.key) {
    filteredStudents.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (['avgLit', 'avgNum'].includes(sortConfig.key)) {
        valA = valA === '-' ? -1 : parseFloat(valA);
        valB = valB === '-' ? -1 : parseFloat(valB);
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Stabil': return { bg: '#d1fae5', text: '#059669', border: '#6ee7b7' };
      case 'Klinik': return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
      default: return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
        <Link href="/guru/riwayat" style={{ color: '#004282', textDecoration: 'none' }}>Riwayat Lino</Link>
        <ChevronRight size={14} />
        <span style={{ color: '#111827' }}>Kelas {kelasName}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#111827', margin: 0, fontWeight: 700 }}>Riwayat Lino: Kelas {kelasName}</h1>
            <p style={{ color: '#4b5563', margin: '8px 0 0 0', fontSize: '1rem' }}>Data literasi dan numerasi siswa di kelas ini.</p>
          </div>
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

      {/* Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#111827', margin: 0, fontWeight: 700 }}>Daftar Siswa</h2>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari nama / NIS..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #d1d5db', width: '250px', fontSize: '0.875rem' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', width: '5%' }}>No</th>
                <th onClick={() => handleSort('name')} style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', cursor: 'pointer', width: '25%' }}>Nama Siswa {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('nis')} style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', cursor: 'pointer', width: '15%' }}>NIS {sortConfig.key === 'nis' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('avgLit')} style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', cursor: 'pointer' }}>Rata-rata Literasi {sortConfig.key === 'avgLit' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => handleSort('avgNum')} style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', cursor: 'pointer' }}>Rata-rata Numerasi {sortConfig.key === 'avgNum' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>Status</th>
                <th style={{ padding: '16px 24px', width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Tidak ada siswa ditemukan.</td>
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
                    <td style={{ padding: '16px 24px', color: '#4b5563', fontSize: '0.875rem' }}>{(page - 1) * itemsPerPage + idx + 1}</td>
                    <td style={{ padding: '16px 24px', color: '#111827', fontSize: '0.875rem', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '16px 24px', color: '#4b5563', fontSize: '0.875rem' }}>{s.nis || '-'}</td>
                    <td style={{ padding: '16px 24px', color: '#004282', fontSize: '0.875rem', fontWeight: 700 }}>{s.avgLit}</td>
                    <td style={{ padding: '16px 24px', color: '#d97706', fontSize: '0.875rem', fontWeight: 700 }}>{s.avgNum}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 12px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600,
                        backgroundColor: badge.bg, color: badge.text, border: `1px solid ${badge.border}`
                      }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <ChevronRight size={18} color="#6b7280" />
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
              Menampilkan {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, filteredStudents.length)} dari {filteredStudents.length} Siswa
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
                <ChevronLeft size={16} />
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>Export Laporan Kelas</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '24px' }}>Laporan akan berisi ringkasan nilai siswa di kelas ini.</p>
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
          <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '800px', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Detail Siswa: {selectedStudent.name}</h2>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 0 0 0' }}>NIS: {selectedStudent.nis || '-'}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#9ca3af', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
              <h3 style={{ fontSize: '1rem', color: '#111827', margin: '0 0 12px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>Riwayat Literasi</h3>
              {selectedStudent.litTasks.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '24px' }}>Belum ada tugas literasi.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {selectedStudent.litTasks.map(t => (
                    <div key={t.id} style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem', marginBottom: '4px' }}>{t.title}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{new Date(t.date).toLocaleDateString('id-ID')} {t.score !== null ? `• Nilai: ${t.score}` : ''}</div>
                      </div>
                      {t.fileUrl && (
                        <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" className="hover-btn" style={{ width: '36px', height: '36px', backgroundColor: '#eff6ff', color: '#004282', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Eye size={16} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <h3 style={{ fontSize: '1rem', color: '#111827', margin: '0 0 12px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>Riwayat Numerasi</h3>
              {selectedStudent.numTasks.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '8px' }}>Belum ada data numerasi.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedStudent.numTasks.map(t => (
                    <div key={t.id} style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem', marginBottom: '4px' }}>{t.title}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{new Date(t.date).toLocaleDateString('id-ID')} {t.score !== null ? `• Nilai: ${t.score}` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '24px', textAlign: 'right', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <button onClick={() => setSelectedStudent(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', fontWeight: 600, cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
