'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, Eye, ArrowLeft, BookOpen, Calculator, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function DetailLaporanClient({ schoolId, schoolName, schoolInfo, metrics, classes }) {
  const [activeTabLit, setActiveTabLit] = useState(classes.length > 0 ? classes[0].id : null);
  const [activeTabNum, setActiveTabNum] = useState(classes.length > 0 ? classes[0].id : null);

  const [pageLit, setPageLit] = useState(1);
  const [pageNum, setPageNum] = useState(1);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalType, setModalType] = useState('Literasi'); // 'Literasi' or 'Numerasi'

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const itemsPerPage = 5;

  useEffect(() => {
    const event = new CustomEvent('setTopbarTitle', { detail: schoolName });
    window.dispatchEvent(event);
    return () => window.dispatchEvent(new CustomEvent('setTopbarTitle', { detail: '' }));
  }, [schoolName]);

  const confirmExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(0, 66, 130);
    doc.text(`Laporan KLiNO: ${schoolName}`, 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Klinik Literasi & Numerasi", 14, 28);

    let allTasks = [];
    classes.forEach(cls => {
      cls.students.forEach(s => {
        const combine = [...s.tasksLit, ...s.tasksNum];
        combine.forEach(t => {
          const tDate = new Date(t.date);
          if (exportStartDate && tDate < new Date(exportStartDate)) return;
          if (exportEndDate && tDate > new Date(exportEndDate + 'T23:59:59')) return;
          allTasks.push([cls.name, s.name, s.nis, t.type, t.title, tDate.toLocaleDateString('id-ID'), t.score || '-']);
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
          head: [['Kelas', 'Nama Siswa', 'NIS', 'Jenis', 'Judul Tugas', 'Tanggal', 'Nilai']],
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
    doc.save(`Laporan_KLiNO_${schoolName}.pdf`);
    setShowExportModal(false);
  };

  const activeClassLit = classes.find(c => c.id === activeTabLit);
  const studentsLit = activeClassLit ? activeClassLit.students : [];
  const totalPagesLit = Math.ceil(studentsLit.length / itemsPerPage);
  const paginatedStudentsLit = studentsLit.slice((pageLit - 1) * itemsPerPage, pageLit * itemsPerPage);

  const activeClassNum = classes.find(c => c.id === activeTabNum);
  const studentsNum = activeClassNum ? activeClassNum.students : [];
  const totalPagesNum = Math.ceil(studentsNum.length / itemsPerPage);
  const paginatedStudentsNum = studentsNum.slice((pageNum - 1) * itemsPerPage, pageNum * itemsPerPage);

  const openStudentModal = (student, type) => {
    setSelectedStudent(student);
    setModalType(type);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
        <Link href="/pengawas/laporan" style={{ color: '#004282', textDecoration: 'none' }}>Laporan KLiNO</Link>
        <ChevronRight size={14} />
        <span style={{ color: '#111827' }}>Detail Laporan {schoolName}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#111827', margin: 0, fontWeight: 700 }}>Laporan Detail Sekolah</h1>
            <p style={{ color: '#4b5563', margin: '8px 0 0 0', fontSize: '1rem' }}>Tinjauan komprehensif performa Literasi dan Numerasi.</p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="hover-btn"
            style={{
              backgroundColor: '#004282', color: 'white', padding: '12px 24px',
              borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Download size={18} /> Export Laporan LiNO Sekolah
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

      {/* Top Cards (2 Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>

        {/* Literasi Card */}
        <div className="hover-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0' }}>Performa Literasi</h3>
              <p style={{ color: '#4b5563', margin: 0, fontSize: '0.875rem' }}>Rata-rata Penyelesaian Tugas</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#004282', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <BookOpen size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', margin: '24px 0' }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#004282', lineHeight: 1 }}>{metrics.avgLit}%</div>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, backgroundColor: '#d1fae5', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
              +4% bulan ini
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, metrics.avgLit)}%`, height: '100%', backgroundColor: '#004282', borderRadius: '4px' }}></div>
          </div>
        </div>

        {/* Numerasi Card */}
        <div className="hover-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0' }}>Performa Numerasi</h3>
              <p style={{ color: '#4b5563', margin: 0, fontSize: '0.875rem' }}>Rata-rata Nilai Siswa</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ccfbf1', color: '#0f766e', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Calculator size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', margin: '24px 0' }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#0f766e', lineHeight: 1 }}>{metrics.avgNum}</div>
            <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              → Stabil
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, metrics.avgNum)}%`, height: '100%', backgroundColor: '#0f766e', borderRadius: '4px' }}></div>
          </div>
        </div>

      </div>

      {/* Detail Literasi Section */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#111827', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOpen size={20} color="#004282" /> Detail Literasi
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: 500 }}>Pilih Kelas:</span>
            <select
              value={activeTabLit || ''}
              onChange={(e) => { setActiveTabLit(parseInt(e.target.value)); setPageLit(1); }}
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
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', width: '5%' }}>NO</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', width: '20%' }}>NAMA SISWA</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', width: '15%' }}>NIS</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563' }}>JML TUGAS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudentsLit.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Tidak ada data literasi.</td></tr>
              ) : (
                paginatedStudentsLit.map((s, idx) => (
                  <tr
                    key={s.id}
                    onClick={() => openStudentModal(s, 'Literasi')}
                    style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', backgroundColor: 'white', transition: 'background-color 0.2s' }}
                    className="hover:bg-gray-50"
                  >
                    <td style={{ padding: '20px 24px', color: '#4b5563', fontSize: '0.875rem' }}>{(pageLit - 1) * itemsPerPage + idx + 1}</td>
                    <td style={{ padding: '20px 24px', color: '#111827', fontSize: '0.875rem', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '20px 24px', color: '#6b7280', fontSize: '0.875rem' }}>{s.nis || '-'}</td>
                    <td style={{ padding: '20px 24px', color: '#4b5563', fontSize: '0.875rem' }}>{s.tasksLit.length}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Literasi */}
        {totalPagesLit > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 24px', backgroundColor: 'white', borderTop: '1px solid #e5e7eb', gap: '8px' }}>
            <button onClick={() => setPageLit(p => Math.max(1, p - 1))} disabled={pageLit === 1} style={{ padding: '6px 12px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: pageLit === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{pageLit} / {totalPagesLit}</span>
            <button onClick={() => setPageLit(p => Math.min(totalPagesLit, p + 1))} disabled={pageLit === totalPagesLit} style={{ padding: '6px 12px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: pageLit === totalPagesLit ? 'not-allowed' : 'pointer' }}>Next</button>
          </div>
        )}
      </div>


      {/* Detail Numerasi Section */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#111827', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calculator size={20} color="#0f766e" /> Detail Numerasi
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: 500 }}>Pilih Kelas:</span>
            <select
              value={activeTabNum || ''}
              onChange={(e) => { setActiveTabNum(parseInt(e.target.value)); setPageNum(1); }}
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
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', width: '5%' }}>NO</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', width: '20%' }}>NAMA SISWA</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', width: '15%' }}>NIS</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563' }}>JML TUGAS (DINILAI)</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563' }}>RATA-RATA</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudentsNum.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Tidak ada data numerasi.</td></tr>
              ) : (
                paginatedStudentsNum.map((s, idx) => (
                  <tr
                    key={s.id}
                    onClick={() => openStudentModal(s, 'Numerasi')}
                    style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', backgroundColor: 'white', transition: 'background-color 0.2s' }}
                    className="hover:bg-gray-50"
                  >
                    <td style={{ padding: '20px 24px', color: '#4b5563', fontSize: '0.875rem' }}>{(pageNum - 1) * itemsPerPage + idx + 1}</td>
                    <td style={{ padding: '20px 24px', color: '#111827', fontSize: '0.875rem', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '20px 24px', color: '#6b7280', fontSize: '0.875rem' }}>{s.nis || '-'}</td>
                    <td style={{ padding: '20px 24px', color: '#4b5563', fontSize: '0.875rem' }}>{s.tasksNum.filter(t => t.score !== 'Belum Dinilai').length}</td>
                    <td style={{ padding: '20px 24px', color: '#0f766e', fontSize: '0.875rem', fontWeight: 700 }}>{s.numAvg}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Numerasi */}
        {totalPagesNum > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 24px', backgroundColor: 'white', borderTop: '1px solid #e5e7eb', gap: '8px' }}>
            <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum === 1} style={{ padding: '6px 12px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: pageNum === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{pageNum} / {totalPagesNum}</span>
            <button onClick={() => setPageNum(p => Math.min(totalPagesNum, p + 1))} disabled={pageNum === totalPagesNum} style={{ padding: '6px 12px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: pageNum === totalPagesNum ? 'not-allowed' : 'pointer' }}>Next</button>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="animate-fade-in" style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Export Laporan LiNO Sekolah</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '24px' }}>Unduh laporan keseluruhan Literasi dan Numerasi {schoolName}.</p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Tanggal Mulai (Opsional)</label>
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Tanggal Akhir (Opsional)</label>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowExportModal(false)}
                style={{ padding: '12px 24px', border: '1px solid #d1d5db', background: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#4b5563' }}
              >
                Batal
              </button>
              <button
                onClick={confirmExport}
                className="hover-btn"
                style={{ padding: '12px 24px', border: 'none', background: '#004282', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={18} /> Export PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, padding: '20px' }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '600px', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Detail Penugasan {modalType}: {selectedStudent.name}</h2>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 0 0 0' }}>NIS: {selectedStudent.nis || '-'}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#9ca3af', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
              {(modalType === 'Literasi' ? selectedStudent.tasksLit : selectedStudent.tasksNum).length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '8px' }}>Belum ada tugas {modalType.toLowerCase()} yang dikerjakan.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(modalType === 'Literasi' ? selectedStudent.tasksLit : selectedStudent.tasksNum).map(t => (
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
