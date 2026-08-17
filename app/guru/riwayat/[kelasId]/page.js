import { PrismaClient } from '@prisma/client';
import DetailRiwayatClient from './DetailRiwayatClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
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

export default async function DetailRiwayatGuruPage({ params, searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/');

  const resolvedParams = await params;
  const kelasId = parseInt(resolvedParams.kelasId);
  if (isNaN(kelasId)) return <div>ID Kelas Tidak Valid</div>;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) }
  });

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

  const kelas = await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: {
      sekolah: true,
      siswa: {
        include: {
          tugasLit: { where: dateFilter, orderBy: { date: 'asc' } },
          tugasNum: { where: dateFilter, orderBy: { date: 'asc' } }
        }
      }
    }
  });

  if (!kelas) return <div style={{ padding: '32px' }}>Kelas tidak ditemukan</div>;

  if (!user || user.sekolahId !== kelas.sekolahId) {
    return <div style={{ padding: '32px' }}>Akses ditolak.</div>;
  }

  // Extract all unique task titles for Literasi and Numerasi across the class
  const litTaskTitles = [];
  const numTaskTitles = [];

  kelas.siswa.forEach(s => {
    s.tugasLit.forEach(t => {
      if (!litTaskTitles.includes(t.title)) litTaskTitles.push(t.title);
    });
    s.tugasNum.forEach(t => {
      if (!numTaskTitles.includes(t.title)) numTaskTitles.push(t.title);
    });
  });

  const maxLitTasks = litTaskTitles.length;
  const maxNumTasks = numTaskTitles.length;

  const students = kelas.siswa.map(student => {
    let litSum = 0, litCount = 0;
    let numSum = 0, numCount = 0;

    student.tugasLit.forEach(t => {
      if (t.fileUrl) {
        litSum += t.score || 0;
        litCount++;
      }
    });

    student.tugasNum.forEach(t => {
      if (t.score !== null) {
        numSum += t.score;
        numCount++;
      }
    });

    const avgLit = litCount > 0 ? litSum / litCount : null;
    const avgNum = numCount > 0 ? numSum / numCount : null;

    return {
      id: student.id,
      name: student.name,
      nis: student.nis || '-',
      litTaskCount: litCount,
      numTaskCount: numCount,
      avgLit: avgLit !== null ? avgLit.toFixed(1) : '-',
      avgNum: avgNum !== null ? avgNum.toFixed(1) : '-',
      litTasks: student.tugasLit.map(t => ({
        id: t.id, title: t.title, score: t.score, date: t.date.toISOString(), fileUrl: t.fileUrl
      })),
      numTasks: student.tugasNum.map(t => ({
        id: t.id, title: t.title, score: t.score, date: t.date.toISOString(), fileUrl: t.fileUrl
      }))
    };
  });

  return <DetailRiwayatClient 
    kelasName={kelas.name} 
    schoolName={kelas.sekolah.name} 
    students={students} 
    semester={selectedSemester} 
    maxLitTasks={maxLitTasks}
    maxNumTasks={maxNumTasks}
    litTaskTitles={litTaskTitles}
    numTaskTitles={numTaskTitles}
  />;
}
