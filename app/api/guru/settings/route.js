import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role?.toUpperCase() !== 'GURU') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID missing in session' }, { status: 400 });
    }

    const body = await req.json();
    const { name, username, password } = body;

    if (!name || !username) {
      return NextResponse.json({ error: 'Name and Username are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser && existingUser.id.toString() !== userId.toString()) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    const updateData = {
      name,
      username,
    };

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: 'Data berhasil diperbarui' });
  } catch (error) {
    console.error('Settings Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
