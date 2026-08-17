import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import SetelanClient from './SetelanClient';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function SetelanPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/');
  }

  // Cari user pengawas berdasarkan sesi
  // Kita coba match dengan nama karena NextAuth default kadang hanya simpan nama & email
  const user = await prisma.user.findFirst({
    where: { 
      name: session.user.name,
      role: 'PENGAWAS'
    }
  });

  if (!user) {
    return <div style={{ padding: '32px' }}>Akses Ditolak atau User Tidak Ditemukan.</div>;
  }

  // Kirim data user tanpa password
  const userData = {
    name: user.name,
    username: user.username,
  };

  return <SetelanClient user={userData} />;
}
