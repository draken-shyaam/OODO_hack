import { Request, Response } from "express";
import * as usersService from "./users.service";
import { AppError } from "../../middleware/errorHandler";

export async function listUsersHandler(req: Request, res: Response) {
  res.json(await usersService.listUsers());
}

export async function getUserHandler(req: Request, res: Response) {
  res.json(await usersService.getUserWithPermissions(Number(req.params.id)));
}

export async function createUserHandler(req: Request, res: Response) {
  res.status(201).json(await usersService.createUser(req.body));
}

export async function updateUserHandler(req: Request, res: Response) {
  res.json(await usersService.updateUser(Number(req.params.id), req.body));
}

export async function getMeHandler(req: Request, res: Response) {
  res.json(await usersService.getMe(req.user!.userId));
}

export async function updateMeHandler(req: Request, res: Response) {
  res.json(await usersService.updateMe(req.user!.userId, req.body));
}

export async function updateMyPhotoHandler(req: Request, res: Response) {
  if (!req.file) throw new AppError(400, "No photo uploaded");
  const photoUrl = `/uploads/photos/${req.file.filename}`;
  res.json(await usersService.updateMyPhoto(req.user!.userId, photoUrl));
}
