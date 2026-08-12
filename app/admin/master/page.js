'use client';

import { useState, useEffect } from 'react';
import SekolahTab from './SekolahTab';
import GuruTab from './GuruTab';
import SupervisorTab from './SupervisorTab';
import SemesterTab from './SemesterTab';
import SiswaTab from './SiswaTab';

export default function DataMasterPage() {
  const [activeTab, setActiveTab] = useState('sekolah');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  const tabs = [
    { id: 'sekolah', label: 'Data Sekolah' },
    { id: 'guru', label: 'Data Guru' },
    { id: 'siswa', label: 'Data Siswa' },
    { id: 'supervisor', label: 'Data Supervisor' },
    { id: 'semester', label: 'Data Semester' }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--text-dark)', marginBottom: '8px' }}>Data Master</h1>
        <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>
          Manage core institutional data including schools, educators, students, and supervisory assignments to maintain academic ecosystem health.
        </p>
      </div>

      <div style={{ borderBottom: '1px solid var(--admin-border)', marginBottom: '24px', display: 'flex', gap: '24px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary-color)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-light)',
              fontWeight: activeTab === tab.id ? 600 : 500,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'sekolah' && <SekolahTab />}
        {activeTab === 'guru' && <GuruTab />}
        {activeTab === 'siswa' && <SiswaTab />}
        {activeTab === 'supervisor' && <SupervisorTab />}
        {activeTab === 'semester' && <SemesterTab />}
      </div>
    </div>
  );
}
