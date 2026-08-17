import { PrismaClient } from '@prisma/client';
import DashboardClient from './DashboardClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function GuruDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/');
  }

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    include: { sekolah: true }
  });

  if (!user || !user.sekolahId) {
    return <div style={{ padding: '32px' }}>Anda belum ditugaskan ke sekolah manapun.</div>;
  }

  const schoolId = user.sekolahId;
  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });

  const school = await prisma.sekolah.findUnique({
    where: { id: schoolId },
    include: {
      mentors: true,
      kelas: true,
      siswa: {
        include: {
          tugasLit: { orderBy: { date: 'desc' } },
          tugasNum: { orderBy: { date: 'desc' } },
          nilaiNum: true
        }
      }
    }
  });

  if (!school) {
    return <div style={{ padding: '32px' }}>Sekolah tidak ditemukan.</div>;
  }

  let totalLitScore = 0, totalLitCount = 0;
  let totalNumScore = 0, totalNumCount = 0;
  let totalStudents = school.siswa.length;
  
  const classesData = school.kelas.map(cls => {
    const students = school.siswa
      .filter(s => s.kelasId === cls.id)
      .map(s => {
        const totalLit = s.tugasLit.length;
        const doneLit = s.tugasLit.filter(t => {
          if (t.score !== null) {
            totalLitScore += t.score;
            totalLitCount++;
            return true;
          }
          return false;
        }).length;
        
        const totalNum = s.tugasNum.length;
        const doneNum = s.tugasNum.filter(t => t.score !== null).length;

        s.nilaiNum.forEach(n => {
          if (activeSemester && (n.semester !== activeSemester.jenis || n.year !== activeSemester.tahunAjaran)) return;
          totalNumScore += n.score;
          totalNumCount++;
        });

        return {
          id: s.id,
          name: s.name,
          nis: s.nis || '-',
          litProgress: `${doneLit} / ${totalLit}`,
          numProgress: `${doneNum} / ${totalNum}`
        };
      });
      
    return {
      id: cls.id,
      name: cls.name,
      students
    };
  });

  const avgLit = totalLitCount > 0 ? (totalLitScore / totalLitCount).toFixed(1) : '0.0';
  const avgNum = totalNumCount > 0 ? (totalNumScore / totalNumCount).toFixed(1) : '0.0';

  const metrics = {
    totalStudents,
    avgLit,
    avgNum
  };

  const schoolInfo = {
    name: school.name,
    npsn: school.npsn || '-',
    kecamatan: school.kecamatan || '-',
    address: school.address || '-',
    mentorNames: school.mentors.length > 0 ? school.mentors.map(m => m.name).join(', ') : '-'
  };

  return <DashboardClient schoolInfo={schoolInfo} metrics={metrics} classesData={classesData} />;
}
