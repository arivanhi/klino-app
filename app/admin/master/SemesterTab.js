'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Edit, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSemesters, createSemester, setActiveSemester, updateSemester } from '../../actions/master';

export default function SemesterTab() {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });

  const fetchSemesters = async () => {
    setLoading(true);
    const res = await getSemesters(sort.key, sort.dir);
    setSemesters(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchSemesters();
  }, [sort]);

  const handleSort = (key) => {
    let dir = 'asc';
    if (sort.key === key && sort.dir === 'asc') dir = 'desc';
    setSort({ key, dir });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      tahunAjaran: formData.get('tahunAjaran'),
      jenis: formData.get('jenis'),
      isActive: editingSemester ? (formData.get('isActive') === 'on') : false
    };

    let res;
    if (editingSemester) {
      res = await updateSemester(editingSemester.id, data);
    } else {
      res = await createSemester(data);
    }

    if (res.success) {
      toast.success(editingSemester ? 'Semester updated!' : 'Semester created!');
      setShowModal(false);
      setEditingSemester(null);
      fetchSemesters();
    } else {
      toast.error(res.error || 'Failed to save semester');
    }
  };

  const handleSetActive = async (id) => {
    const res = await setActiveSemester(id);
    if (res.success) {
      toast.success('Semester Aktif diubah!');
      fetchSemesters();
    } else {
      toast.error('Gagal mengubah semester aktif');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button 
          onClick={() => { setEditingSemester(null); setShowModal(true); }}
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} /> Tambah Semester
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--admin-border)', overflow: 'hidden' }}>
        <table className="attention-table" style={{ width: '100%' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '16px' }}>No</th>
              <th onClick={() => handleSort('tahunAjaran')} style={{ padding: '16px', cursor: 'pointer' }}>Tahun Ajaran {sort.key === 'tahunAjaran' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th onClick={() => handleSort('jenis')} style={{ padding: '16px', cursor: 'pointer' }}>Jenis Semester {sort.key === 'jenis' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th onClick={() => handleSort('isActive')} style={{ padding: '16px', cursor: 'pointer' }}>Status {sort.key === 'isActive' ? (sort.dir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : ''}</th>
              <th style={{ padding: '16px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
            ) : semesters.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>Tidak ada data.</td></tr>
            ) : semesters.map((s, idx) => (
              <tr key={s.id} style={{ backgroundColor: s.isActive ? '#f0fdf4' : 'transparent' }}>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>{idx + 1}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)', fontWeight: 500 }}>{s.tahunAjaran}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>{s.jenis}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>
                  {s.isActive ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--secondary-color)', fontWeight: 600, fontSize: '0.875rem' }}>
                      <CheckCircle size={16} /> Aktif
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Tidak Aktif</span>
                  )}
                </td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--admin-border)' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {!s.isActive && (
                      <button onClick={() => handleSetActive(s.id)} style={{ padding: '6px 12px', border: '1px solid var(--admin-border)', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                        Jadikan Aktif
                      </button>
                    )}
                    <button onClick={() => { setEditingSemester(s); setShowModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary-color)' }}><Edit size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>{editingSemester ? 'Edit Semester' : 'Tambah Semester'}</h3>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Tahun Ajaran * (cth: 2023/2024)</label>
                <input name="tahunAjaran" defaultValue={editingSemester?.tahunAjaran} required placeholder="YYYY/YYYY" className="login-input" />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Jenis Semester *</label>
                <select name="jenis" defaultValue={editingSemester?.jenis || "Ganjil"} required className="login-input" style={{ width: '100%' }}>
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
              {editingSemester && (
                <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="isActive" name="isActive" defaultChecked={editingSemester.isActive} />
                  <label htmlFor="isActive" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Jadikan Semester Aktif</label>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', border: '1px solid var(--admin-border)', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: '10px 16px', border: 'none', background: 'var(--primary-color)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
