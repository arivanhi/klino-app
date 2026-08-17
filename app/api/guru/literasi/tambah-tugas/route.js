import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'GURU') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { classId, title } = await req.json();

    if (!classId || !title) {
      return NextResponse.json({ error: 'Missing classId or title' }, { status: 400 });
    }

    // Get all students in this class
    const students = await prisma.siswa.findMany({
      where: { kelasId: parseInt(classId) }
    });

    if (students.length === 0) {
      return NextResponse.json({ error: 'Tidak ada siswa di kelas ini' }, { status: 400 });
    }

    // Create a PenugasanLiterasi record for each student
    const tasks = students.map(s => ({
      siswaId: s.id,
      title: title,
      date: new Date()
    }));

    await prisma.penugasanLiterasi.createMany({
      data: tasks
    });

    return NextResponse.json({ success: true, message: 'Tugas berhasil ditambahkan' });

  } catch (error) {
    console.error('API /api/guru/literasi/tambah-tugas Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
