'use client';

import React, { useState, useEffect } from 'react';
import { Download, ChevronRight, Eye, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function LiterasiClient({ schoolId, schoolName, metrics, classes }) {
  const router = useRouter();
  const [classPage, setClassPage] = useState(1);
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportClassId, setExportClassId] = useState('all');

  const classesPerPage = 6;

  useEffect(() => {
    const event = new CustomEvent('setTopbarTitle', { detail: 'Literasi' });
    window.dispatchEvent(event);
    return () => window.dispatchEvent(new CustomEvent('setTopbarTitle', { detail: '' }));
  }, []);

  const confirmExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(0, 66, 130);
    doc.text(`Laporan Literasi: ${schoolName}`, 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Klinik Literasi Numerasi (KLiNO)", 14, 28);
    
    let allTasks = [];
    let targetClasses = exportClassId === 'all' ? classes : classes.filter(c => c.id.toString() === exportClassId);

    targetClasses.forEach(cls => {
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
    doc.save(`Laporan_Literasi_${schoolName}.pdf`);
    setShowExportModal(false);
  };

  const handleClassClick = (classId) => {
    router.push(`/guru/literasi/${classId}`);
  };

  const totalClassPages = Math.ceil(classes.length / classesPerPage);
  const paginatedClasses = classes.slice((classPage - 1) * classesPerPage, classPage * classesPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Selesai': return '#059669'; // Green
      case 'Membutuhkan Perhatian': return '#dc2626'; // Red
      default: return '#f59e0b'; // Orange
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#111827', margin: 0, fontWeight: 700 }}>Monitoring Literasi</h1>
            <p style={{ color: '#4b5563', margin: '8px 0 0 0', fontSize: '1rem' }}>Pilih kelas untuk melihat detail penugasan dan progres siswa.</p>
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
            <Download size={18} /> Export Laporan Literasi
          </button>
        </div>
      </div>

      {/* Class Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {paginatedClasses.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#6b7280', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            Tidak ada data kelas.
          </div>
        ) : (
          paginatedClasses.map(cls => (
            <div 
              key={cls.id} 
              className="hover-card"
              onClick={() => handleClassClick(cls.id)}
              style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827', fontWeight: 700 }}>{cls.name}</h2>
                <ChevronRight size={20} color="#9ca3af" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pengerjaan Literasi</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{cls.progress}%</div>
              </div>

              <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${cls.progress}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '4px' }}></div>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#4b5563', fontWeight: 500, marginBottom: '24px' }}>
                {cls.status}
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: 500 }}>Jumlah Tugas</span>
                <div style={{ backgroundColor: '#f3f4f6', padding: '6px 12px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>
                  {cls.jumlahTugas} Tugas
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Class Pagination */}
      {totalClassPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
          <button 
            onClick={() => setClassPage(p => Math.max(1, p - 1))}
            disabled={classPage === 1}
            style={{ padding: '8px 16px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: classPage === 1 ? 'not-allowed' : 'pointer', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            &lt; Prev
          </button>
          
          {Array.from({ length: totalClassPages }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              onClick={() => setClassPage(num)}
              style={{
                padding: '8px 14px',
                border: '1px solid #d1d5db',
                backgroundColor: classPage === num ? '#004282' : 'white',
                color: classPage === num ? 'white' : '#4b5563',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {num}
            </button>
          ))}

          <button 
            onClick={() => setClassPage(p => Math.min(totalClassPages, p + 1))}
            disabled={classPage === totalClassPages}
            style={{ padding: '8px 16px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: classPage === totalClassPages ? 'not-allowed' : 'pointer', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Next &gt;
          </button>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>Export Laporan Literasi</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '24px', marginTop: 0 }}>Pilih kelas dan periode waktu tugas (opsional).</p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Pilih Kelas</label>
              <select 
                value={exportClassId} 
                onChange={e => setExportClassId(e.target.value)} 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white' }}
              >
                <option value="all">Semua Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id.toString()}>{c.name}</option>
                ))}
              </select>
            </div>

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

    </div>
  );
}
