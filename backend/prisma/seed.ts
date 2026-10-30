import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const INITIAL_PERMISSIONS = [
  { code: 'products:view', name: 'View Products', category: 'Products' },
  { code: 'products:manage', name: 'Manage Products (Create/Edit/Delete)', category: 'Products' },
  { code: 'catalogues:view', name: 'View Catalogues', category: 'Catalogues' },
  { code: 'catalogues:manage', name: 'Manage Catalogues (Create/Export)', category: 'Catalogues' },
  { code: 'users:view', name: 'View Admin Users', category: 'Users' },
  { code: 'users:manage', name: 'Manage Admin Users (Invite/Edit/Delete)', category: 'Users' },
  { code: 'roles:manage', name: 'Manage Roles & Permissions', category: 'Roles' },
  { code: 'settings:manage', name: 'Manage System Settings', category: 'Settings' },
];

async function main() {
  console.log('[Seed] Starting initial RBAC & Super Admin provisioning...');

  // 1. Upsert Foundational Permissions
  for (const perm of INITIAL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, category: perm.category },
      create: perm,
    });
  }
  console.log(`[Seed] Seeded ${INITIAL_PERMISSIONS.length} system permissions.`);

  // 2. Fetch all permissions to connect to SUPER_ADMIN role
  const allPermissions = await prisma.permission.findMany();

  // 3. Upsert SUPER_ADMIN Role
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {
      isSystem: true,
      permissions: {
        set: allPermissions.map((p) => ({ id: p.id })),
      },
    },
    create: {
      name: 'SUPER_ADMIN',
      description: 'System Super Administrator with unrestricted platform access',
      isSystem: true,
      permissions: {
        connect: allPermissions.map((p) => ({ id: p.id })),
      },
    },
  });
  console.log(`[Seed] Provisioned SUPER_ADMIN role (${superAdminRole.id}).`);

  // 4. Provision Initial Super Admin User
  const adminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@tilecatalog.com').toLowerCase().trim();
  const adminName = process.env.SUPER_ADMIN_NAME || 'Super Admin';
  const adminRawPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@Tile2026';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminRawPassword, saltRounds);

    const superAdmin = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        status: 'ACTIVE',
        roleId: superAdminRole.id,
      },
    });

    console.log(`[Seed] ✅ Super Admin account created: ${superAdmin.email}`);
  } else {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminRawPassword, saltRounds);
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        roleId: superAdminRole.id,
      },
    });
    console.log(`[Seed] ✅ Super Admin credentials refreshed & active: ${existingAdmin.email}`);
  }

  console.log('[Seed] Provisioning completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
