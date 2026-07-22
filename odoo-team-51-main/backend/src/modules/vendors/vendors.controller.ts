import { Request, Response } from "express";
import * as vendorsService from "./vendors.service";

export async function listVendorsHandler(req: Request, res: Response) {
  res.json(await vendorsService.listVendors(req.query.search as string | undefined));
}

export async function getVendorHandler(req: Request, res: Response) {
  res.json(await vendorsService.getVendor(Number(req.params.id)));
}

export async function createVendorHandler(req: Request, res: Response) {
  res.status(201).json(await vendorsService.createVendor(req.body));
}

export async function updateVendorHandler(req: Request, res: Response) {
  res.json(await vendorsService.updateVendor(Number(req.params.id), req.body));
}

export async function deleteVendorHandler(req: Request, res: Response) {
  await vendorsService.deleteVendor(Number(req.params.id));
  res.status(204).send();
}

export async function addQualityIncidentHandler(req: Request, res: Response) {
  const { description, severity } = req.body;
  res.status(201).json(await vendorsService.addQualityIncident(Number(req.params.id), description, severity));
}

export async function getPerformanceHandler(req: Request, res: Response) {
  res.json(await vendorsService.getPerformance(Number(req.params.id)));
}
