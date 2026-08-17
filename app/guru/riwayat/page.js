import { PrismaClient } from '@prisma/client';
import RiwayatClient from './RiwayatClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function RiwayatGuruPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/');

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) }
  });

  if (!user || !user.sekolahId) {
    return <div style={{ padding: '32px' }}>Anda belum ditugaskan ke sekolah manapun.</div>;
  }
  const schoolId = user.sekolahId;
  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });

  const school = await prisma.sekolah.findUnique({
    where: { id: schoolId },
    include: {
      kelas: {
        include: {
          siswa: {
            include: {
              tugasLit: true,
              nilaiNum: true
            }
          }
        }
      }
    }
  });

  if (!school) return <div style={{ padding: '32px' }}>Sekolah tidak ditemukan</div>;

  let globalLitTotal = 0, globalLitCount = 0;
  let globalNumTotal = 0, globalNumCount = 0;
  let clinicStudentsCount = 0;

  const processedClasses = school.kelas.map(cls => {
    let clsLitTotal = 0, clsLitCount = 0;
    let clsNumTotal = 0, clsNumCount = 0;
    let participantStudents = 0;

    cls.siswa.forEach(student => {
      let studentLitSum = 0, studentLitCount = 0;
      let studentNumSum = 0, studentNumCount = 0;

      student.tugasLit.forEach(t => {
        if (t.score !== null) {
          studentLitSum += t.score;
          studentLitCount++;
          globalLitTotal += t.score;
          globalLitCount++;
        }
      });

      student.nilaiNum.forEach(n => {
        if (activeSemester && (n.semester !== activeSemester.jenis || n.year !== activeSemester.tahunAjaran)) return;
        studentNumSum += n.score;
        studentNumCount++;
        globalNumTotal += n.score;
        globalNumCount++;
      });

      const avgStudentLit = studentLitCount > 0 ? studentLitSum / studentLitCount : null;
      const avgStudentNum = studentNumCount > 0 ? studentNumSum / studentNumCount : null;

      if (avgStudentLit !== null || avgStudentNum !== null) {
        participantStudents++;
      }

      if ((avgStudentLit !== null && avgStudentLit < 60) || (avgStudentNum !== null && avgStudentNum < 60)) {
        clinicStudentsCount++;
      }

      clsLitTotal += studentLitSum;
      clsLitCount += studentLitCount;
      clsNumTotal += studentNumSum;
      clsNumCount += studentNumCount;
    });

    const avgLit = clsLitCount > 0 ? (clsLitTotal / clsLitCount).toFixed(1) : '0.0';
    const avgNum = clsNumCount > 0 ? (clsNumTotal / clsNumCount).toFixed(1) : '0.0';

    return {
      id: cls.id,
      name: cls.name,
      participantStudents,
      totalStudents: cls.siswa.length,
      avgLit,
      avgNum,
      status: (parseFloat(avgLit) < 60 || parseFloat(avgNum) < 60) ? 'Perhatian' : 'Aman'
    };
  });

  const avgGlobalLit = globalLitCount > 0 ? (globalLitTotal / globalLitCount).toFixed(1) : '0.0';
  const avgGlobalNum = globalNumCount > 0 ? (globalNumTotal / globalNumCount).toFixed(1) : '0.0';

  const globalStats = {
    totalClasses: school.kelas.length,
    avgLit: avgGlobalLit,
    avgNum: avgGlobalNum,
    clinicStudents: clinicStudentsCount,
    schoolName: school.name
  };

  return <RiwayatClient classes={processedClasses} globalStats={globalStats} />;
}
