import { PrismaClient, SignalSourceType, SignalType, Severity } from "@prisma/client";
import { getIO } from "../../sockets/socket.server";
import { SOCKET_EVENTS } from "../../sockets/events";

const prisma = new PrismaClient();
const userSelect = { select: { id: true, name: true, position: true } } as const;

export async function listSignals() {
  return prisma.marketSignal.findMany({
    include: { product: true, reportedByUser: userSelect },
    orderBy: { reportedAt: "desc" },
  });
}

interface CreateSignalInput {
  sourceType: SignalSourceType;
  productId?: number;
  category?: string;
  signalType: SignalType;
  description: string;
  severity: Severity;
}

export async function createSignal(data: CreateSignalInput, userId: number) {
  const signal = await prisma.marketSignal.create({
    data: { ...data, reportedByUserId: userId },
    include: { product: true, reportedByUser: userSelect },
  });
  getIO().emit(SOCKET_EVENTS.SIGNAL_CREATED, { signal });
  return signal;
}

/** Used by the Sales Order screen to show a warning banner before Confirm. */
export async function getActiveSignals(productIds: number[], categories: string[]) {
  if (productIds.length === 0 && categories.length === 0) return [];
  return prisma.marketSignal.findMany({
    where: {
      OR: [
        ...(productIds.length ? [{ productId: { in: productIds } }] : []),
        ...(categories.length ? [{ category: { in: categories } }] : []),
      ],
    },
    include: { product: true },
    orderBy: { reportedAt: "desc" },
  });
}
