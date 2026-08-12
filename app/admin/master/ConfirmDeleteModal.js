'use client';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, itemName }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '1.25rem', color: '#ef4444' }}>Konfirmasi Hapus</h3>
        <p style={{ color: 'var(--text-light)', marginBottom: '24px', fontSize: '0.875rem' }}>
          Apakah Anda yakin ingin menghapus data <strong>{itemName}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ padding: '10px 24px', border: '1px solid var(--admin-border)', background: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
          >
            Batal
          </button>
          <button 
            type="button" 
            onClick={onConfirm} 
            style={{ padding: '10px 24px', border: 'none', background: '#ef4444', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
