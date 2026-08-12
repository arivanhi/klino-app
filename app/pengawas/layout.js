'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calculator, 
  BarChart2,
  LogOut 
} from 'lucide-react';
import { getSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function PengawasLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard Utama', href: '/pengawas', icon: LayoutDashboard },
    { name: 'Literacy', href: '/pengawas/literasi', icon: BookOpen },
    { name: 'Numeracy', href: '/pengawas/numerasi', icon: Calculator },
    { name: 'Laporan KLiNO', href: '/pengawas/laporan', icon: BarChart2 },
  ];

  const [session, setSession] = useState(null);
  useEffect(() => {
    getSession().then(sess => setSession(sess));
  }, []);

  const currentPage = navItems.find(item => item.href === pathname)?.name || 'Dashboard Utama';
  const userName = session?.user?.name || 'User';
  const userRole = session?.user?.role || 'PENGAWAS';
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar" style={{ backgroundColor: '#f3f4f6' }}>
        <div className="sidebar-header">
          <div className="logo-placeholder">K</div>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-color)', margin: 0 }}>KLiNO</h2>
            <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0, lineHeight: 1.2 }}>Literacy & Numeracy<br/>Clinic</p>
          </div>
        </div>

        <nav className="sidebar-nav" style={{ padding: '20px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  borderRadius: '8px', marginBottom: '8px', textDecoration: 'none',
                  backgroundColor: isActive ? '#004282' : 'transparent',
                  color: isActive ? 'white' : '#4b5563',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ borderTop: 'none', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button onClick={() => signOut({ callbackUrl: '/' })} style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
            background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer',
            fontWeight: 500
          }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="topbar-title">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)' }}>{currentPage}</h2>
          </div>
          <div className="topbar-actions">
            <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{userName}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}>{userRole.toLowerCase()}</div>
              </div>
              <div className="avatar" style={{ 
                width: '36px', height: '36px', borderRadius: '50%', 
                backgroundColor: '#1e3a8a', color: 'white', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontWeight: 600, fontSize: '0.9rem' 
              }}>
                {userInitials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="admin-content-wrapper" style={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 70px)' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
