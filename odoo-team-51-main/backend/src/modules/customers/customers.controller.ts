import { Request, Response } from "express";
import * as customersService from "./customers.service";

export async function listCustomersHandler(req: Request, res: Response) {
  res.json(await customersService.listCustomers(req.query.search as string | undefined));
}

export async function getCustomerHandler(req: Request, res: Response) {
  res.json(await customersService.getCustomer(Number(req.params.id)));
}
