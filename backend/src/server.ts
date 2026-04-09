import { app } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const start = async (): Promise<void> => {
  await connectDB(env.mongodbUri);

  app.listen(env.port, () => {
    logger.info(`Server is running on port ${env.port}`);
  });
};

start();
