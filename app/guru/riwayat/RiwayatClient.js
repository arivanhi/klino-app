'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, LayoutDashboard, BarChart2, BookOpen, Calculator, AlertTriangle, Building, Users } from 'lucide-react';
import Link from 'next/link';

export default function RiwayatClient({ classes, globalStats }) {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const event = new CustomEvent('setTopbarTitle', { detail: 'Riwayat Lino' });
    window.dispatchEvent(event);
    return () => window.dispatchEvent(new CustomEvent('setTopbarTitle', { detail: '' }));
  }, []);

  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#004282' }}>
          <HistoryIcon size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', color: '#111827', margin: 0, fontWeight: 700 }}>Riwayat Lino</h1>
          <p style={{ color: '#4b5563', margin: '4px 0 0 0', fontSize: '1rem' }}>Pantau rekam jejak performa kelas di {globalStats.schoolName}</p>
        </div>
      </div>

      {/* Global Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}>
            <Building size={24} />
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Total Kelas</div>
            <div style={{ color: '#111827', fontSize: '1.5rem', fontWeight: 700 }}>{globalStats.totalClasses}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Rata-Rata Literasi</div>
            <div style={{ color: '#111827', fontSize: '1.5rem', fontWeight: 700 }}>{globalStats.avgLit}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
            <Calculator size={24} />
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Rata-Rata Numerasi</div>
            <div style={{ color: '#111827', fontSize: '1.5rem', fontWeight: 700 }}>{globalStats.avgNum}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ color: '#b91c1c', fontSize: '0.875rem', fontWeight: 600 }}>Siswa Perlu Perhatian</div>
            <div style={{ color: '#dc2626', fontSize: '1.5rem', fontWeight: 700 }}>{globalStats.clinicStudents}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#111827', margin: 0, fontWeight: 700 }}>Daftar Kelas</h2>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Cari kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #d1d5db', width: '250px', fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredClasses.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              Tidak ada kelas yang sesuai dengan pencarian.
            </div>
          ) : (
            filteredClasses.map(cls => (
              <Link href={`/guru/riwayat/${cls.id}`} key={cls.id} style={{ textDecoration: 'none' }}>
                <div className="hover-card" style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', transition: 'all 0.2s', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                  
                  {cls.status === 'Perhatian' && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', color: '#dc2626' }} title="Membutuhkan Perhatian">
                      <AlertTriangle size={20} />
                    </div>
                  )}

                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#111827', fontWeight: 700 }}>{cls.name}</h3>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} /> {cls.participantStudents} / {cls.totalStudents} Siswa Aktif
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1, backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>Rata-Rata Literasi</div>
                      <div style={{ fontSize: '1.25rem', color: '#004282', fontWeight: 700 }}>{cls.avgLit}</div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}>Rata-Rata Numerasi</div>
                      <div style={{ fontSize: '1.25rem', color: '#d97706', fontWeight: 700 }}>{cls.avgNum}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
