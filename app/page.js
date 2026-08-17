'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Hand, BarChart3, Target, GraduationCap, Eye, EyeOff } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    const result = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    setLoading(false);

    if (result?.error) {
      toast.error('Invalid credentials');
    } else {
      toast.success('Login successful!');
      const session = await getSession();
      if (session?.user?.role === 'ADMIN') {
        window.location.href = '/admin';
      } else if (session?.user?.role === 'PENGAWAS') {
        window.location.href = '/pengawas';
      } else if (session?.user?.role === 'GURU') {
        window.location.href = '/guru';
      } else {
        window.location.href = '/';
      }
    }
  };

  return (
    <div className="login-container">
      {/* Left Side: Branding / Info */}
      <div className="login-left">
        <div className="glass login-glass-hero animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'inline-block' }}>
              <img src="/logo.png" alt="KLiNO Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
            </div>
          </div>
          <h1 style={{ fontSize: '3rem', marginBottom: '8px', fontWeight: '700' }}>KLiNO</h1>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: '400', opacity: 0.9 }}>Klinik Literasi Numerasi Online</h2>
          <p style={{ opacity: 0.8, lineHeight: '1.6', marginBottom: '32px' }}>
            Platform diagnostik komprehensif untuk memantau dan mengembangkan kompetensi literasi serta numerasi siswa.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '0.875rem', opacity: 0.9 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart3 size={16} /> Pemantauan Objektif
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={16} /> Diagnostik Akurat
            </span>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="login-right">
        <div className="login-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h1 style={{ fontSize: '2rem', color: '#111827', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Selamat Datang <Hand size={32} color="#f59e0b" style={{ fill: '#fcd34d' }} />
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '40px', lineHeight: '1.5' }}>
            Silakan masuk ke akun Anda untuk memantau perkembangan literasi dan numerasi.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="login-input-group">
              <label className="login-label">NPP / NIP</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="username" 
                  className="login-input" 
                  placeholder="Masukkan NPP atau NIP Anda" 
                  required 
                />
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-label">PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  className="login-input" 
                  placeholder="••••••••••••" 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
              <input type="checkbox" id="remember" style={{ marginRight: '8px', width: '16px', height: '16px' }} />
              <label htmlFor="remember" style={{ color: '#4b5563', fontSize: '0.875rem' }}>Ingat saya</label>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk →'}
            </button>
          </form>

          <div style={{ marginTop: '48px', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '32px' }}>
            <a href="#" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500', fontSize: '0.875rem' }}>
              Butuh bantuan untuk masuk?
            </a>
            <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <GraduationCap size={14} /> Sistem Intelijen Akademik
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
