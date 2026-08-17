import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import DetailKelasClient from './DetailKelasClient';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function LiterasiDetailKelas({ params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'GURU') redirect('/');

  const resolvedParams = await params;
  const kelasId = parseInt(resolvedParams.kelasId);

  const kelas = await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: {
      siswa: {
        include: {
          tugasLit: { orderBy: { date: 'asc' } }
        }
      }
    }
  });

  if (!kelas) {
    return <div style={{ padding: '32px' }}>Kelas tidak ditemukan.</div>;
  }

  // Calculate metrics
  let totalTasksCompleted = 0;
  let totalTasksAssigned = 0;
  let totalScore = 0;
  let scoreCount = 0;

  // Track tasks by topic (title) over time to build the chart data
  // We'll count completed tasks per month or per specific assignments
  // The UI mockup shows "M1", "M2", "M3", "M4", "M5"
  // For simplicity, let's group by assignment index or month.
  const chartData = {}; 

  const students = kelas.siswa.map(student => {
    const totalStudentTasks = student.tugasLit.length;
    const completedStudentTasks = student.tugasLit.filter(t => t.score !== null || t.fileUrl !== null).length;
    
    totalTasksAssigned += totalStudentTasks;
    totalTasksCompleted += completedStudentTasks;

    student.tugasLit.forEach(t => {
      if (t.score !== null || t.fileUrl !== null) {
        if (t.score !== null) {
          totalScore += t.score;
        }
        scoreCount++;

        const monthKey = `M${new Date(t.date).getMonth() + 1}`;
        if (!chartData[monthKey]) chartData[monthKey] = 0;
        chartData[monthKey]++;
      }
    });

    return {
      id: student.id,
      nis: student.nis || '-',
      name: student.name,
      tasksAssigned: totalStudentTasks,
      tasksCompleted: completedStudentTasks,
      tasks: student.tugasLit.map(t => ({
        id: t.id,
        title: t.title,
        date: t.date.toISOString(),
        score: t.score,
        fileUrl: t.fileUrl
      }))
    };
  });

  // Calculate averages
  // We'll use "completion rate" for the first card "Rata-Rata Penyelesaian"
  const completionRate = totalTasksAssigned > 0 ? Math.round((totalTasksCompleted / totalTasksAssigned) * 100) : 0;
  
  // Format chart data for UI
  const trenLiterasi = Object.keys(chartData).map(key => ({
    label: key,
    value: chartData[key]
  })).slice(-5); // Last 5

  const metrics = {
    completionRate,
    totalTasksCompleted,
    totalTasksAssigned,
    trenLiterasi
  };

  return <DetailKelasClient kelasId={kelasId} kelasName={kelas.name} students={students} metrics={metrics} />;
}
