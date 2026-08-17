'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Calculator, Users, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardClient({ schoolInfo, metrics, classesData }) {
  const [page, setPage] = useState(1);
  const [activeClassId, setActiveClassId] = useState(classesData && classesData.length > 0 ? classesData[0].id : null);
  const itemsPerPage = 5;

  useEffect(() => {
    const event = new CustomEvent('setTopbarTitle', { detail: `Dashboard Guru` });
    window.dispatchEvent(event);
    return () => window.dispatchEvent(new CustomEvent('setTopbarTitle', { detail: '' }));
  }, []);

  const activeClass = classesData?.find(c => c.id === activeClassId);
  const students = activeClass ? activeClass.students : [];

  const totalPages = Math.ceil(students.length / itemsPerPage);
  const paginatedStudents = students.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* Header section */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', color: '#111827', margin: '0 0 8px 0', fontWeight: 700 }}>Selamat Datang, Bapak/Ibu Guru</h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '1rem' }}>Ringkasan performa akademik hari ini untuk {schoolInfo.name}.</p>
      </div>

      {/* Informasi Sekolah */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#111827', margin: '0 0 8px 0', fontWeight: 700 }}>Informasi Sekolah</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
          <div><span style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>NPSN</span><strong style={{ color: '#111827' }}>{schoolInfo.npsn}</strong></div>
          <div><span style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Kecamatan</span><strong style={{ color: '#111827' }}>{schoolInfo.kecamatan}</strong></div>
          <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Alamat</span><strong style={{ color: '#111827' }}>{schoolInfo.address}</strong></div>
          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', margin: '8px 0' }}></div>
          <div><span style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Mentor Literasi & Numerasi</span><strong style={{ color: '#111827' }}>{schoolInfo.mentorNames}</strong></div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* Total Siswa */}
        <div className="hover-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05, color: '#004282' }}>
            <Users size={120} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#004282' }}>
              <Users size={20} />
            </div>
            <h3 style={{ color: '#4b5563', fontSize: '0.875rem', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Siswa</h3>
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#004282', lineHeight: 1, marginBottom: '8px' }}>{metrics.totalStudents}</div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>Siswa di {schoolInfo.name}</div>
        </div>

        {/* Rata-rata Literasi */}
        <div className="hover-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#059669' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <BookOpen size={20} />
            </div>
            <h3 style={{ color: '#4b5563', fontSize: '0.875rem', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rata-Rata Literasi</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{metrics.avgLit}</span>
            <span style={{ color: '#6b7280', fontWeight: 600 }}>/100</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, metrics.avgLit)}%`, height: '100%', backgroundColor: '#059669', borderRadius: '4px' }}></div>
          </div>
        </div>

        {/* Rata-rata Numerasi */}
        <div className="hover-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#f59e0b' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <Calculator size={20} />
              </div>
              <h3 style={{ color: '#4b5563', fontSize: '0.875rem', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rata-Rata Numerasi</h3>
            </div>
            <AlertTriangle size={16} color="#d97706" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{metrics.avgNum}</span>
            <span style={{ color: '#6b7280', fontWeight: 600 }}>/100</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, metrics.avgNum)}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '4px' }}></div>
          </div>
        </div>

      </div>

      {/* Recent Tasks */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#111827', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={20} color="#004282" /> Progres Tugas Siswa
          </h2>
          <Link href="/guru/riwayat" style={{ fontSize: '0.875rem', color: '#004282', fontWeight: 600, textDecoration: 'none' }}>
            Lihat Semua Riwayat →
          </Link>
        </div>

        {/* Tab Navigasi Kelas */}
        {classesData && classesData.length > 0 && (
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 24px', overflowX: 'auto', gap: '24px' }}>
            {classesData.map(cls => (
              <button
                key={cls.id}
                onClick={() => { setActiveClassId(cls.id); setPage(1); }}
                style={{
                  padding: '16px 8px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeClassId === cls.id ? '2px solid #004282' : '2px solid transparent',
                  color: activeClassId === cls.id ? '#004282' : '#6b7280',
                  fontWeight: activeClassId === cls.id ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {cls.name}
              </button>
            ))}
          </div>
        )}
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Nama Siswa</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>NIS</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Literasi</th>
                <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Numerasi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                    Belum ada data siswa di kelas ini.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: 'white', transition: 'background-color 0.2s' }} className="hover:bg-gray-50">
                    <td style={{ padding: '16px 24px', color: '#111827', fontSize: '0.875rem', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '16px 24px', color: '#4b5563', fontSize: '0.875rem' }}>{s.nis}</td>
                    <td style={{ padding: '16px 24px', color: '#004282', fontSize: '0.875rem', fontWeight: 700 }}>{s.litProgress}</td>
                    <td style={{ padding: '16px 24px', color: '#d97706', fontSize: '0.875rem', fontWeight: 700 }}>{s.numProgress}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 24px', backgroundColor: 'white', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 12px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
          </div>
        )}
      </div>

    </div>
  );
}
