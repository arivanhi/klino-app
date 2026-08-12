'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/pengawas' },
    { name: 'Literacy Monitoring', path: '/pengawas/literasi' },
    { name: 'Numeracy Monitoring', path: '/pengawas/numerasi' },
    { name: 'Laporan KLiNO', path: '/pengawas/laporan' },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <img src="/logo.png" alt="KLiNO Logo" />
        <img src="/school-logo.png" alt="School Logo" />
        <h2>KLiNO</h2>
      </div>
      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link 
              href={item.path} 
              className={`nav-item ${pathname === item.path ? 'active' : ''}`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 'auto' }}>
        <button className="btn btn-primary" style={{ width: '100%' }}>
          Logout
        </button>
      </div>
    </aside>
  );
}
