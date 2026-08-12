'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, SlidersHorizontal, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMentors, createMentor, updateMentor, deleteMentor, getAllSchoolsSimple } from '../../actions/master';
import ConfirmDeleteModal from '../master/ConfirmDeleteModal';

export default function MappingSupervisorPage() {
  const [mentors, setMentors] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [districtFilter, setDistrictFilter] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingMentor, setEditingMentor] = useState(null);
  
  // Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mentorToDelete, setMentorToDelete] = useState(null);

  const fetchMentors = async () => {
    setLoading(true);
    // getMentors returns { mentors, total, totalPages }
    // Note: getMentors in actions doesn't have district filter natively built-in the search easily, 
    // but it searches name and type. We can filter on client side or just rely on search.
    const res = await getMentors(page, 10, search, 'name', 'asc');
    
    let filteredMentors = res.mentors;
    if (districtFilter) {
      filteredMentors = filteredMentors.filter(m => m.sekolah?.kecamatan === districtFilter);
    }
    
    setMentors(filteredMentors);
    setTotal(res.total);
    setTotalPages(res.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    fetchMentors();
    getAllSchoolsSimple().then(setSchools);
  }, [page, search, districtFilter]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
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
      toast.success(editingMentor ? 'Supervisor updated!' : 'Supervisor assigned!');
      setShowModal(false);
      setEditingMentor(null);
      fetchMentors();
    } else {
      toast.error('Failed to save supervisor');
    }
  };

  const handleDelete = async () => {
    if (!mentorToDelete) return;
    const res = await deleteMentor(mentorToDelete.id);
    if (res.success) {
      toast.success('Supervisor deleted!');
      setIsDeleteModalOpen(false);
      setMentorToDelete(null);
      fetchMentors();
    } else {
      toast.error('Failed to delete supervisor');
    }
  };

  // Get unique districts from loaded schools to populate filter
  // In a real app we might fetch this from a distinct query, but this works for simple cases.
  const uniqueDistricts = [...new Set(mentors.map(m => m.sekolah?.kecamatan).filter(Boolean))];

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleBadge = (type) => {
    if (type === 'Literasi & Numerasi' || type === 'Keduanya') {
      return (
        <span style={{ backgroundColor: '#67e8f9', color: '#083344', padding: '6px 16px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 500 }}>
          Pemantau Literasi & Numerasi
        </span>
      );
    } else if (type === 'Numerasi') {
      return (
        <span style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', padding: '6px 16px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 500 }}>
          Pengajar Numerasi
        </span>
      );
    } else {
      return (
        <span style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', padding: '6px 16px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 500 }}>
          Pemantau Literasi
        </span>
      );
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ maxWidth: '700px' }}>
          <h1 style={{ fontSize: '2rem', color: '#111827', marginBottom: '8px', fontWeight: 700 }}>Mapping Supervisor</h1>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Assign and manage supervisory oversight for literacy and numeracy across schools to ensure clinical diagnostic standards are met.
          </p>
        </div>
        <button 
          onClick={() => { setEditingMentor(null); setShowModal(true); }}
          style={{ 
            backgroundColor: '#004282', 
            color: 'white', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '8px', 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Plus size={18} /> Assign New Supervisor
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {/* Toolbar */}
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #e5e7eb' }}>
          
          <div style={{ position: 'relative', width: '350px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input 
              type="text" 
              placeholder="Search by supervisor or school name..." 
              value={search}
              onChange={handleSearch}
              style={{ 
                width: '100%', 
                padding: '10px 16px 10px 40px', 
                borderRadius: '8px', 
                border: '1px solid #d1d5db',
                backgroundColor: '#f9fafb',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: 500 }}>Filter by District:</span>
              <select 
                value={districtFilter}
                onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }}
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: '8px', 
                  border: '1px solid #d1d5db',
                  backgroundColor: '#f9fafb',
                  fontSize: '0.9rem',
                  outline: 'none',
                  minWidth: '220px',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Districts (Kecamatan)</option>
                {uniqueDistricts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <button style={{ 
              padding: '10px', 
              borderRadius: '8px', 
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4b5563'
            }}>
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supervisor Name</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned School</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>District</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>Loading...</td></tr>
              ) : mentors.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>No supervisors found.</td></tr>
              ) : mentors.map((m, idx) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s' }} className="hover:bg-gray-50">
                  <td style={{ padding: '16px 24px', color: '#4b5563', fontSize: '0.9rem' }}>{(page - 1) * 10 + idx + 1}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', height: '36px', 
                        borderRadius: '50%', 
                        backgroundColor: '#e0e7ff', 
                        color: '#3730a3',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, fontSize: '0.85rem'
                      }}>
                        {getInitials(m.name)}
                      </div>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#4b5563', fontSize: '0.95rem' }}>{m.sekolah?.name || '-'}</td>
                  <td style={{ padding: '16px 24px', color: '#4b5563', fontSize: '0.95rem' }}>{m.sekolah?.kecamatan || '-'}</td>
                  <td style={{ padding: '16px 24px' }}>
                    {getRoleBadge(m.type)}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => { setEditingMentor(m); setShowModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }} title="Edit"><Edit size={18} /></button>
                      <button onClick={() => { setMentorToDelete(m); setIsDeleteModalOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Delete"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Showing <span style={{ fontWeight: 600, color: '#111827' }}>{mentors.length > 0 ? (page - 1) * 10 + 1 : 0}</span> to <span style={{ fontWeight: 600, color: '#111827' }}>{Math.min(page * 10, total)}</span> of <span style={{ fontWeight: 600, color: '#111827' }}>{total}</span> results
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              style={{ 
                padding: '8px 12px', 
                border: '1px solid #d1d5db', 
                backgroundColor: page === 1 ? '#f3f4f6' : 'white', 
                borderRadius: '6px',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                color: '#4b5563',
                display: 'flex', alignItems: 'center'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ padding: '8px 16px', border: '1px solid #2563eb', backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 500, borderRadius: '6px' }}>{page}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages || totalPages === 0}
              style={{ 
                padding: '8px 12px', 
                border: '1px solid #d1d5db', 
                backgroundColor: page === totalPages || totalPages === 0 ? '#f3f4f6' : 'white', 
                borderRadius: '6px',
                cursor: page === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                color: '#4b5563',
                display: 'flex', alignItems: 'center'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
              {editingMentor ? 'Edit Supervisor' : 'Assign New Supervisor'}
            </h3>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Supervisor Name *</label>
                <input name="name" defaultValue={editingMentor?.name} required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }} placeholder="e.g. Dr. Ahmad Subarjo" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Role / Type *</label>
                <select name="type" defaultValue={editingMentor?.type || 'Literasi'} required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}>
                  <option value="Literasi">Pemantau Literasi</option>
                  <option value="Numerasi">Pengajar Numerasi</option>
                  <option value="Literasi & Numerasi">Pemantau Literasi & Numerasi</option>
                </select>
              </div>
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Assigned School *</label>
                <select name="sekolahId" defaultValue={editingMentor?.sekolahId || ''} required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}>
                  <option value="">-- Select School --</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', border: '1px solid #d1d5db', background: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, color: '#374151' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', border: 'none', background: '#004282', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => { setIsDeleteModalOpen(false); setMentorToDelete(null); }} 
        onConfirm={handleDelete} 
        itemName={mentorToDelete?.name || ''} 
      />
    </div>
  );
}
