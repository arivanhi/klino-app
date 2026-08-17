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

    if (!file || !taskId) {
      return NextResponse.json({ error: 'Missing file or taskId' }, { status: 400 });
    }

    const task = await prisma.penugasanLiterasi.findUnique({
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

    // Sanitize names for folder paths
    const sanitize = (name) => name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    const schoolName = sanitize(task.siswa.kelas.sekolah.name);
    const className = sanitize(task.siswa.kelas.name);
    const studentName = sanitize(task.siswa.name);
    const originalFilename = file.name;
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // /klino-app/storage/uploads/sekolah/kelas/nama
    // In Docker, process.cwd() is /app, so process.cwd()/storage...
    const uploadDir = path.join(process.cwd(), 'storage', 'uploads', schoolName, className, studentName);
    
    // Create directory if not exists
    await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}_${originalFilename}`;
    const filePath = path.join(uploadDir, filename);

    // Save the file
    await writeFile(filePath, buffer);

    // Generate a URL path that our custom API can serve
    const fileUrl = `/api/file?path=${schoolName}/${className}/${studentName}/${filename}`;

    // Update the task record
    // We also set score to 100 for now, or just leave it null? 
    // The user said "untuk literasi tidak perlu nilai sementara". 
    // BUT wait! "Pengerjaan Literasi" progress bar uses `score !== null` to consider a task "Done"!! 
    // Let's set score to 0 or something so it counts as done?
    // Actually, earlier we did: `doneTasks += studentTasks.filter(t => t.score !== null).length;`
    // If we don't set a score, the progress won't increase when a file is uploaded!
    // Let's change the condition for "doneTasks" in page.js later, or just set score to 0. 
    // Wait, setting score to 0 is bad if they eventually want scores. Let's set it to 0 as a placeholder, or update page.js to consider `fileUrl !== null || score !== null`.
    // I will update page.js logic to check `fileUrl !== null`.
    
    await prisma.penugasanLiterasi.update({
      where: { id: task.id },
      data: { fileUrl: fileUrl }
    });

    return NextResponse.json({ success: true, fileUrl });

  } catch (error) {
    console.error('API /api/guru/literasi/upload POST Error:', error);
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

    await prisma.penugasanLiterasi.update({
      where: { id: parseInt(taskId) },
      data: { fileUrl: null }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API /api/guru/literasi/upload DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
