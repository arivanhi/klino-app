import { PrismaClient } from '@prisma/client';
import { GraduationCap, Users, BookOpen, Calculator, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const totalSekolah = await prisma.sekolah.count();
  const totalGuru = await prisma.user.count({ where: { role: 'GURU' } });

  const sekolahList = await prisma.sekolah.findMany({
    include: {
      users: { where: { role: 'GURU' } },
    },
    take: 5 // Get a few for the attention table
  });

  // Mock data if empty
  const displaySekolah = totalSekolah || 124;
  const displayGuru = totalGuru || 1450;
  const avgLiterasi = 76.8;
  const avgNumerasi = 72.4;

  const mockAttention = [
    { name: 'SDN 01 Brebes', loc: 'Kec. Brebes', score: 42.1 },
    { name: 'SMPN 3 Wanasari', loc: 'Kec. Wanasari', score: 45.8 },
    { name: 'SDN 04 Jatibarang', loc: 'Kec. Jatibarang', score: 48.2 },
    { name: 'SMPN 2 Bulakamba', loc: 'Kec. Bulakamba', score: 51.4 },
    { name: 'SDN 02 Losari', loc: 'Kec. Losari', score: 53.7 },
  ];

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
            <span className="stat-title">Total Sekolah<br/>Binaan</span>
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="stat-value">{displaySekolah.toLocaleString()}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-border" style={{ backgroundColor: '#0d3b66' }}></div>
          <div className="stat-header">
            <span className="stat-title">Total Guru<br/>Terdaftar</span>
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="stat-value">{displayGuru.toLocaleString()}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-border" style={{ backgroundColor: '#10b981' }}></div>
          <div className="stat-header">
            <span className="stat-title">Rata-Rata<br/>Literasi</span>
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
              <BookOpen size={20} />
            </div>
          </div>
          <div className="stat-value">{avgLiterasi}%</div>
          <div className="stat-trend trend-up">
            <TrendingUp size={14} /> <span>+2.4% dari bulan lalu</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-border" style={{ backgroundColor: '#f59e0b' }}></div>
          <div className="stat-header">
            <span className="stat-title">Rata-Rata<br/>Numerasi</span>
            <div className="stat-icon-wrapper" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Calculator size={20} />
            </div>
          </div>
          <div className="stat-value">{avgNumerasi}%</div>
          <div className="stat-trend trend-up" style={{ color: '#b45309' }}>
            <TrendingUp size={14} /> <span>+1.1% dari bulan lalu</span>
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Sebaran Performa Sekolah</h3>
            <Link href="#" style={{ fontSize: '0.875rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}>Lihat Detail ›</Link>
          </div>
          {/* Placeholder for actual chart */}
          <div style={{ height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '0 0 10px 10px', position: 'relative', marginTop: '20px' }}>
            <div style={{ position: 'absolute', left: '-25px', top: '-10px', fontSize: '10px' }}>100</div>
            <div style={{ position: 'absolute', left: '-20px', top: '25%', fontSize: '10px' }}>75</div>
            <div style={{ position: 'absolute', left: '-20px', top: '50%', fontSize: '10px' }}>50</div>
            <div style={{ position: 'absolute', left: '-20px', top: '75%', fontSize: '10px' }}>25</div>
            <div style={{ position: 'absolute', left: '-15px', bottom: '-2px', fontSize: '10px' }}>0</div>
            
            <div style={{ position: 'absolute', bottom: '-25px', width: '100%', display: 'flex', justifyContent: 'space-around', fontSize: '10px', fontWeight: 600 }}>
              <span>Unggul</span>
              <span>Berkembang</span>
              <span>Perhatian</span>
              <span>Kritis</span>
            </div>
          </div>
        </div>

        <div className="chart-card" style={{ padding: 0 }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--admin-border)', textAlign: 'center' }}>
             <h3 className="chart-title" style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.25rem', lineHeight: 1.3 }}>
               <AlertTriangle size={24} color="#dc2626" />
               Sekolah dengan<br/>Perhatian Khusus
             </h3>
             <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '8px' }}>Memerlukan intervensi segera.</p>
          </div>
          
          <div style={{ padding: '0 24px' }}>
            <table className="attention-table">
              <thead>
                <tr>
                  <th>Sekolah</th>
                  <th style={{ textAlign: 'right' }}>Skor</th>
                </tr>
              </thead>
              <tbody>
                {mockAttention.map((school, i) => (
                  <tr key={i}>
                    <td>
                      <div className="attention-school-name">{school.name}</div>
                      <div className="attention-school-loc">{school.loc}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`attention-score ${school.score < 50 ? 'score-red' : 'score-yellow'}`}>
                        {school.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
