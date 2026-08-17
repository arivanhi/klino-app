import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'GURU') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const taskId = formData.get('taskId');
    const scoreStr = formData.get('score');

    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
    }

    const task = await prisma.penugasanNumerasi.findUnique({
      where: { id: parseInt(taskId) },
      include: {
        siswa: {
          include: {
            kelas: {
              include: {
                sekolah: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    let updateData = {};

    if (scoreStr !== null && scoreStr !== undefined && scoreStr !== '') {
      updateData.score = parseFloat(scoreStr);
    }

    if (file && file !== 'null' && file.size > 0) {
      const sanitize = (name) => name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const schoolName = sanitize(task.siswa.kelas.sekolah.name);
      const className = sanitize(task.siswa.kelas.name);
      const studentName = sanitize(task.siswa.name);
      const originalFilename = file.name;
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), 'storage', 'uploads', schoolName, className, studentName, 'numerasi');
      await mkdir(uploadDir, { recursive: true });

      const filename = `${Date.now()}_${originalFilename}`;
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);

      const fileUrl = `/api/file?path=${schoolName}/${className}/${studentName}/numerasi/${filename}`;
      updateData.fileUrl = fileUrl;
    }

    await prisma.penugasanNumerasi.update({
      where: { id: task.id },
      data: updateData
    });

    return NextResponse.json({ success: true, ...updateData });

  } catch (error) {
    console.error('API /api/guru/numerasi/upload POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'GURU') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
    }

    await prisma.penugasanNumerasi.update({
      where: { id: parseInt(taskId) },
      data: { fileUrl: null, score: null }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API /api/guru/numerasi/upload DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
