'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Upload, MoreHorizontal, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { getSchools, createSchool, updateSchool, deleteSchool, bulkImportSchools } from '../../actions/master';
import DragDropUpload from './DragDropUpload';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function SekolahTab() {
  const [schools, setSchools] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);

  // Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState(null);

  const fetchSchools = async () => {
    setLoading(true);
    const res = await getSchools(page, 10, search, sort.key, sort.dir);
    setSchools(res.schools);
    setTotal(res.total);
    setTotalPages(res.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    fetchSchools();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      npsn: formData.get('npsn'),
      kecamatan: formData.get('kecamatan'),
      address: formData.get('address'),
    };

    let res;
    if (editingSchool) {
      res = await updateSchool(editingSchool.id, data);
    } else {
      res = await createSchool(data);
    }

    if (res.success) {
      toast.success(editingSchool ? 'Sekolah updated!' : 'Sekolah created!');
      setShowModal(false);
      setEditingSchool(null);
      fetchSchools();
    } else {
      toast.error(res.error || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!schoolToDelete) return;
    const res = await deleteSchool(schoolToDelete.id);
    if (res.success) {
      toast.success('Sekolah deleted!');
      setIsDeleteModalOpen(false);
      setSchoolToDelete(null);
      fetchSchools();
    } else {
      toast.error('Failed to delete');
    }
  };

  const handleImport = async (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Map data to match schema
        const mappedData = data.map(row => ({
          name: row['Nama Sekolah'],
          npsn: String(row['NPSN'] || ''),
          kecamatan: row['Kecamatan'] || '',
          address: row['Alamat'] || '',
        })).filter(row => row.name && row.npsn); // Ensure required fields

        if (mappedData.length === 0) {
          toast.error('No valid data found in Excel');
          return;
        }

        const res = await bulkImportSchools(mappedData);
        if (res.success) {
          toast.success(`${mappedData.length} schools imported!`);
          setShowImportModal(false);
          fetchSchools();
        } else {
          toast.error(res.error || 'Import failed');
        }
      } catch (err) {
        toast.error('Failed to parse Excel file');
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      'Nama Sekolah': 'SMAN 1 Contoh',
      'NPSN': '20300111',
      'Kecamatan': 'Brebes',
      'Alamat': 'Jl. Contoh No. 1'
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Import_Sekolah.xlsx");
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div className="search-container" style={{ width: '300px', backgroundColor: '#fff' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Cari sekolah..." 
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
            onClick={() => { setEditingSchool(null); setShowModal(true); }}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Tambah Sekolah
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--admin-border)', overflow: 'hidden' }}>
        <table className="attention-table" style={{ width: '100%' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '16px' }}>No</th>
              <th onClick={() => handleSort('name')} style={{ padding: '16px', cursor: 'pointer' }}>Nama Sekolah {sort.key === 'name' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th onClick={() => handleSort('npsn')} style={{ padding: '16px', cursor: 'pointer' }}>NPSN {sort.key === 'npsn' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th onClick={() => handleSort('kecamatan')} style={{ padding: '16px', cursor: 'pointer' }}>Kecamatan {sort.key === 'kecamatan' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th onClick={() => handleSort('users')} style={{ padding: '16px', cursor: 'pointer' }}>Jumlah Guru {sort.key === 'users' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th onClick={() => handleSort('mentor')} style={{ padding: '16px', cursor: 'pointer' }}>Mentor {sort.key === 'mentor' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th style={{ padding: '16px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
            ) : schools.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>Tidak ada data.</td></tr>
            ) : schools.map((s, idx) => (
              <tr key={s.id}>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>{(page - 1) * 10 + idx + 1}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)', fontWeight: 500, color: 'var(--primary-color)' }}>{s.name}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>{s.npsn || '-'}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>{s.kecamatan || '-'}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>
                  <span style={{ backgroundColor: '#f1f5f9', padding: '4px 12px', borderRadius: '99px', fontSize: '0.875rem' }}>{s._count.users}</span>
                </td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>
                  {s.mentors && s.mentors.length > 0 ? <span style={{ fontWeight: 500 }}>{s.mentors.map(m => m.name).join(', ')}</span> : <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Belum ada</span>}
                </td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>
                  <button onClick={() => { setEditingSchool(s); setShowModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px', color: 'var(--secondary-color)' }}><Edit size={16} /></button>
                  <button onClick={() => { setSchoolToDelete(s); setIsDeleteModalOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--admin-border)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
            Menampilkan {schools.length > 0 ? (page - 1) * 10 + 1 : 0} - {Math.min(page * 10, total)} dari {total} hasil
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '8px 12px', border: '1px solid var(--admin-border)', background: 'white', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              {'<'}
            </button>
            <span style={{ padding: '8px 16px', background: '#e0f2fe', color: 'var(--primary-color)', fontWeight: 600, borderRadius: '6px' }}>{page}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              style={{ padding: '8px 12px', border: '1px solid var(--admin-border)', background: 'white', borderRadius: '6px', cursor: (page === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer' }}
            >
              {'>'}
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>{editingSchool ? 'Edit Sekolah' : 'Tambah Sekolah'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Nama Sekolah *</label>
                <input name="name" defaultValue={editingSchool?.name} required className="login-input" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>NPSN *</label>
                <input name="npsn" defaultValue={editingSchool?.npsn} required className="login-input" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Kecamatan</label>
                <input name="kecamatan" defaultValue={editingSchool?.kecamatan} className="login-input" />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Alamat</label>
                <textarea name="address" defaultValue={editingSchool?.address} className="login-input" rows="3" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', border: '1px solid var(--admin-border)', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: '10px 16px', border: 'none', background: 'var(--primary-color)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>Import Massal Sekolah</h3>
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
        onClose={() => { setIsDeleteModalOpen(false); setSchoolToDelete(null); }} 
        onConfirm={handleDelete} 
        itemName={schoolToDelete?.name || ''} 
      />
    </div>
  );
}
