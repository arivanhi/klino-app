import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import DetailKelasClient from './DetailKelasClient';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function DetailKelasNumerasiPage({ params }) {
  const { kelasId } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'GURU') {
    redirect('/');
  }

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) }
  });

  if (!user || !user.sekolahId) {
    return <div style={{ padding: '32px' }}>Anda belum ditugaskan ke sekolah manapun.</div>;
  }

  const kelas = await prisma.kelas.findUnique({
    where: { id: parseInt(kelasId) },
    include: {
      siswa: {
        include: {
          tugasNum: {
            orderBy: {
              date: 'asc'
            }
          }
        }
      }
    }
  });

  if (!kelas || kelas.sekolahId !== user.sekolahId) {
    return <div style={{ padding: '32px' }}>Kelas tidak ditemukan atau Anda tidak memiliki akses.</div>;
  }

  return (
    <DetailKelasClient 
      kelas={kelas} 
      schoolName={user.sekolah?.name || ''} 
    />
  );
}
