import { app } from "./app";
import { VideoProcessor } from "./infra/messaging/processors/VideoProcessor";
import dotenv from 'dotenv'

dotenv.config()

console.log('Environment variables loaded');
console.log('CLOUDFLARE_R2_ENDPOINT:', process.env.CLOUDFLARE_R2_ENDPOINT);

async function bootstrap() {
  try {
    // TODO: Connect to the database
    // await connectToDatabase();

    // TODO: Initialize the application with the configuration
    // await app.init(config);

    const server = app.start()

    const processor = new VideoProcessor()
    await processor.start()

    const gracefulShutdown = async () => {
      console.log('Shutting down gracefully...');
      server.close()

      // await messageQueue.close()

      // TODO: Close database connections
      // await closeDatabaseConnections();

      process.exit(0);
    }

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      // gracefulShutdown();
    });

    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Rejection:', err);
      gracefulShutdown();
    });

  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap()