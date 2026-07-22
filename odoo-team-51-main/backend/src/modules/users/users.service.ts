import bcrypt from "bcrypt";
import { PrismaClient, PermissionModule } from "@prisma/client";
import { AppError } from "../../middleware/errorHandler";

const prisma = new PrismaClient();

const PERMISSION_SELECT = {
  module: true,
  field: true,
  canCreate: true,
  canView: true,
  canEdit: true,
  canDelete: true,
} as const;

// Explicit field allowlist — never `passwordHash` — for every query whose
// result can reach the browser (session bootstrap, profile, admin user view).
const SAFE_USER_SELECT = {
  id: true,
  loginId: true,
  name: true,
  email: true,
  position: true,
  address: true,
  mobile: true,
  photoUrl: true,
  isAdmin: true,
  permissions: { select: PERMISSION_SELECT },
} as const;

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, loginId: true, name: true, email: true, position: true, isAdmin: true, photoUrl: true },
    orderBy: { name: "asc" },
  });
}

export async function getUserWithPermissions(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: SAFE_USER_SELECT });
  if (!user) throw new AppError(404, "User not found");
  return user;
}

interface CreateUserInput {
  loginId: string;
  email: string;
  password: string;
  name: string;
  position?: string;
  isAdmin?: boolean;
}

export async function createUser(data: CreateUserInput) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      loginId: data.loginId,
      email: data.email,
      passwordHash,
      name: data.name,
      position: data.position,
      isAdmin: data.isAdmin ?? false,
    },
    select: SAFE_USER_SELECT,
  });
}

interface PermissionRowInput {
  module: PermissionModule;
  field: string;
  canCreate: boolean;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface UpdateUserInput {
  name?: string;
  address?: string;
  mobile?: string;
  position?: string;
  isAdmin?: boolean;
  permissions?: PermissionRowInput[];
}

export async function updateUser(userId: number, data: UpdateUserInput) {
  const { permissions, ...profileFields } = data;

  await prisma.user.update({ where: { id: userId }, data: profileFields });

  if (permissions) {
    for (const p of permissions) {
      await prisma.permission.upsert({
        where: { userId_module_field: { userId, module: p.module, field: p.field } },
        update: { canCreate: p.canCreate, canView: p.canView, canEdit: p.canEdit, canDelete: p.canDelete },
        create: { userId, module: p.module, field: p.field, canCreate: p.canCreate, canView: p.canView, canEdit: p.canEdit, canDelete: p.canDelete },
      });
    }
  }

  return getUserWithPermissions(userId);
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: SAFE_USER_SELECT });
  if (!user) throw new AppError(404, "User not found");
  return user;
}

interface UpdateMeInput {
  name?: string;
  address?: string;
  mobile?: string;
}

export async function updateMe(userId: number, data: UpdateMeInput) {
  return prisma.user.update({ where: { id: userId }, data, select: SAFE_USER_SELECT });
}

export async function updateMyPhoto(userId: number, photoUrl: string) {
  return prisma.user.update({ where: { id: userId }, data: { photoUrl }, select: SAFE_USER_SELECT });
}
