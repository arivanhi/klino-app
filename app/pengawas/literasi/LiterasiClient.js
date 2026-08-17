'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Download, ArrowRight } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function LiterasiClient({ schools }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const itemsPerPage = 6;

  // Filter schools by search
  const filteredSchools = schools.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filteredSchools.length / itemsPerPage);
  const paginatedSchools = filteredSchools.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Cover Page
    doc.setFontSize(26);
    doc.setTextColor(0, 66, 130); // #004282
    doc.text("Laporan Literasi Sekolah Binaan", 105, 120, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor(100, 100, 100);
    doc.text("Klinik Literasi Numerasi (KLiNO)", 105, 135, { align: 'center' });
    if (startDate && endDate) {
       doc.setFontSize(12);
       doc.text(`Periode: ${startDate} s.d ${endDate}`, 105, 145, { align: 'center' });
    }
    
    let schoolsToExport = schools;
    if (selectedSchool !== 'all') {
        schoolsToExport = schools.filter(s => s.id.toString() === selectedSchool);
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
            t.title,
            new Date(t.date).toLocaleDateString('id-ID'),
            t.score
        ]);
        
        // Chunking strictly by 15 items per page/table as requested
        const chunks = [];
        for (let i = 0; i < tableData.length; i += 15) {
            chunks.push(tableData.slice(i, i + 15));
        }
        
        if (chunks.length === 0) {
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text("Tidak ada data penugasan pada periode ini.", 14, 35);
        } else {
            chunks.forEach((chunk, chunkIdx) => {
                if (chunkIdx > 0) doc.addPage(); // New page for each chunk if chunked manually
                
                doc.autoTable({
                    head: [['No', 'Nama Siswa', 'NIS', 'Judul Tugas', 'Tanggal', 'Nilai']],
                    body: chunk,
                    startY: chunkIdx === 0 ? 30 : 20, // Start lower on first page of school
                    theme: 'striped',
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [0, 66, 130] },
                    margin: { top: 20 }
                });
            });
        }
    });

    // Add footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Halaman ${i}`, 105, 290, { align: 'center' });
    }

    doc.save("Laporan_Literasi_Massal.pdf");
    setIsModalOpen(false);
  };

  const getBadgeStyle = (status) => {
    switch(status) {
      case 'Aktif': return { bg: '#d1fae5', text: '#059669' };
      case 'Berkembang': return { bg: '#fef3c7', text: '#d97706' };
      case 'Perhatian': return { bg: '#fee2e2', text: '#dc2626' };
      default: return { bg: '#f3f4f6', text: '#4b5563' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: '#111827', marginBottom: '8px', fontWeight: 700 }}>Monitoring Literasi Sekolah Binaan</h1>
          <p style={{ color: '#4b5563', fontSize: '0.95rem' }}>Pantau progres pengerjaan literasi di seluruh sekolah binaan.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            backgroundColor: '#004282', color: 'white', padding: '10px 20px', 
            borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <Download size={18} /> Export Laporan Literasi
        </button>
      </div>

      {/* Toolbar / Search */}
      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input 
          type="text" 
          placeholder="Cari nama sekolah..." 
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ 
            width: '100%', padding: '12px 16px 12px 40px', 
            borderRadius: '8px', border: '1px solid #d1d5db',
            outline: 'none', fontSize: '0.95rem'
          }}
        />
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {paginatedSchools.length === 0 ? (
          <div style={{ color: '#6b7280', gridColumn: '1 / -1' }}>Sekolah tidak ditemukan.</div>
        ) : (
          paginatedSchools.map(school => {
            const badge = getBadgeStyle(school.status);
            return (
              <div 
                key={school.id} 
                style={{ 
                  backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', 
                  overflow: 'hidden', transition: 'all 0.2s ease', cursor: 'pointer' 
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.25rem', color: '#111827', fontWeight: 700, margin: 0 }}>{school.name}</h3>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: badge.bg, color: badge.text
                    }}>
                      {school.status}
                    </span>
                  </div>

                  <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#6b7280', fontWeight: 500 }}>Pengerjaan Literasi</span>
                    <span style={{ color: '#111827', fontWeight: 700 }}>{school.progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, school.progress)}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '4px' }}></div>
                  </div>

                  <div style={{ marginTop: '16px', fontSize: '0.85rem', color: '#4b5563', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ marginBottom: '6px', display: 'flex', gap: '8px' }}>
                      <strong style={{ minWidth: '60px', color: '#374151' }}>Guru:</strong> 
                      <span style={{ flex: 1 }} className="truncate" title={school.guruNames}>{school.guruNames}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <strong style={{ minWidth: '60px', color: '#374151' }}>Mentor:</strong> 
                      <span style={{ flex: 1 }} className="truncate" title={school.mentorNames}>{school.mentorNames}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Jml Tugas</div>
                    <div style={{ fontSize: '1.25rem', color: '#111827', fontWeight: 600 }}>{school.totalTasks} Tugas</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Rata-rata Kumpul</div>
                    <div style={{ fontSize: '1.5rem', color: '#111827', fontWeight: 700 }}>{school.avgScore}%</div>
                  </div>
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                  <Link href={`/pengawas/literasi/${school.id}`} style={{ textDecoration: 'none' }}>
                    <button style={{ 
                      width: '100%', padding: '12px', backgroundColor: 'white', border: '1px solid #d1d5db', 
                      color: '#004282', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#004282'; e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = 'white'; }}
                    >
                      View Details <ArrowRight size={16} />
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Menampilkan <span style={{ fontWeight: 600, color: '#111827' }}>{(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, filteredSchools.length)}</span> dari <span style={{ fontWeight: 600, color: '#111827' }}>{filteredSchools.length}</span> sekolah
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '8px 16px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#4b5563' }}
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '8px 16px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#4b5563' }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="animate-fade-in" style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Export Laporan Literasi</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '24px' }}>Unduh laporan nilai literasi siswa dalam format PDF.</p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Pilih Sekolah</label>
              <select 
                value={selectedSchool} 
                onChange={(e) => setSelectedSchool(e.target.value)}
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
