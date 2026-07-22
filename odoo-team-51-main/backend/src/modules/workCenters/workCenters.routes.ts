import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../../middleware/auth.middleware";

const prisma = new PrismaClient();

// Simple read-only lookup list — Work Centers are master data referenced by
// BoM/Manufacturing Order forms but have no dedicated grid permission of
// their own, so any authenticated user can view them.
export const workCentersRouter = Router();
workCentersRouter.use(authMiddleware);
workCentersRouter.get("/", async (req, res) => res.json(await prisma.workCenter.findMany({ orderBy: { name: "asc" } })));
