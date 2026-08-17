import { PrismaClient } from '@prisma/client';
import RiwayatClient from './RiwayatClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

function getSemesterDateRange(tahunAjaran, jenis) {
  if (!tahunAjaran) return { start: new Date(0), end: new Date() };
  const years = tahunAjaran.split('/');
  if (years.length !== 2) return { start: new Date(0), end: new Date() };

  const startYear = parseInt(years[0]);
  const endYear = parseInt(years[1]);

  if (jenis.toLowerCase() === 'ganjil') {
    return {
      start: new Date(`${startYear}-07-01T00:00:00.000Z`),
      end: new Date(`${startYear}-12-31T23:59:59.999Z`)
    };
  } else {
    return {
      start: new Date(`${endYear}-01-01T00:00:00.000Z`),
      end: new Date(`${endYear}-06-30T23:59:59.999Z`)
    };
  }
}

export default async function RiwayatGuruPage({ searchParams }) {
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
  
  const allSemesters = await prisma.semester.findMany({
    orderBy: [{ tahunAjaran: 'desc' }, { jenis: 'desc' }]
  });

  let selectedSemesterId = searchParams.semesterId ? parseInt(searchParams.semesterId) : null;
  let selectedSemester = null;

  if (selectedSemesterId) {
    selectedSemester = allSemesters.find(s => s.id === selectedSemesterId);
  }
  if (!selectedSemester && allSemesters.length > 0) {
    selectedSemester = allSemesters.find(s => s.isActive) || allSemesters[0];
    selectedSemesterId = selectedSemester.id;
  }

  let dateFilter = {};
  if (selectedSemester) {
    const range = getSemesterDateRange(selectedSemester.tahunAjaran, selectedSemester.jenis);
    dateFilter = {
      date: { gte: range.start, lte: range.end }
    };
  }

  const school = await prisma.sekolah.findUnique({
    where: { id: schoolId },
    include: {
      kelas: {
        include: {
          siswa: {
            include: {
              tugasLit: { where: dateFilter },
              tugasNum: { where: dateFilter }
            }
          }
        }
      }
    }
  });

  if (!school) return <div style={{ padding: '32px' }}>Sekolah tidak ditemukan</div>;

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
        }
      });

      student.tugasNum.forEach(t => {
        if (t.score !== null) {
          studentNumSum += t.score;
          studentNumCount++;
        }
      });

      const avgStudentLit = studentLitCount > 0 ? studentLitSum / studentLitCount : null;
      const avgStudentNum = studentNumCount > 0 ? studentNumSum / studentNumCount : null;

      if (avgStudentLit !== null || avgStudentNum !== null) {
        participantStudents++;
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
      semesterText: selectedSemester ? `Semester ${selectedSemester.jenis}` : '-'
    };
  });

  return <RiwayatClient 
    classes={processedClasses} 
    schoolName={school.name} 
    semesters={allSemesters} 
    selectedSemesterId={selectedSemesterId} 
  />;
}
