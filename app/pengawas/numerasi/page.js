import { PrismaClient } from '@prisma/client';
import NumerasiClient from './NumerasiClient';

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

export default async function PengawasNumerasiPage() {
  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });
  
  let dateFilter = {};
  let nilaiSemesterFilter = {};
  let nilaiYearFilter = {};

  if (activeSemester) {
    const range = getSemesterDateRange(activeSemester.tahunAjaran, activeSemester.jenis);
    dateFilter = {
      date: {
        gte: range.start,
        lte: range.end
      }
    };
    nilaiSemesterFilter = activeSemester.jenis;
    nilaiYearFilter = activeSemester.tahunAjaran;
  }

  // Fetch all schools with their students, their numerasi assignments, and their numerasi scores
  const schoolsData = await prisma.sekolah.findMany({
    include: {
      siswa: {
        include: {
          tugasNum: {
            where: dateFilter
          },
          nilaiNum: {
            where: {
              semester: nilaiSemesterFilter,
              year: nilaiYearFilter
            }
          }
        }
      },
      users: { where: { role: 'GURU' } },
      mentors: true
    }
  });

  const processedSchools = schoolsData.map(school => {
    let schoolNumTotalScore = 0;
    let schoolNumScoreCount = 0;
    let totalTasksAssigned = 0;

    school.siswa.forEach(student => {
      // Calculate total tasks assigned
      totalTasksAssigned += student.tugasNum.length;

      // Calculate average score using tugasNum
      student.tugasNum.forEach(t => {
        if (t.score !== null) {
          schoolNumTotalScore += t.score;
          schoolNumScoreCount++;
        }
      });
    });

    const avgNum = schoolNumScoreCount > 0 ? (schoolNumTotalScore / schoolNumScoreCount).toFixed(1) : '0';
    let status = 'KRITIS';
    if (parseFloat(avgNum) >= school.kkmNum) status = 'AKTIF STABIL';
    else if (parseFloat(avgNum) >= (school.kkmNum - 15)) status = 'PERLU PERHATIAN';

    // The raw tasks for export later if needed
    const tasksForExport = [];
    school.siswa.forEach(student => {
      student.tugasNum.forEach(t => {
        tasksForExport.push({
          siswaName: student.name,
          nis: student.nis,
          title: t.title,
          score: t.score !== null ? t.score : 'Belum Dinilai',
          date: t.date.toISOString()
        });
      });
    });

    return {
      id: school.id,
      name: school.name,
      totalTasks: totalTasksAssigned,
      avgScore: avgNum,
      status: status,
      progress: avgNum, // Using avg score as progress %
      tasks: tasksForExport,
      guruNames: school.users.length > 0 ? school.users.map(u => u.name).join(', ') : '-',
      mentorNames: school.mentors.length > 0 ? school.mentors.map(m => m.name).join(', ') : '-'
    };
  });

  return <NumerasiClient schools={processedSchools} />;
}
