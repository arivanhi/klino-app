import { PrismaClient } from '@prisma/client';
import LaporanClient from './LaporanClient';

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

export default async function LaporanKLiNOPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const semesterIdParam = resolvedParams.semesterId;
  
  // 1. Ambil semua semester untuk opsi dropdown
  const semesters = await prisma.semester.findMany({
    orderBy: [
      { tahunAjaran: 'desc' },
      { jenis: 'desc' }
    ]
  });

  // 2. Tentukan semester yang akan dirender (jika ada param ID, pakai itu, kalau tidak cari yg aktif)
  let selectedSemester = null;
  if (semesterIdParam) {
    selectedSemester = semesters.find(s => s.id.toString() === semesterIdParam);
  }
  if (!selectedSemester) {
    selectedSemester = semesters.find(s => s.isActive) || semesters[0];
  }

  let dateFilter = {};
  let nilaiSemesterFilter = '';
  let nilaiYearFilter = '';

  if (selectedSemester) {
    const range = getSemesterDateRange(selectedSemester.tahunAjaran, selectedSemester.jenis);
    dateFilter = {
      date: { gte: range.start, lte: range.end }
    };
    nilaiSemesterFilter = selectedSemester.jenis;
    nilaiYearFilter = selectedSemester.tahunAjaran;
  }

  // 3. Tarik data sekolah dengan agregat Literasi (tugasLit) dan Numerasi (nilaiNum & tugasNum)
  const schoolsData = await prisma.sekolah.findMany({
    include: {
      siswa: {
        include: {
          tugasLit: { where: dateFilter },
          tugasNum: { where: dateFilter },
          nilaiNum: {
            where: {
              semester: nilaiSemesterFilter,
              year: nilaiYearFilter
            }
          }
        }
      }
    }
  });

  // 4. Proses perhitungan skor per sekolah
  const processedSchools = schoolsData.map(school => {
    let litTotalScore = 0;
    let litCount = 0;
    let numTotalScore = 0;
    let numCount = 0;

    const allTasks = [];

    school.siswa.forEach(student => {
      // Hitung rata-rata Literasi
      student.tugasLit.forEach(t => {
        if (t.score !== null) {
          litTotalScore += t.score;
          litCount++;
          allTasks.push({
            siswaName: student.name,
            nis: student.nis,
            title: t.title,
            type: 'Literasi',
            score: t.score,
            date: t.date.toISOString()
          });
        }
      });

      // Hitung rata-rata Numerasi dari NilaiNumerasi
      student.nilaiNum.forEach(n => {
        numTotalScore += n.score;
        numCount++;
      });
      
      // Ambil riwayat penugasan numerasi untuk Export
      student.tugasNum.forEach(t => {
        allTasks.push({
          siswaName: student.name,
          nis: student.nis,
          title: t.title,
          type: 'Numerasi',
          score: t.score || '-',
          date: t.date.toISOString()
        });
      });
    });

    const avgLit = litCount > 0 ? (litTotalScore / litCount) : 0;
    const avgNum = numCount > 0 ? (numTotalScore / numCount) : 0;
    
    // Rata-rata gabungan untuk menentukan Badge
    const combinedAvg = (avgLit + avgNum) / ( (avgLit > 0 && avgNum > 0) ? 2 : 1 );
    
    let status = 'Perhatian';
    if (combinedAvg >= 80) status = 'Unggul';
    else if (combinedAvg >= 60) status = 'Berkembang';

    return {
      id: school.id,
      name: school.name,
      kecamatan: school.kecamatan || 'Kecamatan Brebes', // Fallback jika kosong
      litScore: Math.round(avgLit),
      numScore: Math.round(avgNum),
      status: status,
      tasks: allTasks
    };
  });

  return (
    <LaporanClient 
      semesters={semesters} 
      selectedSemesterId={selectedSemester ? selectedSemester.id.toString() : ''} 
      schools={processedSchools} 
    />
  );
}
