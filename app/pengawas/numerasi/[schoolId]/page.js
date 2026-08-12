import { PrismaClient } from '@prisma/client';
import DetailNumerasiClient from './DetailNumerasiClient';

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

export default async function DetailNumerasiPage({ params }) {
  const resolvedParams = await params;
  const schoolId = parseInt(resolvedParams.schoolId);
  if (!schoolId) return <div style={{ padding: '32px' }}>School ID not provided</div>;

  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });
  
  let dateFilter = {};
  let nilaiSemesterFilter = {};
  let nilaiYearFilter = {};

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
          tugasNum: { 
            where: dateFilter,
            orderBy: { date: 'asc' } 
          },
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

  let totalScore = 0;
  let scoreCount = 0;
  let studentsWithTask = 0;
  let clinicStudentsCount = 0;
  const allTasks = [];

  const classData = {};
  school.kelas.forEach(k => {
    classData[k.id] = { id: k.id, name: k.name, students: [] };
  });

  school.siswa.forEach(student => {
    const studentTasks = student.tugasNum;
    if (studentTasks.length > 0 || student.nilaiNum.length > 0) studentsWithTask++;

    let studentScoreSum = 0;
    let studentScoreCount = 0;

    student.nilaiNum.forEach(n => {
      totalScore += n.score;
      scoreCount++;
      studentScoreSum += n.score;
      studentScoreCount++;
    });

    studentTasks.forEach(t => {
      if (t.score !== null) {
        allTasks.push(t);
      }
    });

    let studentAvg = 0;
    if (studentScoreCount > 0) {
       studentAvg = studentScoreSum / studentScoreCount;
       if (studentAvg < 60) clinicStudentsCount++;
    }

    if (student.kelasId && classData[student.kelasId]) {
      let status = 'Klinik';
      if (studentAvg >= 90) status = 'Unggul';
      else if (studentAvg >= 80) status = 'Aman';
      else if (studentAvg >= 60) status = 'Pantau';

      classData[student.kelasId].students.push({
        id: student.id,
        nis: student.nis,
        name: student.name,
        asesmen1: studentTasks[0]?.score || '-',
        asesmen2: studentTasks[1]?.score || '-',
        asesmen3: studentTasks[2]?.score || '-',
        avgScore: studentScoreCount > 0 ? studentAvg.toFixed(1) : '-',
        status: studentScoreCount > 0 ? status : '-',
        tasks: studentTasks.map(t => ({
          id: t.id,
          title: t.title,
          date: t.date.toISOString(),
          score: t.score,
          fileUrl: t.fileUrl
        }))
      });
    }
  });

  const avgNum = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : 0;
  const totalStudents = school.siswa.length;
  const progressPercent = totalStudents > 0 ? Math.round((studentsWithTask / totalStudents) * 100) : 0;

  // Chart Logic: Group tasks by week to simulate 5 weeks
  allTasks.sort((a, b) => a.date - b.date);
  
  const chartData = [
    { name: 'Mg 1', score: null, count: 0 },
    { name: 'Mg 2', score: null, count: 0 },
    { name: 'Mg 3', score: null, count: 0 },
    { name: 'Mg 4', score: null, count: 0 },
    { name: 'Mg 5', score: null, count: 0 },
  ];

  if (allTasks.length > 0) {
    const minDate = allTasks[0].date.getTime();
    const maxDate = allTasks[allTasks.length - 1].date.getTime();
    const duration = maxDate - minDate;
    
    // If duration is too small, fallback to mapping index to week
    const bucketSize = duration > 0 ? duration / 5 : 7 * 24 * 60 * 60 * 1000; 

    allTasks.forEach(t => {
      const offset = t.date.getTime() - minDate;
      let bucketIdx = duration > 0 ? Math.floor(offset / bucketSize) : 0;
      if (bucketIdx >= 5) bucketIdx = 4;

      if (chartData[bucketIdx].score === null) chartData[bucketIdx].score = 0;
      chartData[bucketIdx].score += t.score;
      chartData[bucketIdx].count++;
    });

    chartData.forEach(d => {
      if (d.count > 0) {
        d.score = parseFloat((d.score / d.count).toFixed(1));
      }
    });
  }

  const metrics = {
    avgScore: avgNum,
    progressPercent: progressPercent,
    studentsWithTask: studentsWithTask,
    totalStudents: totalStudents,
    clinicStudentsCount: clinicStudentsCount
  };

  const classes = Object.values(classData).sort((a, b) => a.name.localeCompare(b.name));

  return <DetailNumerasiClient schoolId={schoolId} schoolName={school.name} metrics={metrics} classes={classes} chartData={chartData} />;
}
