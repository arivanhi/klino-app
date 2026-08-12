'use client';

import { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';

export default function DragDropUpload({ onFileSelect, accept = ".xlsx, .xls" }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current.click()}
      style={{
        border: `2px dashed ${isDragging ? 'var(--primary-color)' : 'var(--admin-border)'}`,
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: isDragging ? '#f0f9ff' : '#fafafa',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}
    >
      <UploadCloud size={48} color={isDragging ? 'var(--primary-color)' : '#9ca3af'} />
      <div>
        <p style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Click to upload or drag and drop</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Excel files ({accept})</p>
      </div>
      <input 
        type="file" 
        accept={accept} 
        onChange={(e) => onFileSelect(e.target.files[0])} 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
      />
    </div>
  );
}
