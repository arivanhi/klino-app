import { PrismaClient } from '@prisma/client';
import DetailLaporanClient from './DetailLaporanClient';

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

export default async function DetailLaporanPage({ params }) {
  const resolvedParams = await params;
  const schoolId = parseInt(resolvedParams.schoolId);
  if (!schoolId) return <div style={{ padding: '32px' }}>School ID not provided</div>;

  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });
  
  let dateFilter = {};
  let nilaiSemesterFilter = '';
  let nilaiYearFilter = '';

  if (activeSemester) {
    const range = getSemesterDateRange(activeSemester.tahunAjaran, activeSemester.jenis);
    dateFilter = {
      date: { gte: range.start, lte: range.end }
    };
    nilaiSemesterFilter = activeSemester.jenis;
    nilaiYearFilter = activeSemester.tahunAjaran;
  }

  const school = await prisma.sekolah.findUnique({
    where: { id: schoolId },
    include: {
      kelas: true,
      siswa: {
        include: {
          tugasLit: { where: dateFilter, orderBy: { date: 'asc' } },
          tugasNum: { where: dateFilter, orderBy: { date: 'asc' } },
          nilaiNum: {
            where: {
              semester: nilaiSemesterFilter,
              year: nilaiYearFilter
            }
          },
          kelas: true
        }
      }
    }
  });

  if (!school) return <div style={{ padding: '32px' }}>Sekolah tidak ditemukan</div>;

  const classData = {};
  school.kelas.forEach(k => {
    classData[k.id] = { id: k.id, name: k.name, students: [] };
  });

  let totalLitScore = 0;
  let countLitScore = 0;
  
  let totalNumScore = 0;
  let countNumScore = 0;

  school.siswa.forEach(student => {
    let studentLitSum = 0;
    let studentLitCount = 0;
    
    let studentNumSum = 0;
    let studentNumCount = 0;

    student.tugasLit.forEach(t => {
      if (t.score !== null) {
        totalLitScore += t.score;
        countLitScore++;
        studentLitSum += t.score;
        studentLitCount++;
      }
    });

    student.nilaiNum.forEach(n => {
      totalNumScore += n.score;
      countNumScore++;
      studentNumSum += n.score;
      studentNumCount++;
    });

    if (student.kelasId && classData[student.kelasId]) {
      const litAvg = studentLitCount > 0 ? (studentLitSum / studentLitCount).toFixed(1) : '-';
      const numAvg = studentNumCount > 0 ? (studentNumSum / studentNumCount).toFixed(1) : '-';

      classData[student.kelasId].students.push({
        id: student.id,
        nis: student.nis,
        name: student.name,
        lit1: student.tugasLit[0]?.score || '-',
        lit2: student.tugasLit[1]?.score || '-',
        lit3: student.tugasLit[2]?.score || '-',
        litAvg: litAvg,
        num1: student.tugasNum[0]?.score || '-',
        num2: student.tugasNum[1]?.score || '-',
        num3: student.tugasNum[2]?.score || '-',
        numAvg: numAvg,
        tasksLit: student.tugasLit.map(t => ({
          id: t.id,
          title: t.title,
          date: t.date.toISOString(),
          score: t.score,
          fileUrl: t.fileUrl,
          type: 'Literasi'
        })),
        tasksNum: student.tugasNum.map(t => ({
          id: t.id,
          title: t.title,
          date: t.date.toISOString(),
          score: t.score,
          fileUrl: t.fileUrl,
          type: 'Numerasi'
        }))
      });
    }
  });

  const avgLitOverall = countLitScore > 0 ? Math.round(totalLitScore / countLitScore) : 0;
  const avgNumOverall = countNumScore > 0 ? Math.round(totalNumScore / countNumScore) : 0;

  const metrics = {
    avgLit: avgLitOverall,
    avgNum: avgNumOverall
  };

  const classes = Object.values(classData).sort((a, b) => a.name.localeCompare(b.name));

  return <DetailLaporanClient schoolId={schoolId} schoolName={school.name} metrics={metrics} classes={classes} />;
}
