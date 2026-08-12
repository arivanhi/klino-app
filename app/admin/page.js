import { PrismaClient } from '@prisma/client';
import { GraduationCap, Users, BookOpen, Calculator, Database, Settings, UserCheck } from 'lucide-react';
import Link from 'next/link';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const totalSekolah = await prisma.sekolah.count();
  const totalGuru = await prisma.user.count({ where: { role: 'GURU' } });
  const totalSiswa = await prisma.siswa.count();
  const totalMentor = await prisma.mentor.count();

  const displaySekolah = totalSekolah || 0;
  const displayGuru = totalGuru || 0;
  const displaySiswa = totalSiswa || 0;
  const displayMentor = totalMentor || 0;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '8px' }}>Selamat Datang, Administrator</h1>
        <p style={{ color: 'var(--text-dark)', opacity: 0.8 }}>Pantau dan kelola seluruh infrastruktur klinik literasi & numerasi.</p>
      </header>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-border" style={{ backgroundColor: '#0d3b66' }}></div>
          <div className="stat-header">
            <span className="stat-title">Total Guru<br/>Terdaftar</span>
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
              <BookOpen size={20} />
            </div>
          </div>
          <div className="stat-value">{displayGuru.toLocaleString()}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-border" style={{ backgroundColor: '#10b981' }}></div>
          <div className="stat-header">
            <span className="stat-title">Total Sekolah<br/>Binaan</span>
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="stat-value">{displaySekolah.toLocaleString()}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-border" style={{ backgroundColor: '#f59e0b' }}></div>
          <div className="stat-header">
            <span className="stat-title">Total Siswa<br/>Terdaftar</span>
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="stat-value">{displaySiswa.toLocaleString()}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-border" style={{ backgroundColor: '#ef4444' }}></div>
          <div className="stat-header">
            <span className="stat-title">Total Mentor<br/>Terdaftar</span>
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <UserCheck size={20} />
            </div>
          </div>
          <div className="stat-value">{displayMentor.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: '16px', fontWeight: 600 }}>Navigasi Cepat Data Master</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <Link href="/admin/master?tab=guru" style={{ display: 'block', textDecoration: 'none' }}>
            <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} className="hover-card">
              <div style={{ padding: '12px', backgroundColor: '#e0e7ff', color: '#4f46e5', borderRadius: '8px' }}>
                <BookOpen size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-dark)', margin: 0, fontWeight: 600 }}>Kelola Guru</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: '4px 0 0 0' }}>Tambah/Hapus Data</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/master?tab=sekolah" style={{ display: 'block', textDecoration: 'none' }}>
            <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} className="hover-card">
              <div style={{ padding: '12px', backgroundColor: '#d1fae5', color: '#059669', borderRadius: '8px' }}>
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-dark)', margin: 0, fontWeight: 600 }}>Kelola Sekolah</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: '4px 0 0 0' }}>Tambah/Hapus Data</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/master?tab=siswa" style={{ display: 'block', textDecoration: 'none' }}>
            <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} className="hover-card">
              <div style={{ padding: '12px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '8px' }}>
                <Users size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-dark)', margin: 0, fontWeight: 600 }}>Kelola Siswa</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: '4px 0 0 0' }}>Tambah/Hapus Data</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/master?tab=supervisor" style={{ display: 'block', textDecoration: 'none' }}>
            <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} className="hover-card">
              <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px' }}>
                <UserCheck size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-dark)', margin: 0, fontWeight: 600 }}>Kelola Mentor</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: '4px 0 0 0' }}>Tambah/Hapus Data</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
