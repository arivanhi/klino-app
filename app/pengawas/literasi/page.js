import { PrismaClient } from '@prisma/client';
import LiterasiClient from './LiterasiClient';

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

export default async function PengawasLiterasiPage() {
  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });
  
  let dateFilter = {};
  if (activeSemester) {
    const range = getSemesterDateRange(activeSemester.tahunAjaran, activeSemester.jenis);
    dateFilter = {
      date: {
        gte: range.start,
        lte: range.end
      }
    };
  }

  // Fetch all schools with their students and their lit assignments within the date filter
  const schoolsData = await prisma.sekolah.findMany({
    include: {
      siswa: {
        include: {
          tugasLit: {
            where: dateFilter
          }
        }
      },
      users: { where: { role: 'GURU' } },
      mentors: true
    }
  });

  const processedSchools = schoolsData.map(school => {
    let schoolLitTotal = 0;
    let schoolLitCount = 0;

    school.siswa.forEach(student => {
      student.tugasLit.forEach(t => {
        if (t.score !== null) {
          schoolLitTotal += t.score;
          schoolLitCount++;
        }
      });
    });

    const avgLit = schoolLitCount > 0 ? (schoolLitTotal / schoolLitCount).toFixed(1) : '0';
    let status = 'Perhatian';
    if (parseFloat(avgLit) >= 80) status = 'Aktif';
    else if (parseFloat(avgLit) >= 60) status = 'Berkembang';

    // The raw tasks for export later if needed
    const tasksForExport = [];
    school.siswa.forEach(student => {
      student.tugasLit.forEach(t => {
        if (t.score !== null) {
          tasksForExport.push({
            siswaName: student.name,
            nis: student.nis,
            title: t.title,
            score: t.score,
            date: t.date.toISOString()
          });
        }
      });
    });

    return {
      id: school.id,
      name: school.name,
      totalTasks: schoolLitCount,
      avgScore: avgLit,
      status: status,
      progress: avgLit, // Using avg score as progress %
      tasks: tasksForExport,
      guruNames: school.users.length > 0 ? school.users.map(u => u.name).join(', ') : '-',
      mentorNames: school.mentors.length > 0 ? school.mentors.map(m => m.name).join(', ') : '-'
    };
  });

  return <LiterasiClient schools={processedSchools} />;
}
