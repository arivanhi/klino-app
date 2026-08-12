'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

// ==========================================
// SEMESTER ACTIONS
// ==========================================
export async function getSemesters(sort = 'createdAt', dir = 'desc') {
  return prisma.semester.findMany({ orderBy: { [sort]: dir } });
}

export async function createSemester(data) {
  try {
    const sem = await prisma.semester.create({ data });
    revalidatePath('/admin/master');
    return { success: true, semester: sem };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateSemester(id, data) {
  try {
    const sem = await prisma.semester.update({ where: { id }, data });
    revalidatePath('/admin/master');
    return { success: true, semester: sem };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function setActiveSemester(id) {
  try {
    // Set all to false first
    await prisma.semester.updateMany({ data: { isActive: false } });
    // Set target to true
    const sem = await prisma.semester.update({
      where: { id },
      data: { isActive: true }
    });
    revalidatePath('/admin/master');
    return { success: true, semester: sem };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// SEKOLAH ACTIONS
// ==========================================
export async function getSchools(page = 1, limit = 10, search = '', sort = 'name', dir = 'asc') {
  const skip = (page - 1) * limit;
  const where = search ? {
    OR: [
      { name: { contains: search } },
      { npsn: { contains: search } },
      { kecamatan: { contains: search } }
    ]
  } : {};

  // For sorting by nested/count, we might need manual mapping if it's complex, but basic fields work natively
  let orderBy = {};
  if (sort === 'users') {
    orderBy = { users: { _count: dir } };
  } else if (sort !== 'mentor') {
    orderBy = { [sort]: dir };
  }

  const [schools, total] = await Promise.all([
    prisma.sekolah.findMany({
      where,
      skip,
      take: limit,
      include: { 
        _count: { select: { users: { where: { role: 'GURU' } } } },
        mentors: true
      },
      orderBy
    }),
    prisma.sekolah.count({ where })
  ]);

  return { schools, total, totalPages: Math.ceil(total / limit) };
}

export async function createSchool(data) {
  try {
    const school = await prisma.sekolah.create({ data });
    revalidatePath('/admin/master');
    return { success: true, school };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateSchool(id, data) {
  try {
    const school = await prisma.sekolah.update({ where: { id }, data });
    revalidatePath('/admin/master');
    return { success: true, school };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteSchool(id) {
  try {
    await prisma.sekolah.delete({ where: { id } });
    revalidatePath('/admin/master');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function bulkImportSchools(dataArray) {
  try {
    await prisma.sekolah.createMany({
      data: dataArray,
      skipDuplicates: true
    });
    revalidatePath('/admin/master');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function assignMentor(sekolahId, mentorId) {
  try {
    await prisma.sekolah.update({
      where: { id: sekolahId },
      data: { mentorId }
    });
    revalidatePath('/admin/master');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// GURU & SUPERVISOR (USER) ACTIONS
// ==========================================
export async function getUsers(role, page = 1, limit = 10, search = '', sort = 'name', dir = 'asc') {
  const skip = (page - 1) * limit;
  const where = {
    role,
    ...(search && {
      OR: [
        { name: { contains: search } },
        { username: { contains: search } }
      ]
    })
  };

  let orderBy = {};
  if (sort === 'sekolah') {
    orderBy = { sekolah: { name: dir } };
  } else {
    orderBy = { [sort]: dir };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: { sekolah: true },
      orderBy
    }),
    prisma.user.count({ where })
  ]);

  return { users, total, totalPages: Math.ceil(total / limit) };
}

export async function createTeacher(data) {
  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('klino123', 10);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        name: data.name,
        role: 'GURU',
        sekolahId: data.sekolahId,
        password: hashedPassword
      }
    });
    revalidatePath('/admin/master');
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateTeacher(id, data) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        username: data.username,
        name: data.name,
        sekolahId: data.sekolahId
      }
    });
    revalidatePath('/admin/master');
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteTeacher(id) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath('/admin/master');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function resetTeacherPassword(id) {
  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('klino123', 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function bulkImportTeachers(dataArray) {
  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('klino123', 10);
    
    // We need to look up schools by name
    const schools = await prisma.sekolah.findMany();
    const schoolMap = {};
    schools.forEach(s => { schoolMap[s.name.toLowerCase()] = s.id; });
    
    // Map with hashed password and look up sekolahId
    const mapped = dataArray.map(d => {
      const sekolahName = (d.sekolahName || '').toLowerCase();
      const sekolahId = schoolMap[sekolahName] || null;
      
      return {
        username: d.username,
        name: d.name,
        role: 'GURU',
        password: hashedPassword,
        sekolahId
      };
    });
    
    await prisma.user.createMany({
      data: mapped,
      skipDuplicates: true
    });
    revalidatePath('/admin/master');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==========================================
// SISWA ACTIONS
// ==========================================
export async function getStudents(sekolahId = null, page = 1, limit = 10, search = '', sort = 'name', dir = 'asc') {
  const skip = (page - 1) * limit;
  const where = {
    ...(sekolahId && { sekolahId }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { nis: { contains: search } }
      ]
    })
  };

  let orderBy = {};
  if (sort === 'kelas') {
    orderBy = { kelas: { name: dir } };
  } else if (sort === 'sekolah') {
    orderBy = { sekolah: { name: dir } };
  } else {
    orderBy = { [sort]: dir };
  }

  const [students, total] = await Promise.all([
    prisma.siswa.findMany({
      where,
      skip,
      take: limit,
      include: { kelas: true, sekolah: true },
      orderBy
    }),
    prisma.siswa.count({ where })
  ]);

  return { students, total, totalPages: Math.ceil(total / limit) };
}

export async function createStudent(data) {
  try {
    // Find or create Kelas
    let kelas = await prisma.kelas.findFirst({
      where: { name: data.kelasName, sekolahId: data.sekolahId }
    });
    if (!kelas) {
      kelas = await prisma.kelas.create({
        data: { name: data.kelasName, sekolahId: data.sekolahId }
      });
    }

    const student = await prisma.siswa.create({
      data: {
        nis: data.nis,
        name: data.name,
        kelasId: kelas.id,
        sekolahId: data.sekolahId
      }
    });
    revalidatePath('/admin/master');
    return { success: true, student };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateStudent(id, data) {
  try {
    // Find or create Kelas
    let kelas = await prisma.kelas.findFirst({
      where: { name: data.kelasName, sekolahId: data.sekolahId }
    });
    if (!kelas) {
      kelas = await prisma.kelas.create({
        data: { name: data.kelasName, sekolahId: data.sekolahId }
      });
    }

    const student = await prisma.siswa.update({
      where: { id },
      data: {
        nis: data.nis,
        name: data.name,
        kelasId: kelas.id,
        sekolahId: data.sekolahId
      }
    });
    revalidatePath('/admin/master');
    return { success: true, student };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function bulkImportStudents(dataArray) {
  try {
    // Lookup schools by name
    const schools = await prisma.sekolah.findMany();
    const schoolMap = {};
    schools.forEach(s => { schoolMap[s.name.toLowerCase()] = s.id; });

    for (const item of dataArray) {
      const sekolahName = (item.sekolahName || '').toLowerCase();
      // If the row specifies a school name and it matches, use it. Otherwise use the fallback from the UI.
      const resolvedSekolahId = schoolMap[sekolahName] || item.sekolahIdFallback;

      if (!resolvedSekolahId) continue; // Skip if we really don't know the school

      // Find or create Kelas
      let kelas = await prisma.kelas.findFirst({
        where: { name: item.kelasName, sekolahId: resolvedSekolahId }
      });
      if (!kelas) {
        kelas = await prisma.kelas.create({
          data: { name: item.kelasName, sekolahId: resolvedSekolahId }
        });
      }

      await prisma.siswa.upsert({
        where: { nis: item.nis },
        update: { name: item.name, kelasId: kelas.id, sekolahId: resolvedSekolahId },
        create: { nis: item.nis, name: item.name, kelasId: kelas.id, sekolahId: resolvedSekolahId }
      });
    }
    revalidatePath('/admin/master');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteStudent(id) {
  try {
    await prisma.siswa.delete({ where: { id } });
    revalidatePath('/admin/master');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAllSchoolsSimple() {
  return prisma.sekolah.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
}

// ==========================================
// MENTOR ACTIONS
// ==========================================
export async function getMentors(page = 1, limit = 10, search = '', sort = 'name', dir = 'asc') {
  const skip = (page - 1) * limit;
  const where = {
    ...(search && {
      OR: [
        { name: { contains: search } },
        { type: { contains: search } }
      ]
    })
  };

  let orderBy = {};
  if (sort === 'sekolah') {
    orderBy = { sekolah: { name: dir } };
  } else {
    orderBy = { [sort]: dir };
  }

  const [mentors, total] = await Promise.all([
    prisma.mentor.findMany({
      where,
      skip,
      take: limit,
      include: { sekolah: true },
      orderBy
    }),
    prisma.mentor.count({ where })
  ]);

  return { mentors, total, totalPages: Math.ceil(total / limit) };
}

export async function createMentor(data) {
  try {
    const mentor = await prisma.mentor.create({ data });
    revalidatePath('/admin/master');
    return { success: true, mentor };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateMentor(id, data) {
  try {
    const mentor = await prisma.mentor.update({ where: { id }, data });
    revalidatePath('/admin/master');
    return { success: true, mentor };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteMentor(id) {
  try {
    await prisma.mentor.delete({ where: { id } });
    revalidatePath('/admin/master');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function bulkImportMentors(dataArray) {
  try {
    const schools = await prisma.sekolah.findMany();
    const schoolMap = {};
    schools.forEach(s => { schoolMap[s.name.toLowerCase()] = s.id; });

    const mapped = dataArray.map(d => {
      const sekolahName = (d.sekolahName || '').toLowerCase();
      const sekolahId = schoolMap[sekolahName];
      if (!sekolahId) return null; // Can't import without matching school
      return {
        name: d.name,
        type: d.type, // 'Literasi' or 'Numerasi'
        sekolahId
      };
    }).filter(d => d !== null);

    await prisma.mentor.createMany({
      data: mapped,
      skipDuplicates: true
    });
    revalidatePath('/admin/master');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
