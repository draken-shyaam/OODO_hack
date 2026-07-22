import { PrismaClient, IntelPostStatus, IntelPostType } from "@prisma/client";
import { AppError } from "../../middleware/errorHandler";
import { getIO } from "../../sockets/socket.server";
import { SOCKET_EVENTS } from "../../sockets/events";

const prisma = new PrismaClient();

const DUPLICATE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DEFAULT_STARS = 5;

const authorSelect = { select: { id: true, name: true, position: true, intelStars: true } } as const;

function withDerivedExpired<T extends { status: IntelPostStatus; expiresAt: Date | null }>(post: T) {
  const isExpired = post.expiresAt !== null && post.expiresAt < new Date() && post.status !== "rejected";
  return { ...post, displayStatus: isExpired ? "expired" : post.status };
}

interface CreateIntelPostInput {
  title: string;
  description: string;
  postType: IntelPostType;
  materialName: string;
  supplierName: string;
  location?: string;
  price?: number;
  quantity?: number;
  contactInfo?: string;
  expiresAt?: Date;
}

/**
 * Lightweight spam/duplicate guard: blocks a near-identical post (same
 * material + supplier + post type, case-insensitive) from being re-submitted
 * within 30 days, regardless of who's posting it — the feed's whole point is
 * useful new leads, not the same "Wood Co. has cheaper Wooden Legs" tip
 * re-posted five times to farm stars.
 */
async function assertNotDuplicate(data: CreateIntelPostInput) {
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const existing = await prisma.intelPost.findFirst({
    where: {
      postType: data.postType,
      materialName: { equals: data.materialName },
      supplierName: { equals: data.supplierName },
      status: { not: "rejected" },
      createdAt: { gte: since },
    },
  });
  if (existing) {
    throw new AppError(409, "A similar post for this material/supplier/type was already submitted in the last 30 days.");
  }
}

export async function createIntelPost(data: CreateIntelPostInput, userId: number) {
  await assertNotDuplicate(data);

  const post = await prisma.intelPost.create({
    data: { ...data, createdByUserId: userId },
    include: { createdBy: authorSelect, verifiedBy: authorSelect },
  });

  getIO().emit(SOCKET_EVENTS.INTEL_POST_CREATED, { post });
  return withDerivedExpired(post);
}

interface ListFilters {
  search?: string;
  postType?: string;
  status?: string;
}

const VALID_TYPES = new Set(Object.values(IntelPostType));
const VALID_STATUSES = new Set(Object.values(IntelPostStatus));

export async function listIntelPosts(filters: ListFilters) {
  const searchClause = filters.search
    ? {
        OR: [
          { title: { contains: filters.search } },
          { materialName: { contains: filters.search } },
          { supplierName: { contains: filters.search } },
          { location: { contains: filters.search } },
        ],
      }
    : {};

  const typeClause = filters.postType && VALID_TYPES.has(filters.postType as IntelPostType) ? { postType: filters.postType as IntelPostType } : {};

  // "expired" is derived (see withDerivedExpired), so filtering by it can't
  // be a plain column match — it means "expiresAt has passed", independent
  // of whatever status was last persisted.
  let statusClause = {};
  if (filters.status === "expired") {
    statusClause = { expiresAt: { lt: new Date() }, status: { not: "rejected" } };
  } else if (filters.status && VALID_STATUSES.has(filters.status as IntelPostStatus)) {
    statusClause = { status: filters.status as IntelPostStatus };
  }

  const posts = await prisma.intelPost.findMany({
    where: { ...searchClause, ...typeClause, ...statusClause },
    include: { createdBy: authorSelect, verifiedBy: authorSelect },
    orderBy: { createdAt: "desc" },
  });

  return posts.map(withDerivedExpired);
}

export async function getIntelPost(id: number) {
  const post = await prisma.intelPost.findUnique({ where: { id }, include: { createdBy: authorSelect, verifiedBy: authorSelect } });
  if (!post) throw new AppError(404, "IntelHub post not found");
  return withDerivedExpired(post);
}

export async function verifyIntelPost(id: number, adminUserId: number, starsAwarded: number = DEFAULT_STARS) {
  const post = await prisma.intelPost.findUnique({ where: { id } });
  if (!post) throw new AppError(404, "IntelHub post not found");
  if (post.status !== "pending") throw new AppError(400, "Only a Pending post can be verified");

  const [updated] = await prisma.$transaction([
    prisma.intelPost.update({
      where: { id },
      data: { status: "verified", verifiedByUserId: adminUserId, verifiedAt: new Date(), starsAwarded },
      include: { createdBy: authorSelect, verifiedBy: authorSelect },
    }),
    // Stars are awarded once, at verification time, after an admin has
    // offline-confirmed the tip actually held up — never automatically for
    // the act of posting, which is what keeps the leaderboard meaningful.
    prisma.user.update({ where: { id: post.createdByUserId }, data: { intelStars: { increment: starsAwarded } } }),
    prisma.auditLog.create({
      data: { module: "product", entity: "IntelPost", recordId: id, recordRef: `INTEL-${id}`, action: "updated", fieldChanged: "Status", oldValue: "pending", newValue: "verified", userId: adminUserId },
    }),
  ]);

  getIO().emit(SOCKET_EVENTS.INTEL_POST_VERIFIED, { post: updated });
  return withDerivedExpired(updated);
}

export async function rejectIntelPost(id: number, adminUserId: number) {
  const post = await prisma.intelPost.findUnique({ where: { id } });
  if (!post) throw new AppError(404, "IntelHub post not found");
  if (post.status !== "pending") throw new AppError(400, "Only a Pending post can be rejected");

  const updated = await prisma.intelPost.update({
    where: { id },
    data: { status: "rejected", verifiedByUserId: adminUserId, verifiedAt: new Date() },
    include: { createdBy: authorSelect, verifiedBy: authorSelect },
  });
  await prisma.auditLog.create({
    data: { module: "product", entity: "IntelPost", recordId: id, recordRef: `INTEL-${id}`, action: "updated", fieldChanged: "Status", oldValue: "pending", newValue: "rejected", userId: adminUserId },
  });

  // Reuses the same event as verify — both represent "an admin just acted on
  // a Pending post," which is exactly what should clear the sidebar's red dot.
  getIO().emit(SOCKET_EVENTS.INTEL_POST_VERIFIED, { post: updated });
  return withDerivedExpired(updated);
}

export async function getLeaderboard() {
  return prisma.user.findMany({
    where: { intelStars: { gt: 0 } },
    select: { id: true, name: true, position: true, intelStars: true },
    orderBy: { intelStars: "desc" },
    take: 20,
  });
}

/**
 * "Unread" = posts created after this user last opened the feed. "Pending"
 * = posts awaiting admin review, regardless of read state — surfaced
 * separately because an admin needs that nudge even if they've technically
 * "seen" the feed already (read != reviewed).
 */
export async function getNotificationState(userId: number, isAdmin: boolean) {
  const view = await prisma.intelHubView.findUnique({ where: { userId } });
  const since = view?.lastViewedAt ?? new Date(0);

  const [unreadCount, pendingCount] = await Promise.all([
    prisma.intelPost.count({ where: { createdAt: { gt: since } } }),
    isAdmin ? prisma.intelPost.count({ where: { status: "pending" } }) : Promise.resolve(0),
  ]);

  return { unreadCount, pendingCount, hasNotification: unreadCount > 0 || pendingCount > 0 };
}

export async function markIntelHubViewed(userId: number) {
  await prisma.intelHubView.upsert({
    where: { userId },
    update: { lastViewedAt: new Date() },
    create: { userId, lastViewedAt: new Date() },
  });
}
