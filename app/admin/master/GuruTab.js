'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Upload, Edit, Trash2, ArrowUp, ArrowDown, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { getUsers, getAllSchoolsSimple, bulkImportTeachers, createTeacher, updateTeacher, deleteTeacher, resetTeacherPassword } from '../../actions/master';
import DragDropUpload from './DragDropUpload';
import ConfirmDeleteModal from './ConfirmDeleteModal';

// Notice: In a real app we'd have a createUser and updateUser action that handles passwords and relations.
// We'll mock the creation call here, assuming they'd be added to master.js later.
// For now, this focuses on listing and UI.

export default function GuruTab() {
  const [gurus, setGurus] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [loading, setLoading] = useState(false);

  // Forms
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingGuru, setEditingGuru] = useState(null);
  const [schools, setSchools] = useState([]);

  // Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [guruToDelete, setGuruToDelete] = useState(null);

  const fetchGurus = async () => {
    setLoading(true);
    const res = await getUsers('GURU', page, 10, search, sort.key, sort.dir);
    setGurus(res.users);
    setTotal(res.total);
    setTotalPages(res.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    fetchGurus();
    getAllSchoolsSimple().then(setSchools);
  }, [page, search, sort]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSort = (key) => {
    let dir = 'asc';
    if (sort.key === key && sort.dir === 'asc') dir = 'desc';
    setSort({ key, dir });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      username: formData.get('username'),
      name: formData.get('name'),
      sekolahId: parseInt(formData.get('sekolahId'))
    };

    let res;
    if (editingGuru) {
      res = await updateTeacher(editingGuru.id, data);
    } else {
      res = await createTeacher(data);
    }

    if (res.success) {
      toast.success(editingGuru ? 'Guru berhasil diupdate!' : 'Guru berhasil ditambahkan!');
      setShowModal(false);
      setEditingGuru(null);
      fetchGurus();
    } else {
      toast.error('Gagal menyimpan Guru: ' + res.error);
    }
  };

  const handleDelete = async () => {
    if (!guruToDelete) return;
    const res = await deleteTeacher(guruToDelete.id);
    if (res.success) {
      toast.success('Guru deleted!');
      setIsDeleteModalOpen(false);
      setGuruToDelete(null);
      fetchGurus();
    } else {
      toast.error('Failed to delete guru');
    }
  };

  const handleResetPassword = async (id) => {
    if (confirm('Yakin ingin mereset password ke "klino123"?')) {
      const res = await resetTeacherPassword(id);
      if (res.success) {
        toast.success('Password direset!');
      } else {
        toast.error('Gagal mereset password');
      }
    }
  };

  const handleImport = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        const mappedData = data.map(row => ({
          username: String(row['NIP/Username'] || ''),
          name: row['Nama Guru'] || '',
          role: 'GURU',
          sekolahName: row['Nama Sekolah'] || ''
        })).filter(r => r.username && r.name);

        if (mappedData.length === 0) return toast.error('No valid data found');

        const res = await bulkImportTeachers(mappedData);
        if (res.success) {
          toast.success(`${mappedData.length} guru imported!`);
          setShowImportModal(false);
          fetchGurus();
        } else toast.error('Import failed');
      } catch (err) {
        toast.error('Failed to parse Excel file');
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'NIP/Username': '19800101', 'Nama Guru': 'Budi Santoso', 'Nama Sekolah': 'SMAN 1 Brebes' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Import_Guru.xlsx");
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div className="search-container" style={{ width: '300px', backgroundColor: '#fff' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Cari guru..." 
            className="search-input"
            value={search}
            onChange={handleSearch}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setShowImportModal(true)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Upload size={16} /> Import Massal
          </button>
          <button 
            onClick={() => setShowModal(true)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Tambah Guru
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--admin-border)', overflow: 'hidden' }}>
        <table className="attention-table" style={{ width: '100%' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '16px' }}>No</th>
              <th onClick={() => handleSort('username')} style={{ padding: '16px', cursor: 'pointer' }}>NIP / Username {sort.key === 'username' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th onClick={() => handleSort('name')} style={{ padding: '16px', cursor: 'pointer' }}>Nama Guru {sort.key === 'name' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th onClick={() => handleSort('sekolah')} style={{ padding: '16px', cursor: 'pointer' }}>Sekolah Asal {sort.key === 'sekolah' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th style={{ padding: '16px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
            ) : gurus.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>Tidak ada data.</td></tr>
            ) : gurus.map((g, idx) => (
              <tr key={g.id}>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>{(page - 1) * 10 + idx + 1}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)', fontWeight: 500 }}>{g.username}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>{g.name}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)', color: 'var(--primary-color)' }}>{g.sekolah?.name || '-'}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>
                  <button onClick={() => handleResetPassword(g.id)} title="Reset Password" style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px', color: '#f59e0b' }}><Key size={16} /></button>
                  <button onClick={() => { setEditingGuru(g); setShowModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px', color: 'var(--secondary-color)' }}><Edit size={16} /></button>
                  <button onClick={() => { setGuruToDelete(g); setIsDeleteModalOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--admin-border)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
            Menampilkan {gurus.length > 0 ? (page - 1) * 10 + 1 : 0} - {Math.min(page * 10, total)} dari {total} hasil
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '8px 12px', border: '1px solid var(--admin-border)', background: 'white', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >{'<'}</button>
            <span style={{ padding: '8px 16px', background: '#e0f2fe', color: 'var(--primary-color)', fontWeight: 600, borderRadius: '6px' }}>{page}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              style={{ padding: '8px 12px', border: '1px solid var(--admin-border)', background: 'white', borderRadius: '6px', cursor: (page === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer' }}
            >{'>'}</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>{editingGuru ? 'Edit Guru' : 'Tambah Guru'}</h3>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>NIP / Username *</label>
                <input name="username" defaultValue={editingGuru?.username} required className="login-input" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Nama Lengkap *</label>
                <input name="name" defaultValue={editingGuru?.name} required className="login-input" />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Sekolah Asal *</label>
                <select name="sekolahId" defaultValue={editingGuru?.sekolahId || ''} required className="login-input" style={{ width: '100%' }}>
                  <option value="">-- Pilih Sekolah --</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => { setShowModal(false); setEditingGuru(null); }} style={{ padding: '10px 16px', border: '1px solid var(--admin-border)', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: '10px 16px', border: 'none', background: 'var(--primary-color)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>Import Massal Guru</h3>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '16px' }}>1. Download template Excel dan isi datanya.</p>
              <button onClick={downloadTemplate} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid var(--admin-border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Download Template</button>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '16px' }}>2. Upload file Excel yang sudah diisi.</p>
              <DragDropUpload onFileSelect={handleImport} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowImportModal(false)} style={{ padding: '10px 16px', border: '1px solid var(--admin-border)', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => { setIsDeleteModalOpen(false); setGuruToDelete(null); }} 
        onConfirm={handleDelete} 
        itemName={guruToDelete?.name || ''} 
      />
    </div>
  );
}
