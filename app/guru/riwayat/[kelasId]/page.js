import { PrismaClient } from '@prisma/client';
import DetailRiwayatClient from './DetailRiwayatClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function DetailRiwayatGuruPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/');

  const resolvedParams = await params;
  const kelasId = parseInt(resolvedParams.kelasId);
  if (isNaN(kelasId)) return <div>ID Kelas Tidak Valid</div>;

  const kelas = await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: {
      sekolah: true,
      siswa: {
        include: {
          tugasLit: true,
          nilaiNum: true
        }
      }
    }
  });

  if (!kelas) return <div style={{ padding: '32px' }}>Kelas tidak ditemukan</div>;

  // Check if Guru belongs to this school
  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) }
  });
  if (!user || user.sekolahId !== kelas.sekolahId) {
    return <div style={{ padding: '32px' }}>Akses ditolak.</div>;
  }

  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });

  const students = kelas.siswa.map(student => {
    let litSum = 0, litCount = 0;
    let numSum = 0, numCount = 0;

    student.tugasLit.forEach(t => {
      if (t.score !== null) {
        litSum += t.score;
        litCount++;
      }
    });

    student.nilaiNum.forEach(n => {
      if (activeSemester && (n.semester !== activeSemester.jenis || n.year !== activeSemester.tahunAjaran)) return;
      numSum += n.score;
      numCount++;
    });

    const avgLit = litCount > 0 ? litSum / litCount : null;
    const avgNum = numCount > 0 ? numSum / numCount : null;

    let status = 'Stabil';
    if ((avgLit !== null && avgLit < 60) || (avgNum !== null && avgNum < 60)) {
      status = 'Klinik';
    } else if (avgLit === null && avgNum === null) {
      status = 'Belum Ada Data';
    }

    return {
      id: student.id,
      name: student.name,
      nis: student.nis || '-',
      litTaskCount: litCount,
      numTaskCount: numCount, // Using Nilai Numerasi as tasks/assessments
      avgLit: avgLit !== null ? avgLit.toFixed(1) : '-',
      avgNum: avgNum !== null ? avgNum.toFixed(1) : '-',
      status,
      litTasks: student.tugasLit.map(t => ({
        id: t.id, title: t.title, score: t.score, date: t.date.toISOString(), fileUrl: t.fileUrl
      })),
      numTasks: student.nilaiNum.map(n => ({
        id: n.id, title: `Asesmen ${n.semester} ${n.year}`, score: n.score, date: n.createdAt.toISOString(), fileUrl: null
      }))
    };
  });

  return <DetailRiwayatClient kelasName={kelas.name} schoolName={kelas.sekolah.name} students={students} />;
}
