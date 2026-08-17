'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, BookOpen, Calculator, AlertTriangle, TrendingUp, TrendingDown, Users } from 'lucide-react';

export default function DashboardClient({ schools, globalStats }) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(schools.length / itemsPerPage);

  const paginatedSchools = schools.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Trend Icon - colored dynamically based on threshold
  const renderTrendIcon = (score) => {
    if (score === '-') return null;
    const isGood = parseFloat(score) >= 60;
    const color = isGood ? '#059669' : '#dc2626'; // Green if >= 60, Red if < 60
    return isGood ? <TrendingUp color={color} size={24} /> : <TrendingDown color={color} size={24} />;
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', color: '#111827', marginBottom: '8px', fontWeight: 700 }}>Selamat Datang, Koor Pemantau!</h1>
        <p style={{ color: '#4b5563', fontSize: '0.95rem' }}>Pantau perkembangan klinik literasi dan numerasi lintas sekolah binaan.</p>
      </header>

      {/* Top Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px' }}>Total Sekolah Binaan</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>{globalStats.totalSchools}</span>
            <span style={{ display: 'flex', alignItems: 'center' }}>
               <GraduationCap size={28} color="#004282" />
            </span>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px' }}>Literasi Terkumpul</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>{globalStats.avgLit === '-' ? '-' : `${globalStats.avgLit}%`}</span>
            <span style={{ display: 'flex', alignItems: 'center' }}>
               <BookOpen size={28} color="#059669" />
            </span>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px' }}>Rata-rata Numerasi</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>{globalStats.avgNum}</span>
            <span style={{ display: 'flex', alignItems: 'center' }}>
               <Calculator size={28} color="#059669" />
            </span>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #fca5a5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#b91c1c', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Siswa Membutuhkan Klinik</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#b91c1c' }}>{globalStats.clinicStudents}</span>
            <span style={{ display: 'flex', alignItems: 'center' }}>
               <AlertTriangle size={28} color="#dc2626" />
            </span>
          </div>
        </div>

      </div>

      {/* Section Title */}
      <h2 style={{ fontSize: '1.25rem', color: '#111827', marginBottom: '20px', fontWeight: 600 }}>Status Sekolah Binaan</h2>

      {/* School Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {paginatedSchools.length === 0 ? (
          <div style={{ color: '#6b7280', gridColumn: '1 / -1' }}>Tidak ada data sekolah.</div>
        ) : (
          paginatedSchools.map(school => (
            <div key={school.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1rem', color: '#111827', fontWeight: 600, margin: 0 }}>{school.name}</h3>
                  <span style={{ 
                    padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                    backgroundColor: school.status === 'Stabil' ? '#d1fae5' : school.status === 'Belum Ada Data' ? '#f3f4f6' : '#fee2e2',
                    color: school.status === 'Stabil' ? '#059669' : school.status === 'Belum Ada Data' ? '#6b7280' : '#dc2626'
                  }}>
                    {school.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', color: '#6b7280', fontSize: '0.85rem', margin: 0, marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={14} /> {school.participantStudents} Siswa
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={14} /> {school.guruCount} Guru
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={14} /> {school.mentorCount} Mentor
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Literasi Terkumpul</div>
                    <div style={{ fontSize: '1.25rem', color: '#004282', fontWeight: 700 }}>{school.avgLit === '-' ? '-' : `${school.avgLit}%`}</div>
                  </div>
                  {renderTrendIcon(school.avgLit)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Numerasi</div>
                    <div style={{ fontSize: '1.25rem', color: '#92400e', fontWeight: 700 }}>{school.avgNum}</div>
                  </div>
                  {renderTrendIcon(school.avgNum)}
                </div>
              </div>

              <div style={{ padding: '16px 20px', backgroundColor: '#f9fafb', marginTop: 'auto' }}>
                <Link href={`/pengawas/laporan?schoolId=${school.id}`} style={{ display: 'block' }}>
                  <button style={{ 
                    width: '100%', padding: '10px', backgroundColor: 'white', border: '1px solid #004282', 
                    color: '#004282', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                  }} className="hover:bg-blue-50">
                    View Details
                  </button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '8px 16px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#4b5563' }}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button 
              key={i}
              onClick={() => setPage(i + 1)}
              style={{ 
                padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                border: page === i + 1 ? '1px solid #004282' : '1px solid #d1d5db',
                backgroundColor: page === i + 1 ? '#eff6ff' : 'white',
                color: page === i + 1 ? '#004282' : '#4b5563',
                fontWeight: page === i + 1 ? 600 : 400
              }}
            >
              {i + 1}
            </button>
          ))}
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '8px 16px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#4b5563' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
