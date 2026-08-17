'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, User, Lock, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SetelanClient({ user }) {
  const router = useRouter();
  
  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [password, setPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const event = new CustomEvent('setTopbarTitle', { detail: 'Setelan Akun' });
    window.dispatchEvent(event);
    return () => window.dispatchEvent(new CustomEvent('setTopbarTitle', { detail: '' }));
  }, []);

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      toast.error('Nama dan Username tidak boleh kosong!');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    setShowConfirmModal(false);
    setIsSaving(true);
    const loadingToast = toast.loading('Menyimpan perubahan...');

    try {
      const res = await fetch('/api/guru/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Profil berhasil diperbarui!', { id: loadingToast });
        setPassword(''); 
        
        if (name !== user.name || username !== user.username) {
            toast('Silakan logout dan login kembali untuk melihat perubahan profil secara penuh di sistem.', {
              icon: 'ℹ️',
              duration: 5000
            });
        }
        
        router.refresh();
      } else {
        toast.error(data.error || 'Terjadi kesalahan', { id: loadingToast });
      }
    } catch (error) {
      toast.error('Gagal terhubung ke server.', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '32px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#111827', margin: '0 0 8px 0', fontWeight: 700 }}>Profil Guru</h2>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>Perbarui informasi akun kredensial Anda di sini.</p>
        </div>

        <form onSubmit={handleSaveClick} style={{ padding: '32px' }}>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
              <User size={16} /> Nama Lengkap
            </label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '1rem', transition: 'border-color 0.2s' }}
              className="focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
              <User size={16} /> Username
            </label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Masukkan username untuk login"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '1rem' }}
            />
          </div>

          <div style={{ marginBottom: '40px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
              <Lock size={16} /> Kata Sandi Baru
            </label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Kosongkan jika tidak ingin mengubah password"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '1rem' }}
            />
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '8px' }}>Peringatan: Mengubah password akan berdampak pada akses login Anda berikutnya.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit"
              disabled={isSaving}
              className="hover-btn"
              style={{ 
                backgroundColor: '#004282', color: 'white', padding: '14px 32px', 
                borderRadius: '8px', border: 'none', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', opacity: isSaving ? 0.7 : 1
              }}
            >
              <Save size={20} /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="animate-fade-in" style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <AlertTriangle size={30} />
            </div>
            <h3 style={{ marginBottom: '12px', fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Konfirmasi Perubahan</h3>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '32px', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menyimpan perubahan profil ini?
            </p>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowConfirmModal(false)} 
                style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', background: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#4b5563' }}
              >
                No
              </button>
              <button 
                onClick={confirmSave}
                style={{ flex: 1, padding: '12px', border: 'none', background: '#004282', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
