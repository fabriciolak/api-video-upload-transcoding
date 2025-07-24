import { app } from "./app";
import { VideoProcessor } from "./infra/messaging/processors/VideoProcessor";
import { closeConnection } from './infra/messaging/RabbitMQAdapter'
import dotenv from 'dotenv'

dotenv.config()

async function bootstrap() {
  try {
    const server = app.start()

    const processor = new VideoProcessor()
    await processor.start()

    const gracefulShutdown = async () => {
      try {
        console.log('Shutting down gracefully...');
        server.close()
  
        // Close RabbitMQ connection
        await closeConnection();
  
        process.exit(0);
        
      } catch (error) {
        console.log('Error during shutdown:', error);
        // process.exit(1);
      }
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