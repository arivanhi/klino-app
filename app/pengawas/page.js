import { PrismaClient } from '@prisma/client';
import DashboardClient from './DashboardClient';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function PengawasDashboard() {
  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });
  
  // Fetch schools with students and scores
  const schoolsData = await prisma.sekolah.findMany({
    include: {
      siswa: {
        include: {
          tugasLit: true,
          nilaiNum: true
        }
      },
      users: {
        where: { role: 'GURU' }
      },
      mentors: true
    }
  });

  let globalLitTotal = 0, globalLitCount = 0;
  let globalNumTotal = 0, globalNumCount = 0;
  let clinicStudentsCount = 0;

  const processedSchools = schoolsData.map(school => {
    let schoolLitTotal = 0, schoolLitCount = 0;
    let schoolNumTotal = 0, schoolNumCount = 0;
    let participantStudents = 0;

    school.siswa.forEach(student => {
      let studentLitSum = 0, studentLitCount = 0;
      let studentNumSum = 0, studentNumCount = 0;

      // Literacy: taking all available assignments as requested
      student.tugasLit.forEach(t => {
        if (t.score !== null) {
          studentLitSum += t.score;
          studentLitCount++;
          globalLitTotal += t.score;
          globalLitCount++;
        }
      });

      // Numeracy: filter by active semester if available
      student.nilaiNum.forEach(n => {
        if (activeSemester && (n.semester !== activeSemester.jenis || n.year !== activeSemester.tahunAjaran)) {
          return; // Skip if not active semester
        }
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

      schoolLitTotal += studentLitSum;
      schoolLitCount += studentLitCount;
      schoolNumTotal += studentNumSum;
      schoolNumCount += studentNumCount;
    });

    const avgLit = schoolLitCount > 0 ? (schoolLitTotal / schoolLitCount).toFixed(1) : '0.0';
    const avgNum = schoolNumCount > 0 ? (schoolNumTotal / schoolNumCount).toFixed(1) : '0.0';

    return {
      id: school.id,
      name: school.name,
      participantStudents,
      avgLit,
      avgNum,
      status: (parseFloat(avgLit) < 60 || parseFloat(avgNum) < 60) ? 'Perhatian' : 'Stabil',
      guruCount: school.users.length,
      mentorCount: school.mentors.length
    };
  });

  const avgGlobalLit = globalLitCount > 0 ? (globalLitTotal / globalLitCount).toFixed(1) : '0.0';
  const avgGlobalNum = globalNumCount > 0 ? (globalNumTotal / globalNumCount).toFixed(1) : '0.0';

  const globalStats = {
    totalSchools: schoolsData.length,
    avgLit: avgGlobalLit,
    avgNum: avgGlobalNum,
    clinicStudents: clinicStudentsCount
  };

  return <DashboardClient schools={processedSchools} globalStats={globalStats} />;
}
