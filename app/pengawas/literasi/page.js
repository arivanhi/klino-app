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
    let schoolLitCollected = 0;
    let schoolLitAssigned = 0;

    school.siswa.forEach(student => {
      schoolLitAssigned += student.tugasLit.length;
      student.tugasLit.forEach(t => {
        if (t.fileUrl) {
          schoolLitCollected++;
        }
      });
    });

    const litPercent = schoolLitAssigned > 0 ? (schoolLitCollected / schoolLitAssigned) * 100 : 0;
    let status = 'Perhatian';
    if (litPercent >= school.kkmLit) status = 'Aktif';
    else if (litPercent >= (school.kkmLit - 15)) status = 'Berkembang';

    // The raw tasks for export later if needed
    const tasksForExport = [];
    school.siswa.forEach(student => {
      student.tugasLit.forEach(t => {
        if (t.fileUrl) {
          tasksForExport.push({
            siswaName: student.name,
            nis: student.nis,
            title: t.title,
            score: t.score !== null ? t.score : 'Terkumpul',
            date: t.date.toISOString()
          });
        }
      });
    });

    return {
      id: school.id,
      name: school.name,
      totalTasks: schoolLitAssigned, // Changed to show total tasks assigned
      avgScore: schoolLitAssigned > 0 ? litPercent.toFixed(1) : '0', // Using percent here
      status: status,
      progress: litPercent.toFixed(1), // Using percent as progress %
      tasks: tasksForExport,
      guruNames: school.users.length > 0 ? school.users.map(u => u.name).join(', ') : '-',
      mentorNames: school.mentors.length > 0 ? school.mentors.map(m => m.name).join(', ') : '-'
    };
  });

  return <LiterasiClient schools={processedSchools} />;
}
