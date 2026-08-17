'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calculator, 
  History,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { getSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

export default function GuruLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/guru', icon: LayoutDashboard },
    { name: 'Literasi', href: '/guru/literasi', icon: BookOpen },
    { name: 'Numerasi', href: '/guru/numerasi', icon: Calculator },
    { name: 'Riwayat Lino', href: '/guru/riwayat', icon: History },
    { name: 'Setelan', href: '/guru/setelan', icon: Settings },
  ];

  const [session, setSession] = useState(null);
  const [dynamicTitle, setDynamicTitle] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    getSession().then(sess => setSession(sess));

    const handleTitleChange = (e) => setDynamicTitle(e.detail);
    window.addEventListener('setTopbarTitle', handleTitleChange);
    return () => window.removeEventListener('setTopbarTitle', handleTitleChange);
  }, []);

  const currentPage = dynamicTitle || (navItems.find(item => item.href === pathname)?.name || 'Dashboard');
  const userName = session?.user?.name || 'Guru';
  const userRole = session?.user?.role || 'GURU';
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <div className="admin-layout">
      <Toaster position="top-right" />
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`} style={{ backgroundColor: '#f3f4f6' }}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="logo-placeholder">K</div>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-color)', margin: 0 }}>KLiNO</h2>
              <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0, lineHeight: 1.2 }}>Literacy & Numeracy<br/>Clinic</p>
            </div>
          </div>
          <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav" style={{ padding: '20px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            // Match exactly or starts with for nested pages, but avoid matching just /guru for all
            const isActive = pathname === item.href || (item.href !== '/guru' && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => setIsMobileMenuOpen(false)}
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
          <div className="topbar-title" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Menu size={24} color="#111827" />
            </button>
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
