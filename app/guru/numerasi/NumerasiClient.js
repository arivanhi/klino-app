'use client';

import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, AlertTriangle, Activity } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function NumerasiClient({ schoolId, schoolName, metrics, classes }) {
  const [activeTab, setActiveTab] = useState('Semua Kelas');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportKelasId, setExportKelasId] = useState('all');

  // Variabel Threshold untuk mempermudah edit
  const thresholds = {
    unggul: 80, // Di atas rata-rata (Hijau)
    aman: 70,   // Sesuai target (Biru)
    pantau: 66  // Batas ambang (Kuning)
    // < 66: Perlu Intervensi (Merah)
  };

  useEffect(() => {
    const event = new CustomEvent('setTopbarTitle', { detail: 'Numerasi' });
    window.dispatchEvent(event);
    return () => window.dispatchEvent(new CustomEvent('setTopbarTitle', { detail: '' }));
  }, []);

  const getTabFilters = () => {
    const prefixes = new Set();
    classes.forEach(c => {
      const parts = c.name.split(' ');
      if (parts.length >= 2 && parts[0].toLowerCase() === 'kelas') {
        prefixes.add(`${parts[0]} ${parts[1]}`);
      }
    });
    return ['Semua Kelas', ...Array.from(prefixes).sort()];
  };
  
  const tabFilters = getTabFilters();

  const getFilteredClasses = () => {
    if (activeTab === 'Semua Kelas') return classes;
    return classes.filter(c => c.name.startsWith(activeTab));
  };

  const filteredClasses = getFilteredClasses();
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const paginatedClasses = filteredClasses.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const confirmExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(0, 66, 130);
    doc.text(`Laporan Numerasi: ${schoolName}`, 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Klinik Literasi Numerasi (KLiNO)", 14, 28);
    
    let allTasks = [];
    const classesToExport = exportKelasId === 'all' ? classes : classes.filter(c => c.id.toString() === exportKelasId);
    
    classesToExport.forEach(cls => {
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

  const getStatusDisplay = (score) => {
    if (score >= thresholds.unggul) return { color: '#059669', bg: '#059669', label: 'Di atas rata-rata' }; // Hijau
    if (score >= thresholds.aman) return { color: '#004282', bg: '#004282', label: 'Sesuai target' }; // Biru
    if (score >= thresholds.pantau) return { color: '#d97706', bg: '#f59e0b', label: 'Batas ambang' }; // Kuning
    return { color: '#dc2626', bg: '#dc2626', label: 'Perlu Intervensi' }; // Merah
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: '#111827', margin: 0, fontWeight: 700 }}>Monitoring Numerasi</h1>
          <p style={{ color: '#4b5563', margin: '8px 0 0 0', fontSize: '1rem' }}>Tinjauan performa numerasi siswa berdasarkan data klinis semester ganjil.</p>
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
          <Download size={18} /> Export Laporan Numerasi
        </button>
      </div>

      {/* Top Cards (3 Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#004282', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}></div>
          <h3 style={{ color: '#4b5563', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RATA-RATA ANGKATAN</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{metrics.avgScore}</span>
            <span style={{ fontSize: '1.25rem', color: '#6b7280', fontWeight: 600 }}>/100</span>
          </div>
          {/* Mock trend badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
             <Activity size={12} /> +2.4 dari bulan lalu
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#f59e0b', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}></div>
          <h3 style={{ color: '#4b5563', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SISWA INTERVENSI</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{metrics.clinicStudentsCount}</span>
            <span style={{ fontSize: '1rem', color: '#6b7280' }}>siswa</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
             <AlertTriangle size={12} /> Perlu perhatian khusus
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#059669', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}></div>
          <h3 style={{ color: '#4b5563', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TINGKAT PARTISIPASI UJIAN</h3>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#111827', marginBottom: '16px', lineHeight: 1 }}>{metrics.progressPercent}%</div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, metrics.progressPercent)}%`, height: '100%', backgroundColor: '#004282', borderRadius: '4px' }}></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px', overflowX: 'auto' }}>
        {tabFilters.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            style={{
              background: 'none', border: 'none', padding: '0 0 12px 0',
              color: activeTab === tab ? '#004282' : '#6b7280',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: '1rem', cursor: 'pointer', whiteSpace: 'nowrap',
              borderBottom: activeTab === tab ? '3px solid #004282' : '3px solid transparent'
            }}
          >
            {tab === 'Semua Kelas' ? `Semua Kelas (${classes.length})` : tab}
          </button>
        ))}
      </div>

      {/* Class Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {paginatedClasses.length > 0 ? paginatedClasses.map((cls) => {
          const statusDisplay = getStatusDisplay(cls.avgScore);
          
          return (
            <Link href={`/guru/numerasi/${cls.id}`} key={cls.id} style={{ textDecoration: 'none', display: 'block' }}>
              <div className="hover-card" style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>{cls.name}</h3>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      {cls.totalStudents} Siswa
                    </div>
                  </div>
                  <div style={{ color: '#9ca3af' }}>
                    <ExternalLink size={20} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px', marginTop: 'auto' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', letterSpacing: '0.05em', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Rata-Rata Nilai Numerasi
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: statusDisplay.color, lineHeight: 1 }}>{cls.avgScore}</span>
                    <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 600 }}>/100</span>
                  </div>
                  
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ width: `${Math.min(100, cls.avgScore)}%`, height: '100%', backgroundColor: statusDisplay.bg, borderRadius: '3px' }}></div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: statusDisplay.color }}>
                    {statusDisplay.label}
                  </div>
                </div>

              </div>
            </Link>
          );
        }) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', color: '#6b7280' }}>
            Belum ada data kelas yang sesuai.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
          <div style={{ color: '#4b5563', fontSize: '0.875rem' }}>
            Menampilkan {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, filteredClasses.length)} dari {filteredClasses.length} Kelas
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: page === 1 ? '#f3f4f6' : 'white', color: page === 1 ? '#9ca3af' : '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                style={{
                  padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
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
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: page === totalPages ? '#f3f4f6' : 'white', color: page === totalPages ? '#9ca3af' : '#374151', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>Export Laporan Numerasi</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '24px' }}>Pilih filter data laporan numerasi yang ingin Anda unduh.</p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Pilih Kelas</label>
              <select 
                value={exportKelasId} 
                onChange={e => setExportKelasId(e.target.value)} 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
              >
                <option value="all">Semua Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

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

    </div>
  );
}
