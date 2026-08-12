'use client';

import toast from 'react-hot-toast';

export default function DashboardActions() {
  const handleUpload = () => {
    toast.success('Upload Tugas (PDF) clicked!');
  };

  const handleImport = () => {
    toast.success('Import Nilai Massal (Excel) clicked!');
  };

  const handleExport = () => {
    toast.success('Export Laporan (PDF) clicked!');
  };

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <button onClick={handleUpload} className="btn btn-primary" style={{ flex: 1, minWidth: '200px' }}>Upload Tugas (PDF)</button>
      <button onClick={handleImport} className="btn" style={{ background: 'var(--secondary-color)', color: 'white', flex: 1, minWidth: '200px' }}>Import Nilai Massal (Excel)</button>
      <button onClick={handleExport} className="btn" style={{ background: 'var(--accent-color)', color: 'white', flex: 1, minWidth: '200px' }}>Export Laporan (PDF)</button>
    </div>
  );
}
