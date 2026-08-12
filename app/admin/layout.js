'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Database, 
  Users, 
  LogOut 
} from 'lucide-react';
import { getSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Data Master', href: '/admin/master', icon: Database },
    { name: 'Mapping Supervisor', href: '/admin/mapping', icon: Users },
  ];

  const [session, setSession] = useState(null);
  useEffect(() => {
    getSession().then(sess => setSession(sess));
  }, []);

  const currentPage = navItems.find(item => item.href === pathname)?.name || 'Dashboard';
  const userName = session?.user?.name || 'User';
  const userRole = session?.user?.role || 'ADMIN';
  const userInitials = userName.substring(0, 1).toUpperCase();

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo-placeholder">K</div>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-color)', margin: 0 }}>KLiNO</h2>
            <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0, lineHeight: 1.2 }}>Literacy & Numeracy<br/>Clinic</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={() => signOut({ callbackUrl: '/' })} className="logout-btn">
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
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-dark)' }}>{userName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'capitalize' }}>{userRole.toLowerCase()}</div>
              </div>
              <div className="avatar" style={{ 
                width: '36px', height: '36px', borderRadius: '50%', 
                backgroundColor: 'var(--primary-color)', color: 'white', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontWeight: 600, fontSize: '1rem' 
              }}>
                {userInitials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="admin-content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}

