'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, ChevronRight, BookOpen, LayoutGrid, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function RiwayatClient({ classes, schoolName, semesters, selectedSemesterId }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportClassId, setExportClassId] = useState('all');

  useEffect(() => {
    const event = new CustomEvent('setTopbarTitle', { detail: 'Riwayat Lino' });
    window.dispatchEvent(event);
    return () => window.dispatchEvent(new CustomEvent('setTopbarTitle', { detail: '' }));
  }, []);

  const handleSemesterChange = (e) => {
    const semId = e.target.value;
    router.push(`/guru/riwayat?semesterId=${semId}`);
  };

  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const paginatedClasses = filteredClasses.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getProgressColor = (score) => {
    const num = parseFloat(score);
    if (num >= 75) return '#059669';
    if (num >= 60) return '#d97706';
    return '#dc2626';
  };

  const confirmExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(0, 66, 130);
    doc.text(`Riwayat Laporan Lino: ${schoolName}`, 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const selectedSem = semesters.find(s => s.id === parseInt(selectedSemesterId));
    const semText = selectedSem ? `Semester ${selectedSem.jenis} ${selectedSem.tahunAjaran}` : '';
    doc.text(semText, 14, 28);
    
    // Create simple summary table since we don't fetch all task details here
    const exportData = [];
    filteredClasses.forEach(cls => {
      if (exportClassId === 'all' || exportClassId === cls.id.toString()) {
        exportData.push([
          cls.name,
          `${cls.participantStudents} / ${cls.totalStudents}`,
          cls.semesterText,
          cls.avgLit + '%',
          cls.avgNum + '%'
        ]);
      }
    });

    if (exportData.length === 0) {
      doc.text("Tidak ada data.", 14, 40);
    } else {
      doc.autoTable({
        head: [['Nama Kelas', 'Siswa Partisipan', 'Semester', 'Rata-rata Literasi', 'Rata-rata Numerasi']],
        body: exportData,
        startY: 35,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 66, 130] }
      });
    }
    
    doc.save(`Riwayat_Lino_${schoolName.replace(/ /g, '_')}.pdf`);
    setShowExportModal(false);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', color: '#111827', margin: 0, fontWeight: 700 }}>Riwayat Lino</h1>
          <p style={{ color: '#4b5563', margin: '8px 0 0 0', fontSize: '1rem' }}>Class diagnostic history and performance trends.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select 
            value={selectedSemesterId || ''} 
            onChange={handleSemesterChange}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: 'white', color: '#111827', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
          >
            {semesters.map(s => (
              <option key={s.id} value={s.id}>
                Semester {s.jenis} {s.tahunAjaran}
              </option>
            ))}
          </select>
          
          <button 
            onClick={() => setShowExportModal(true)}
            className="hover-btn"
            style={{ 
              backgroundColor: '#004282', color: 'white', padding: '10px 20px', 
              borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Download size={18} /> Export Laporan Lino
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '24px', position: 'relative' }}>
         <Search size={18} color="#6b7280" style={{ position: 'absolute', left: '12px' }} />
         <input 
           type="text" 
           placeholder="Cari kelas..."
           value={searchTerm}
           onChange={(e) => {
             setSearchTerm(e.target.value);
             setPage(1);
           }}
           style={{ padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #d1d5db', width: '300px', fontSize: '0.875rem' }}
         />
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
        {paginatedClasses.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
            Tidak ada kelas yang ditemukan.
          </div>
        ) : (
          paginatedClasses.map(cls => (
            <Link href={`/guru/riwayat/${cls.id}?semesterId=${selectedSemesterId}`} key={cls.id} style={{ textDecoration: 'none' }}>
              <div className="hover-card" style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', transition: 'all 0.2s', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', color: '#111827', fontWeight: 700 }}>{cls.name}</h3>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                      {cls.totalStudents} Students &bull; {cls.semesterText}
                    </div>
                  </div>
                  <ChevronRight size={20} color="#9ca3af" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Literasi */}
                  <div style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', fontSize: '0.875rem', fontWeight: 600 }}>
                        <BookOpen size={16} /> Literasi
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: getProgressColor(cls.avgLit) }}>
                        {cls.avgLit}%
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', backgroundColor: getProgressColor(cls.avgLit), width: `${cls.avgLit}%` }}></div>
                    </div>
                  </div>

                  {/* Numerasi */}
                  <div style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', fontSize: '0.875rem', fontWeight: 600 }}>
                        <LayoutGrid size={16} /> Numerasi
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: getProgressColor(cls.avgNum) }}>
                        {cls.avgNum}%
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', backgroundColor: getProgressColor(cls.avgNum), width: `${cls.avgNum}%` }}></div>
                    </div>
                  </div>
                </div>

              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: page === 1 ? '#f3f4f6' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#374151' }}
          >
            &lt;
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button 
              key={i}
              onClick={() => setPage(i + 1)}
              style={{ padding: '8px 16px', border: page === i + 1 ? 'none' : '1px solid #d1d5db', borderRadius: '6px', backgroundColor: page === i + 1 ? '#004282' : 'white', color: page === i + 1 ? 'white' : '#374151', fontWeight: page === i + 1 ? 600 : 400, cursor: 'pointer' }}
            >
              {i + 1}
            </button>
          ))}
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: page === totalPages ? '#f3f4f6' : 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#374151' }}
          >
            &gt;
          </button>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>Export Laporan</h2>
              <button onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Pilih Kelas</label>
              <select 
                value={exportClassId} 
                onChange={e => setExportClassId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
              >
                <option value="all">Keseluruhan Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Dari Tanggal (Opsional)</label>
              <input 
                type="date" 
                value={exportStartDate}
                onChange={e => setExportStartDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Sampai Tanggal (Opsional)</label>
              <input 
                type="date" 
                value={exportEndDate}
                onChange={e => setExportEndDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
              />
            </div>

            <button 
              onClick={confirmExport}
              style={{ width: '100%', padding: '12px', backgroundColor: '#004282', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              Export PDF
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
