import express from 'express'
import type { Application, Request, Response, NextFunction } from 'express'
import { type Server } from 'node:http';
import { config } from './config'
import routes from './infra/http/routes/index'
import dotenv from 'dotenv'

dotenv.config()

class App {
  public app: Application;
  private server?: Server;

  constructor() {
    this.app = express()
    this.setup()
  }
  
  private setup(): void {
    this.app.use(express.json())
    this.app.use(routes)

    this.app.use('/uploads', express.static('uploads'));

    // Handle errors
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error(err.stack)
      res.status(500).json({
        message: 'Internal Server Error',
        error: err.message,
        code: 'INTERNAL_SERVER_ERROR'
      })
    })
  }

  public start(): Server {
    this.server = this.app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`)
    })

    return this.server;
  }

  public async close(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          console.log('Server closed')
          resolve()
        })
      })
    } else {
      console.warn('Server is not running')
    }
  }
}

export const app = new App()