'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Upload, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { getMentors, createMentor, updateMentor, deleteMentor, bulkImportMentors, getAllSchoolsSimple } from '../../actions/master';
import DragDropUpload from './DragDropUpload';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function SupervisorTab() {
  const [mentors, setMentors] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [loading, setLoading] = useState(false);
  
  // Forms
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingMentor, setEditingMentor] = useState(null);
  const [schools, setSchools] = useState([]);

  // Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mentorToDelete, setMentorToDelete] = useState(null);

  const fetchMentors = async () => {
    setLoading(true);
    const res = await getMentors(page, 10, search, sort.key, sort.dir);
    setMentors(res.mentors);
    setTotal(res.total);
    setTotalPages(res.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    fetchMentors();
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
      name: formData.get('name'),
      type: formData.get('type'),
      sekolahId: parseInt(formData.get('sekolahId'))
    };

    let res;
    if (editingMentor) {
      res = await updateMentor(editingMentor.id, data);
    } else {
      res = await createMentor(data);
    }

    if (res.success) {
      toast.success(editingMentor ? 'Mentor updated!' : 'Mentor created!');
      setShowModal(false);
      setEditingMentor(null);
      fetchMentors();
    } else {
      toast.error('Failed to save mentor');
    }
  };

  const handleDelete = async () => {
    if (!mentorToDelete) return;
    const res = await deleteMentor(mentorToDelete.id);
    if (res.success) {
      toast.success('Mentor deleted!');
      setIsDeleteModalOpen(false);
      setMentorToDelete(null);
      fetchMentors();
    } else {
      toast.error('Failed to delete mentor');
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
          name: row['Nama Mentor'] || '',
          type: row['Tipe Mentor'] || '',
          sekolahName: row['Nama Sekolah'] || ''
        })).filter(r => r.name && r.type && r.sekolahName);

        if (mappedData.length === 0) return toast.error('No valid data found');

        const res = await bulkImportMentors(mappedData);
        if (res.success) {
          toast.success(`${mappedData.length} mentor imported!`);
          setShowImportModal(false);
          fetchMentors();
        } else toast.error('Import failed. Make sure school names exist.');
      } catch (err) {
        toast.error('Failed to parse Excel file');
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Nama Mentor': 'Budi Santoso', 'Tipe Mentor': 'Literasi', 'Nama Sekolah': 'SMAN 1 Brebes' },
      { 'Nama Mentor': 'Siti Aminah', 'Tipe Mentor': 'Numerasi', 'Nama Sekolah': 'SMAN 2 Brebes' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Import_Mentor.xlsx");
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div className="search-container" style={{ width: '300px', backgroundColor: '#fff' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Cari mentor..." 
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
            onClick={() => { setEditingMentor(null); setShowModal(true); }}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Tambah Mentor
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--admin-border)', overflow: 'hidden' }}>
        <table className="attention-table" style={{ width: '100%' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '16px' }}>No</th>
              <th onClick={() => handleSort('name')} style={{ padding: '16px', cursor: 'pointer' }}>Nama Mentor {sort.key === 'name' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th onClick={() => handleSort('type')} style={{ padding: '16px', cursor: 'pointer' }}>Tipe Mentor {sort.key === 'type' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th onClick={() => handleSort('sekolah')} style={{ padding: '16px', cursor: 'pointer' }}>Sekolah {sort.key === 'sekolah' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th style={{ padding: '16px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
            ) : mentors.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>Tidak ada data.</td></tr>
            ) : mentors.map((m, idx) => (
              <tr key={m.id}>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>{(page - 1) * 10 + idx + 1}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)', fontWeight: 500, color: 'var(--primary-color)' }}>{m.name}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '99px', 
                    fontSize: '0.875rem',
                    backgroundColor: m.type === 'Literasi' ? '#e0f2fe' : '#fce7f3',
                    color: m.type === 'Literasi' ? '#0284c7' : '#db2777'
                  }}>
                    {m.type}
                  </span>
                </td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>{m.sekolah?.name || '-'}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>
                  <button onClick={() => { setEditingMentor(m); setShowModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px', color: 'var(--secondary-color)' }}><Edit size={16} /></button>
                  <button onClick={() => { setMentorToDelete(m); setIsDeleteModalOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--admin-border)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
            Menampilkan {mentors.length > 0 ? (page - 1) * 10 + 1 : 0} - {Math.min(page * 10, total)} dari {total} hasil
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 12px', border: '1px solid var(--admin-border)', background: 'white', borderRadius: '6px' }}>{'<'}</button>
            <span style={{ padding: '8px 16px', background: '#e0f2fe', color: 'var(--primary-color)', fontWeight: 600, borderRadius: '6px' }}>{page}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} style={{ padding: '8px 12px', border: '1px solid var(--admin-border)', background: 'white', borderRadius: '6px' }}>{'>'}</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>{editingMentor ? 'Edit Mentor' : 'Tambah Mentor'}</h3>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Nama Mentor *</label>
                <input name="name" defaultValue={editingMentor?.name} required className="login-input" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Tipe Mentor *</label>
                <select name="type" defaultValue={editingMentor?.type || 'Literasi'} required className="login-input" style={{ width: '100%' }}>
                  <option value="Literasi">Literasi</option>
                  <option value="Numerasi">Numerasi</option>
                </select>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Sekolah Asal *</label>
                <select name="sekolahId" defaultValue={editingMentor?.sekolahId || ''} required className="login-input" style={{ width: '100%' }}>
                  <option value="">-- Pilih Sekolah --</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', border: '1px solid var(--admin-border)', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: '10px 16px', border: 'none', background: 'var(--primary-color)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>Import Massal Mentor</h3>
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
        onClose={() => { setIsDeleteModalOpen(false); setMentorToDelete(null); }} 
        onConfirm={handleDelete} 
        itemName={mentorToDelete?.name || ''} 
      />
    </div>
  );
}
