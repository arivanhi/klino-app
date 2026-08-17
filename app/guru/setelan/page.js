import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import SetelanClient from './SetelanClient';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function SetelanGuruPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { 
      id: parseInt(session.user.id)
    }
  });

  if (!user || user.role !== 'GURU') {
    return <div style={{ padding: '32px' }}>Akses Ditolak atau User Tidak Ditemukan.</div>;
  }

  const userData = {
    id: user.id,
    name: user.name,
    username: user.username,
  };

  return <SetelanClient user={userData} />;
}
