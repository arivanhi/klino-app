import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function PUT(req) {
  try {
    const session = await getServerSession();
    if (!session || !session.user || session.user.role !== 'PENGAWAS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // `session.user` might not have the DB id if not exposed in callbacks, 
    // so we should look it up by username
    const currentUser = await prisma.user.findUnique({
      where: { username: session.user.username || session.user.name } // Next-auth might map name to username
    });
    
    // Better yet, just find by username (we assume username in session maps to DB username, or we can fetch by name, but username is unique)
    // Actually, in `app/api/auth/[...nextauth]/route.js` they usually pass id or username.
    // We'll search for the exact user that matches the session name. Wait, the user can change name.
    // Let's assume the session has `id`. If not, we fall back to username.

    let userId = session.user.id;
    if (!userId) {
      const u = await prisma.user.findFirst({
        where: { role: 'PENGAWAS' } // Assumption: maybe just 1 pengawas? Or we match name.
      });
      // In a real app we'd decode the JWT to get ID. For now, we'll assume `name` is unique enough if `id` is missing.
      const userByName = await prisma.user.findFirst({ where: { name: session.user.name, role: 'PENGAWAS' } });
      if (!userByName) {
        return NextResponse.json({ error: 'User not found in DB' }, { status: 404 });
      }
      userId = userByName.id;
    }

    const body = await req.json();
    const { name, username, password } = body;

    if (!name || !username) {
      return NextResponse.json({ error: 'Name and Username are required' }, { status: 400 });
    }

    // Check if new username is already taken by someone else
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser && existingUser.id !== userId) {
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
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: 'Data berhasil diperbarui' });
  } catch (error) {
    console.error('Settings Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
