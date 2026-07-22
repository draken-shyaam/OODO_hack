import { Request, Response } from "express";
import * as bomService from "./bom.service";

export async function listBomsHandler(req: Request, res: Response) {
  res.json(await bomService.listBoms(req.query.search as string | undefined));
}

export async function getBomHandler(req: Request, res: Response) {
  res.json(await bomService.getBom(Number(req.params.id)));
}

export async function createBomHandler(req: Request, res: Response) {
  res.status(201).json(await bomService.createBom(req.body, req.user!.userId));
}

export async function updateBomHandler(req: Request, res: Response) {
  res.json(await bomService.updateBom(Number(req.params.id), req.body, req.user!.userId));
}

export async function deleteBomHandler(req: Request, res: Response) {
  await bomService.deleteBom(Number(req.params.id), req.user!.userId);
  res.status(204).send();
}
