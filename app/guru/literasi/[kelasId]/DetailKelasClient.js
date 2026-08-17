'use client';

import React, { useState, useEffect } from 'react';
import { Download, Plus, Search, CheckCircle, Upload, Eye, Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

export default function DetailKelasClient({ kelasId, kelasName, students, metrics }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Modals
  const [showAddTugas, setShowAddTugas] = useState(false);
  const [newTugasTitle, setNewTugasTitle] = useState('');
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  useEffect(() => {
    const event = new CustomEvent('setTopbarTitle', { detail: 'Literasi' });
    window.dispatchEvent(event);
    return () => window.dispatchEvent(new CustomEvent('setTopbarTitle', { detail: '' }));
  }, []);

  const handleAddTugas = async () => {
    if (!newTugasTitle.trim()) return;
    
    try {
      const res = await fetch('/api/guru/literasi/tambah-tugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: kelasId, title: newTugasTitle })
      });
      if (res.ok) {
        setShowAddTugas(false);
        setNewTugasTitle('');
        window.location.reload();
      } else {
        alert('Gagal menambahkan tugas');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    }
  };

  const handleUploadTugas = async (taskId, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('taskId', taskId);
    formData.append('file', file);

    try {
      const res = await fetch('/api/guru/literasi/upload', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const { fileUrl } = await res.json();
        // Update selectedStudent tasks locally
        const updatedTasks = selectedStudent.tasks.map(t => t.id === taskId ? { ...t, fileUrl } : t);
        setSelectedStudent({ ...selectedStudent, tasks: updatedTasks });
        setHasChanges(true);
        toast.success('Tugas berhasil diunggah!');
      } else {
        alert('Gagal mengupload tugas');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat upload');
    }
  };

  const handleDeleteTugas = async (taskId) => {
    if (!confirm('Hapus file tugas ini?')) return;
    
    try {
      const res = await fetch(`/api/guru/literasi/upload?taskId=${taskId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        const updatedTasks = selectedStudent.tasks.map(t => t.id === taskId ? { ...t, fileUrl: null } : t);
        setSelectedStudent({ ...selectedStudent, tasks: updatedTasks });
        setHasChanges(true);
        toast.success('Tugas berhasil dihapus!');
      } else {
        alert('Gagal menghapus tugas');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus');
    }
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const maxChartVal = Math.max(...(metrics.trenLiterasi.length > 0 ? metrics.trenLiterasi.map(d => d.value) : [1]));

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <Toaster position="top-right" />
      
      <div style={{ marginBottom: '24px' }}>
        <Link href="/guru/literasi" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6b7280', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
          &larr; Kembali ke Daftar Kelas
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', color: '#111827', margin: 0, fontWeight: 700 }}>Detail Literasi - {kelasName}</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', fontWeight: 600, outline: 'none' }}>
            <option value="all">Semua Status</option>
            <option value="completed">Selesai</option>
            <option value="ongoing">Sedang Berjalan</option>
          </select>
          <button 
            onClick={() => setShowExportModal(true)}
            className="hover-btn" 
            style={{ backgroundColor: '#004282', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Download size={18} /> Export Data Literasi Kelas
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Sidebar Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', letterSpacing: '0.5px' }}>RATA-RATA PENYELESAIAN</h3>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#004282' }}>🎓</div>
            </div>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#111827', lineHeight: 1, marginBottom: '16px' }}>{metrics.completionRate}%</div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${metrics.completionRate}%`, height: '100%', backgroundColor: '#004282', borderRadius: '4px' }}></div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', letterSpacing: '0.5px' }}>TOTAL TUGAS<br/>DISELESAIKAN</h3>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}><CheckCircle size={18}/></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '3rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{metrics.totalTasksCompleted}</span>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>/ {metrics.totalTasksAssigned} Tugas</span>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Tren Progres Literasi</h3>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '150px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb', gap: '8px' }}>
              {metrics.trenLiterasi.length === 0 ? (
                <div style={{ width: '100%', textAlign: 'center', color: '#9ca3af' }}>Belum ada data</div>
              ) : (
                metrics.trenLiterasi.map((d, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <div style={{ 
                      width: '100%', 
                      height: `${(d.value / maxChartVal) * 100}%`, 
                      backgroundColor: i === metrics.trenLiterasi.length - 1 ? '#004282' : '#93c5fd', 
                      borderRadius: '4px 4px 0 0',
                      minHeight: '10px'
                    }}></div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              {metrics.trenLiterasi.map((d, i) => (
                <div key={i} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', flex: 1, textAlign: 'center' }}>{d.label}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Penugasan Banner */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PENUGASAN</h3>
            <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '1rem' }}>Kelola tugas literasi untuk kelas ini.</p>
            <button 
              onClick={() => setShowAddTugas(true)}
              className="hover-btn"
              style={{ backgroundColor: '#004282', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <Plus size={18} /> Tambah Tugas
            </button>
          </div>

          {/* Daftar Siswa */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#111827', margin: 0, fontWeight: 700 }}>Daftar Siswa</h2>
              <div style={{ position: 'relative' }}>
                <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Cari nama siswa..." 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  style={{ padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', width: '250px' }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                  <tr>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', width: '5%' }}>NO</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', width: '35%' }}>NAMA SISWA</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', width: '25%' }}>NIS</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', width: '35%' }}>JUMLAH TUGAS / TOTAL PENUGASAN</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Tidak ada siswa ditemukan.</td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s, idx) => (
                      <tr 
                        key={s.id}
                        onClick={() => setSelectedStudent(s)}
                        style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', transition: 'background-color 0.2s', backgroundColor: 'white' }}
                        className="hover:bg-gray-50"
                      >
                        <td style={{ padding: '16px 24px', color: '#4b5563', fontSize: '0.875rem' }}>{(page - 1) * itemsPerPage + idx + 1}</td>
                        <td style={{ padding: '16px 24px', color: '#004282', fontSize: '0.875rem', fontWeight: 600 }}>{s.name}</td>
                        <td style={{ padding: '16px 24px', color: '#4b5563', fontSize: '0.875rem' }}>{s.nis}</td>
                        <td style={{ padding: '16px 24px', color: '#111827', fontSize: '0.875rem', fontWeight: 700 }}>
                          {s.tasksCompleted} <span style={{ color: '#9ca3af', fontWeight: 500 }}>/ {s.tasksAssigned}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #e5e7eb', backgroundColor: 'white' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Menampilkan {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, filteredStudents.length)} dari {filteredStudents.length} Siswa
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ background: 'none', border: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#d1d5db' : '#4b5563', fontWeight: 600, fontSize: '0.875rem' }}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        backgroundColor: page === num ? '#004282' : 'transparent',
                        color: page === num ? 'white' : '#4b5563',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {num}
                    </button>
                  ))}
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{ background: 'none', border: 'none', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#d1d5db' : '#4b5563', fontWeight: 600, fontSize: '0.875rem' }}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tambah Tugas Modal */}
      {showAddTugas && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>Tambah Tugas Literasi</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '24px', marginTop: 0 }}>Masukkan topik penugasan untuk seluruh siswa kelas ini.</p>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Topik / Judul Tugas</label>
              <input 
                type="text" 
                value={newTugasTitle} 
                onChange={e => setNewTugasTitle(e.target.value)} 
                placeholder="Contoh: Membaca Cerpen Kancil"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddTugas(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
              <button onClick={handleAddTugas} className="hover-btn" style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#004282', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>Export Laporan Literasi</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '24px', marginTop: 0 }}>Pilih periode waktu tugas yang ingin di-export (opsional).</p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Tanggal Mulai</label>
              <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Tanggal Akhir</label>
              <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowExportModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
              <button onClick={() => setShowExportModal(false)} className="hover-btn" style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#004282', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={16}/> Download PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details & Upload Modal */}
      {selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
          <div className="animate-fade-in" style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '600px', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Tugas Literasi: {selectedStudent.name}</h2>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 0 0 0' }}>NIS: {selectedStudent.nis || '-'}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#9ca3af', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
              {selectedStudent.tasks.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '8px' }}>Belum ada tugas yang diberikan.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedStudent.tasks.map(t => (
                    <div key={t.id} style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem', marginBottom: '4px' }}>{t.title}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{new Date(t.date).toLocaleDateString('id-ID')}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {t.fileUrl ? (
                          <>
                            <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" className="hover-btn" style={{ padding: '8px 12px', backgroundColor: '#eff6ff', color: '#004282', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
                              <Eye size={16} /> Lihat
                            </a>
                            
                            <input 
                              type="file" 
                              id={`reupload-${t.id}`} 
                              style={{ display: 'none' }} 
                              onChange={(e) => handleUploadTugas(t.id, e.target.files[0])} 
                            />
                            <label htmlFor={`reupload-${t.id}`} className="hover-btn" style={{ padding: '8px', backgroundColor: '#f3f4f6', color: '#4b5563', borderRadius: '8px', display: 'flex', alignItems: 'center', cursor: 'pointer' }} title="Re-upload Tugas">
                              <Edit2 size={16} />
                            </label>

                            <button onClick={() => handleDeleteTugas(t.id)} className="hover-btn" style={{ padding: '8px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer' }} title="Hapus Tugas">
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <input 
                              type="file" 
                              id={`upload-${t.id}`} 
                              style={{ display: 'none' }} 
                              onChange={(e) => handleUploadTugas(t.id, e.target.files[0])} 
                            />
                            <label htmlFor={`upload-${t.id}`} className="hover-btn" style={{ padding: '8px 12px', backgroundColor: '#059669', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                              <Upload size={16} /> Upload
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '24px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => {
                  setSelectedStudent(null);
                  if (hasChanges) window.location.reload();
                }} 
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', fontWeight: 600, cursor: 'pointer' }}
              >
                Tutup
              </button>
              {hasChanges && (
                <button 
                  onClick={() => window.location.reload()} 
                  className="hover-btn"
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#004282', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  Simpan Data
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
