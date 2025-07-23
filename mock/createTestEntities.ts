import { PrismaClient, AuthStatus, AuthType, AuthRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function createTestUser() {
  const password = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({ data: { name: 'Test User' } });
  await prisma.auth.create({
    data: {
      password,
      email: 'testuser@mailinator.com',
      status: AuthStatus.APPROVED,
      type: AuthType.USER,
      role: AuthRole.USER,
      userId: user.id,
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
      email: 'testvendor@mailinator.com',
      status: AuthStatus.APPROVED,
      type: AuthType.VENDOR,
      role: AuthRole.USER,
      vendorId: vendor.id,
    },
  });

  const accessToken = uuidv4();
  await prisma.auth.update({
    where: { email: 'testvendor@mailinator.com' },
    data: { accessToken },
  });

  return { vendor, accessToken };
}

export async function createTestActivity(vendorId: string) {
  const activity = await prisma.activity.create({
    data: {
      name: 'Test Activity',
      description: 'Fun activity',
      category: 'ADVENTURE',
      location: 'Test City',
      capacity: 10,
      price: 100,
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
