import { Request, Response } from "express";
import * as intelHubService from "./intelHub.service";

export async function createIntelPostHandler(req: Request, res: Response) {
  res.status(201).json(await intelHubService.createIntelPost(req.body, req.user!.userId));
}

export async function listIntelPostsHandler(req: Request, res: Response) {
  res.json(
    await intelHubService.listIntelPosts({
      search: req.query.search as string | undefined,
      postType: req.query.postType as string | undefined,
      status: req.query.status as string | undefined,
    })
  );
}

export async function getIntelPostHandler(req: Request, res: Response) {
  res.json(await intelHubService.getIntelPost(Number(req.params.id)));
}

export async function verifyIntelPostHandler(req: Request, res: Response) {
  res.json(await intelHubService.verifyIntelPost(Number(req.params.id), req.user!.userId, req.body.starsAwarded));
}

export async function rejectIntelPostHandler(req: Request, res: Response) {
  res.json(await intelHubService.rejectIntelPost(Number(req.params.id), req.user!.userId));
}

export async function getLeaderboardHandler(req: Request, res: Response) {
  res.json(await intelHubService.getLeaderboard());
}

export async function getNotificationStateHandler(req: Request, res: Response) {
  res.json(await intelHubService.getNotificationState(req.user!.userId, req.user!.isAdmin));
}

export async function markIntelHubViewedHandler(req: Request, res: Response) {
  await intelHubService.markIntelHubViewed(req.user!.userId);
  res.status(204).send();
}
