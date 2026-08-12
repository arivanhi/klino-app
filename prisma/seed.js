const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('klino123', 10);

  // Semesters
  await prisma.semester.upsert({
    where: { id: 1 },
    update: {},
    create: {
      tahunAjaran: '2023/2024',
      jenis: 'Genap',
      isActive: true,
    },
  });

  // Schools
  const sekolah1 = await prisma.sekolah.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'SMAN 1 Brebes',
      npsn: '20328901',
      kecamatan: 'Brebes',
    },
  });

  const sekolah2 = await prisma.sekolah.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'SMAN 2 Brebes',
      npsn: '20328902',
      kecamatan: 'Brebes',
    },
  });

  const sekolah3 = await prisma.sekolah.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'SMAN 1 Bumiayu',
      npsn: '20328905',
      kecamatan: 'Bumiayu',
    },
  });


  const admin = await prisma.user.upsert({
    where: { username: 'adminKlino' },
    update: { password: hashedPassword },
    create: {
      username: 'adminKlino',
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  
  const pengawas = await prisma.user.upsert({
    where: { username: 'pengawasLino' },
    update: { password: hashedPassword },
    create: {
      username: 'pengawasLino',
      name: 'Pengawas',
      password: hashedPassword,
      role: 'PENGAWAS',
    },
  });
  
  const guru = await prisma.user.upsert({
    where: { username: '198001012010011001' },
    update: { password: hashedPassword, sekolahId: sekolah1.id },
    create: {
      username: '198001012010011001',
      name: 'Guru',
      password: hashedPassword,
      role: 'GURU',
      sekolahId: sekolah1.id
    },
  });
  
  console.log('Seeded DB with initial master data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
