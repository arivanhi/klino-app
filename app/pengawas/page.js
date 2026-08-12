import DashboardActions from './DashboardActions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function PengawasDashboard() {
  const totalSchools = await prisma.sekolah.count();
  const totalStudents = await prisma.siswa.count();
  
  const numeracyAgg = await prisma.nilaiNumerasi.aggregate({
    _avg: { score: true }
  });
  const avgNumeracy = numeracyAgg._avg.score?.toFixed(1) || '0.0';

  const literacyAgg = await prisma.penugasanLiterasi.aggregate({
    _avg: { score: true }
  });
  const avgLiteracy = literacyAgg._avg.score?.toFixed(1) || '0.0';

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--primary-color)', marginBottom: '8px' }}>Dashboard Koor Pemantau</h1>
        <p style={{ color: 'var(--text-dark)', opacity: 0.8 }}>Welcome back! Here is the latest overview of KLiNO platform.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-dark)', opacity: 0.7, fontSize: '1rem' }}>Total Schools</h3>
          <p style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--primary-color)', margin: '8px 0' }}>{totalSchools}</p>
        </div>
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-dark)', opacity: 0.7, fontSize: '1rem' }}>Total Students</h3>
          <p style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--secondary-color)', margin: '8px 0' }}>{totalStudents}</p>
        </div>
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-dark)', opacity: 0.7, fontSize: '1rem' }}>Avg. Numeracy Score</h3>
          <p style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--accent-color)', margin: '8px 0' }}>{avgNumeracy}</p>
        </div>
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-dark)', opacity: 0.7, fontSize: '1rem' }}>Avg. Literacy Score</h3>
          <p style={{ fontSize: '3rem', fontWeight: '700', color: '#F59E0B', margin: '8px 0' }}>{avgLiteracy}</p>
        </div>
      </div>

      <div className="glass" style={{ padding: '32px' }}>
        <h2 style={{ marginBottom: '24px', color: 'var(--text-dark)' }}>Quick Actions</h2>
        <DashboardActions />
      </div>
    </div>
  );
}
