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

    const { kelasId, title } = await req.json();

    if (!kelasId || !title) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const siswaList = await prisma.siswa.findMany({
      where: { kelasId: parseInt(kelasId) }
    });

    if (siswaList.length === 0) {
      return NextResponse.json({ error: 'Tidak ada siswa di kelas ini' }, { status: 404 });
    }

    const tasksData = siswaList.map(siswa => ({
      siswaId: siswa.id,
      title: title,
      date: new Date()
    }));

    await prisma.penugasanNumerasi.createMany({
      data: tasksData
    });

    return NextResponse.json({ success: true, message: 'Topik tugas numerasi berhasil ditambahkan.' });
  } catch (error) {
    console.error('API /api/guru/numerasi/tambah-tugas Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
