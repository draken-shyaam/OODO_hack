import { createServer } from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { initSocketServer } from "./sockets/socket.server";
import { startCronJobs } from "./jobs";

const app = createApp();
const httpServer = createServer(app);

initSocketServer(httpServer);
startCronJobs();

httpServer.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`PINERP backend listening on http://localhost:${env.PORT}`);
});
