import { PrismaClient } from '@prisma/client';
import DetailClient from './DetailClient';

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

export default async function DetailLiterasiPage({ params }) {
  const resolvedParams = await params;
  const schoolId = parseInt(resolvedParams.schoolId);
  if (!schoolId) return <div style={{ padding: '32px' }}>School ID not provided</div>;

  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });
  let dateFilter = {};
  if (activeSemester) {
    const range = getSemesterDateRange(activeSemester.tahunAjaran, activeSemester.jenis);
    dateFilter = {
      date: { gte: range.start, lte: range.end }
    };
  }

  const school = await prisma.sekolah.findUnique({
    where: { id: schoolId },
    include: {
      kelas: true,
      users: { where: { role: 'GURU' } },
      mentors: true,
      siswa: {
        include: {
          tugasLit: { where: dateFilter },
          kelas: true
        }
      }
    }
  });

  if (!school) return <div style={{ padding: '32px' }}>Sekolah tidak ditemukan</div>;

  let totalTasks = 0;
  let totalScore = 0;
  let scoreCount = 0;
  let activeStudents = 0;

  const classData = {};
  school.kelas.forEach(k => {
    classData[k.id] = { id: k.id, name: k.name, students: [], totalScore: 0, scoreCount: 0 };
  });

  school.siswa.forEach(student => {
    const studentTasks = student.tugasLit;
    if (studentTasks.length > 0) activeStudents++;

    let studentScoreSum = 0;
    let studentScoreCount = 0;

    studentTasks.forEach(t => {
      totalTasks++;
      if (t.score !== null) {
        totalScore += t.score;
        scoreCount++;
        studentScoreSum += t.score;
        studentScoreCount++;
      }
    });

    if (student.kelasId && classData[student.kelasId]) {
      classData[student.kelasId].students.push({
        id: student.id,
        nis: student.nis,
        name: student.name,
        taskCount: studentTasks.length,
        tasks: studentTasks.map(t => ({
          id: t.id,
          title: t.title,
          date: t.date.toISOString(),
          score: t.score,
          fileUrl: t.fileUrl
        }))
      });
      classData[student.kelasId].totalScore += studentScoreSum;
      classData[student.kelasId].scoreCount += studentScoreCount;
    }
  });

  const avgLit = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : 0;
  
  // Find class that needs clinic (average score < 60)
  let classNeedingClinic = "-";
  let lowestScore = 100;
  Object.values(classData).forEach(cls => {
    if (cls.scoreCount > 0) {
      const avg = cls.totalScore / cls.scoreCount;
      if (avg < 60 && avg < lowestScore) {
        lowestScore = avg;
        classNeedingClinic = cls.name;
      }
    }
  });

  const metrics = {
    avgScore: avgLit,
    totalTasks: totalTasks,
    activeStudents: activeStudents,
    classNeedingClinic: classNeedingClinic,
    totalStudents: school.siswa.length
  };

  const classes = Object.values(classData).sort((a, b) => a.name.localeCompare(b.name));

  const schoolInfo = {
    npsn: school.npsn || '-',
    kecamatan: school.kecamatan || '-',
    address: school.address || '-',
    guruNames: school.users.length > 0 ? school.users.map(u => u.name).join(', ') : '-',
    mentorNames: school.mentors.length > 0 ? school.mentors.map(m => m.name).join(', ') : '-'
  };

  return <DetailClient schoolId={schoolId} schoolName={school.name} schoolInfo={schoolInfo} metrics={metrics} classes={classes} />;
}
