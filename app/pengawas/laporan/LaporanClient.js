'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Download, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Link from 'next/link';

export default function LaporanClient({ semesters, selectedSemesterId, schools }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportSchool, setExportSchool] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const itemsPerPage = 6;

  const handleSemesterChange = (e) => {
    const val = e.target.value;
    if (val) {
      router.push(`/pengawas/laporan?semesterId=${val}`);
    } else {
      router.push(`/pengawas/laporan`);
    }
  };

  const filteredSchools = schools.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filteredSchools.length / itemsPerPage);
  const paginatedSchools = filteredSchools.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(0, 66, 130);
    doc.text("Laporan KLiNO Sekolah Binaan", 105, 120, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor(100, 100, 100);
    doc.text("Klinik Literasi & Numerasi", 105, 135, { align: 'center' });
    if (startDate && endDate) {
       doc.setFontSize(12);
       doc.text(`Periode: ${startDate} s.d ${endDate}`, 105, 145, { align: 'center' });
    }
    
    let schoolsToExport = schools;
    if (exportSchool !== 'all') {
        schoolsToExport = schools.filter(s => s.id.toString() === exportSchool);
    }

    schoolsToExport.forEach((school, index) => {
        doc.addPage();
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.text(`Laporan: ${school.name}`, 14, 22);
        
        let filteredTasks = school.tasks || [];
        if (startDate && endDate) {
            filteredTasks = filteredTasks.filter(t => {
                const d = new Date(t.date);
                return d >= new Date(startDate) && d <= new Date(endDate);
            });
        }
        
        const tableData = filteredTasks.map((t, idx) => [
            idx + 1,
            t.siswaName,
            t.nis,
            t.type,
            t.title,
            new Date(t.date).toLocaleDateString('id-ID'),
            t.score
        ]);
        
        const chunks = [];
        for (let i = 0; i < tableData.length; i += 15) {
            chunks.push(tableData.slice(i, i + 15));
        }
        
        if (chunks.length === 0) {
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text("Tidak ada data penugasan pada periode/semester ini.", 14, 35);
        } else {
            chunks.forEach((chunk, chunkIdx) => {
                if (chunkIdx > 0) doc.addPage();
                
                doc.autoTable({
                    head: [['No', 'Nama Siswa', 'NIS', 'Jenis', 'Judul Tugas', 'Tanggal', 'Nilai']],
                    body: chunk,
                    startY: chunkIdx === 0 ? 30 : 20,
                    theme: 'striped',
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [0, 66, 130] },
                    margin: { top: 20 }
                });
            });
        }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Halaman ${i}`, 105, 290, { align: 'center' });
    }

    doc.save("Laporan_KLiNO_Gabungan.pdf");
    setIsModalOpen(false);
  };

  const getBadgeStyle = (status) => {
    switch(status) {
      case 'Unggul': return { bg: '#cffafe', text: '#0891b2', border: '#67e8f9' };
      case 'Berkembang': return { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' };
      case 'Perhatian': return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
      default: return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', color: '#111827', marginBottom: '8px', fontWeight: 700, letterSpacing: '-0.5px' }}>Laporan KLiNO</h1>
          <p style={{ color: '#4b5563', fontSize: '1rem' }}>Pilih sekolah untuk melihat detail laporan perkembangan literasi dan numerasi.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="hover-btn"
          style={{ 
            backgroundColor: '#004282', color: 'white', padding: '12px 24px', 
            borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Download size={18} /> Export Laporan LiNO
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '32px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Pilih Semester</label>
          <select 
            value={selectedSemesterId} 
            onChange={handleSemesterChange}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.95rem', backgroundColor: '#f9fafb', appearance: 'none', background: '#f9fafb url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right 16px center / 12px 12px' }}
          >
            {semesters.map(s => (
              <option key={s.id} value={s.id}>{s.jenis} {s.tahunAjaran}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '2 1 400px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Cari Sekolah</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input 
              type="text" 
              placeholder="Nama sekolah..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {paginatedSchools.length === 0 ? (
          <div style={{ color: '#6b7280', gridColumn: '1 / -1' }}>Tidak ada sekolah ditemukan pada semester ini.</div>
        ) : (
          paginatedSchools.map(school => {
            const badge = getBadgeStyle(school.status);
            return (
              <div 
                key={school.id} 
                className="hover-card"
                style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ height: '6px', backgroundColor: '#004282', width: '100%' }}></div>
                <div style={{ padding: '24px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.5rem', color: '#111827', fontWeight: 700, margin: 0 }}>{school.name}</h3>
                    <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}>
                      {school.status}
                    </span>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 16px 0', fontWeight: 500 }}>{school.kecamatan}</p>

                  <div style={{ marginBottom: '24px', fontSize: '0.85rem', color: '#4b5563', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ marginBottom: '6px', display: 'flex', gap: '8px' }}>
                      <strong style={{ minWidth: '60px', color: '#374151' }}>Guru:</strong> 
                      <span style={{ flex: 1 }} className="truncate" title={school.guruNames}>{school.guruNames}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <strong style={{ minWidth: '60px', color: '#374151' }}>Mentor:</strong> 
                      <span style={{ flex: 1 }} className="truncate" title={school.mentorNames}>{school.mentorNames}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
                      <span style={{ color: '#4b5563', fontWeight: 600 }}>Literasi</span>
                      <span style={{ color: '#111827', fontWeight: 700 }}>{school.litScore}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, school.litScore)}%`, height: '100%', backgroundColor: '#004282', borderRadius: '4px' }}></div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
                      <span style={{ color: '#4b5563', fontWeight: 600 }}>Numerasi</span>
                      <span style={{ color: '#111827', fontWeight: 700 }}>{school.numScore}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, school.numScore)}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '4px' }}></div>
                    </div>
                  </div>

                  <Link href={`/pengawas/laporan/${school.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <button className="hover-btn" style={{ 
                      width: '100%', padding: '12px', backgroundColor: 'white', border: '1px solid #d1d5db', 
                      color: '#004282', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                      <Eye size={18} /> View Report
                    </button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
            Menampilkan {(page - 1) * itemsPerPage + 1} sampai {Math.min(page * itemsPerPage, filteredSchools.length)} dari {filteredSchools.length} Sekolah
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '8px 16px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#4b5563', fontWeight: 500 }}
            >
              &laquo; Previous
            </button>
            <button style={{ padding: '8px 16px', border: 'none', backgroundColor: '#004282', color: 'white', borderRadius: '6px', fontWeight: 600 }}>
              {page}
            </button>
            {page < totalPages && (
              <button 
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '8px 16px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}
              >
                {page + 1}
              </button>
            )}
            {page < totalPages - 1 && <span style={{ padding: '8px 4px', color: '#6b7280' }}>...</span>}
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '8px 16px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#4b5563', fontWeight: 500 }}
            >
              Next &raquo;
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="animate-fade-in" style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Export Laporan KLiNO</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '24px' }}>Unduh laporan rekapitulasi Literasi dan Numerasi dalam format PDF.</p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Pilih Sekolah</label>
              <select 
                value={exportSchool} 
                onChange={(e) => setExportSchool(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
              >
                <option value="all">Semua Sekolah Binaan</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Tanggal Mulai</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Tanggal Akhir</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ padding: '12px 24px', border: '1px solid #d1d5db', background: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#4b5563' }}
              >
                Batal
              </button>
              <button 
                onClick={handleExportPDF}
                className="hover-btn"
                style={{ padding: '12px 24px', border: 'none', background: '#004282', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={18} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
