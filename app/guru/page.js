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

  let totalLitCollected = 0, totalLitAssigned = 0;
  let totalNumScore = 0, totalNumCount = 0;
  let totalStudents = school.siswa.length;
  
  const classesData = school.kelas.map(cls => {
    const students = school.siswa
      .filter(s => s.kelasId === cls.id)
      .map(s => {
        const totalLit = s.tugasLit.length;
        const doneLit = s.tugasLit.filter(t => {
          if (t.fileUrl) {
            totalLitCollected++;
            return true;
          }
          return false;
        }).length;
        totalLitAssigned += totalLit;
        
        const totalNum = s.tugasNum.length;
        let studentNumScore = 0, studentNumCount = 0;
        const doneNum = s.tugasNum.filter(t => {
          if (t.score !== null) {
            totalNumScore += t.score;
            totalNumCount++;
            studentNumScore += t.score;
            studentNumCount++;
            return true;
          }
          return false;
        }).length;

        const studentAvgNum = studentNumCount > 0 ? (studentNumScore / studentNumCount) : 0;
        const studentLitPercent = totalLit > 0 ? (doneLit / totalLit) * 100 : 0;
        
        const KKM_NUM = 75; // Variabel nilai standar minimal (KKM)
        const KKM_LIT_PERCENT = 75; // Persentase minimal kelengkapan tugas literasi

        let status = "Siswa Aman";
        const isNumUnder = studentNumCount > 0 && studentAvgNum < KKM_NUM;
        const isLitUnder = totalLit > 0 && studentLitPercent < KKM_LIT_PERCENT;

        if (isLitUnder && isNumUnder) {
          status = "Perlu Intervensi";
        } else if (isLitUnder) {
          status = "Perlu Intervensi Literasi";
        } else if (isNumUnder) {
          status = "Perlu Intervensi Numerasi";
        } else if (totalLit === 0 && studentNumCount === 0) {
          status = "Belum Ada Data";
        }

        return {
          id: s.id,
          name: s.name,
          nis: s.nis || '-',
          litProgress: `${doneLit} / ${totalLit}`,
          numAvg: studentNumCount > 0 ? studentAvgNum.toFixed(1) : '-',
          status
        };
      });
      
    return {
      id: cls.id,
      name: cls.name,
      students
    };
  });

  const avgNum = totalNumCount > 0 ? (totalNumScore / totalNumCount).toFixed(1) : '0.0';

  const metrics = {
    totalStudents,
    totalLitCollected,
    totalLitAssigned,
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
