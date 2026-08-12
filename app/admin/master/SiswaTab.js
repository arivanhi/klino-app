'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Upload, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { getStudents, getAllSchoolsSimple, bulkImportStudents, deleteStudent, createStudent, updateStudent } from '../../actions/master';
import DragDropUpload from './DragDropUpload';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function SiswaTab() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [loading, setLoading] = useState(false);

  // Sub-navigation by school
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);

  // Forms
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  
  // Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const fetchSchools = async () => {
    const res = await getAllSchoolsSimple();
    setSchools(res);
    if (res.length > 0 && !selectedSchool) {
      setSelectedSchool(res[0].id);
    }
  };

  const fetchStudents = async () => {
    if (!selectedSchool) return;
    setLoading(true);
    const res = await getStudents(selectedSchool, page, 10, search, sort.key, sort.dir);
    setStudents(res.students);
    setTotal(res.total);
    setTotalPages(res.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, search, sort, selectedSchool]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSort = (key) => {
    let dir = 'asc';
    if (sort.key === key && sort.dir === 'asc') dir = 'desc';
    setSort({ key, dir });
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    const res = await deleteStudent(studentToDelete.id);
    if (res.success) {
      toast.success('Siswa deleted!');
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
      fetchStudents();
    } else {
      toast.error('Failed to delete');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      nis: formData.get('nis'),
      name: formData.get('name'),
      kelasName: formData.get('kelasName'),
      sekolahId: selectedSchool
    };
    
    if (!data.sekolahId) {
      return toast.error('Pilih sekolah terlebih dahulu!');
    }

    let res;
    if (editingStudent) {
      res = await updateStudent(editingStudent.id, data);
    } else {
      res = await createStudent(data);
    }

    if (res.success) {
      toast.success(editingStudent ? 'Siswa berhasil diupdate!' : 'Siswa berhasil ditambahkan!');
      setShowModal(false);
      setEditingStudent(null);
      fetchStudents();
    } else {
      toast.error('Gagal menyimpan siswa');
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
          nis: String(row['NIS'] || ''),
          name: row['Nama'] || '',
          kelasName: row['Kelas'] || '',
          sekolahName: row['Nama Sekolah'] || '',
          sekolahIdFallback: selectedSchool
        })).filter(r => r.nis && r.name && r.kelasName);

        if (mappedData.length === 0) return toast.error('No valid data found');

        const res = await bulkImportStudents(mappedData);
        if (res.success) {
          toast.success(`${mappedData.length} siswa imported!`);
          setShowImportModal(false);
          fetchStudents();
        } else toast.error('Import failed');
      } catch (err) {
        toast.error('Failed to parse Excel file');
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'NIS': '1011', 'Nama': 'Andi', 'Kelas': 'X-A', 'Nama Sekolah': 'SMAN 1 Brebes' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Import_Siswa.xlsx");
  };

  return (
    <div>
      {/* Sub navigation for Schools */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
        {schools.map(s => (
          <button
            key={s.id}
            onClick={() => { setSelectedSchool(s.id); setPage(1); }}
            style={{
              padding: '8px 16px',
              borderRadius: '99px',
              border: selectedSchool === s.id ? 'none' : '1px solid var(--admin-border)',
              background: selectedSchool === s.id ? 'var(--primary-color)' : 'white',
              color: selectedSchool === s.id ? 'white' : 'var(--text-dark)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.875rem'
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div className="search-container" style={{ width: '300px', backgroundColor: '#fff' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Cari siswa (Nama/NIS)..." 
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
            <Plus size={16} /> Tambah Siswa
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--admin-border)', overflow: 'hidden' }}>
        <table className="attention-table" style={{ width: '100%' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '16px' }}>No</th>
              <th onClick={() => handleSort('nis')} style={{ padding: '16px', cursor: 'pointer' }}>NIS {sort.key === 'nis' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th onClick={() => handleSort('name')} style={{ padding: '16px', cursor: 'pointer' }}>Nama Siswa {sort.key === 'name' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th onClick={() => handleSort('sekolah')} style={{ padding: '16px', cursor: 'pointer' }}>Sekolah {sort.key === 'sekolah' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th onClick={() => handleSort('kelas')} style={{ padding: '16px', cursor: 'pointer' }}>Kelas {sort.key === 'kelas' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th style={{ padding: '16px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Tidak ada data.</td></tr>
            ) : students.map((s, idx) => (
              <tr key={s.id}>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>{(page - 1) * 10 + idx + 1}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)', fontWeight: 500 }}>{s.nis}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>{s.name}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>{s.sekolah.name}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>{s.kelas.name}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>
                  <button onClick={() => { setEditingStudent(s); setShowModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px', color: 'var(--secondary-color)' }}><Edit size={16} /></button>
                  <button onClick={() => { setStudentToDelete(s); setIsDeleteModalOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--admin-border)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
            Menampilkan {students.length > 0 ? (page - 1) * 10 + 1 : 0} - {Math.min(page * 10, total)} dari {total} hasil
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
            <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>{editingStudent ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>NIS *</label>
                <input name="nis" defaultValue={editingStudent?.nis} required className="login-input" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Nama Siswa *</label>
                <input name="name" defaultValue={editingStudent?.name} required className="login-input" />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Kelas * (cth: X-A)</label>
                <input name="kelasName" defaultValue={editingStudent?.kelas?.name} required className="login-input" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => { setShowModal(false); setEditingStudent(null); }} style={{ padding: '10px 16px', border: '1px solid var(--admin-border)', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: '10px 16px', border: 'none', background: 'var(--primary-color)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>Import Massal Siswa</h3>
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
        onClose={() => { setIsDeleteModalOpen(false); setStudentToDelete(null); }} 
        onConfirm={handleDelete} 
        itemName={studentToDelete?.name || ''} 
      />
    </div>
  );
}
