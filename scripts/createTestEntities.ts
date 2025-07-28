import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient, AuthRole } from '@prisma/client';

const prisma = new PrismaClient();

export async function createTestUser() {
  const password = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({ data: { name: 'Test User' } });
  await prisma.auth.create({
    data: {
      password,
      verified: true,
      userId: user.id,
      role: AuthRole.USER,
      email: 'testuser@mailinator.com',
    },
  });

  const accessToken = uuidv4();
  await prisma.auth.update({
    where: { email: 'testuser@mailinator.com' },
    data: { accessToken },
  });

  return { user, accessToken };
}

export async function createTestVendor() {
  const password = await bcrypt.hash('password123', 10);
  const vendor = await prisma.vendor.create({ data: { name: 'Test Vendor' } });
  await prisma.auth.create({
    data: {
      password,
      verified: true,
      vendorId: vendor.id,
      role: AuthRole.USER,
      email: 'testvendor@mailinator.com',
    },
  });

  const accessToken = uuidv4();
  await prisma.auth.update({
    where: { email: 'testvendor@mailinator.com' },
    data: { accessToken },
  });

  return { vendor, accessToken };
}

export async function createTestActivity(vendorId: number) {
  // Get the first category for testing
  const category = await prisma.category.findFirst();
  if (!category) {
    throw new Error(
      'No categories found. Please run populate:categories first.',
    );
  }

  const activity = await prisma.activity.create({
    data: {
      name: 'Test Activity',
      description: 'Fun activity',
      categoryId: category.id,
      location: 'Test City',
      duration: '1 hour',
      capacity: 25,
      price: 500,
      images: {
        video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnail: 'https://via.placeholder.com/150',
        images: [
          'https://via.placeholder.com/150',
          'https://via.placeholder.com/150',
        ],
      },
      vendorId,
    },
  });
  return activity;
}

export async function cleanupTestEntities() {
  await prisma.activity.deleteMany({ where: { name: 'Test Activity' } });
  await prisma.vendor.deleteMany({ where: { name: 'Test Vendor' } });
  await prisma.user.deleteMany({ where: { name: 'Test User' } });
  await prisma.auth.deleteMany({
    where: {
      email: { in: ['testuser@mailinator.com', 'testvendor@mailinator.com'] },
    },
  });
}

if (require.main === module) {
  (async () => {
    await cleanupTestEntities();
    const { user, accessToken: userToken } = await createTestUser();
    const { vendor, accessToken: vendorToken } = await createTestVendor();
    const activity = await createTestActivity(vendor.id);
    console.log({ user, userToken, vendor, vendorToken, activity });
    await prisma.$disconnect();
  })();
}
