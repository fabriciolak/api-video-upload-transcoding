import express, { type Application } from 'express'
import { config } from './config'
import routes from './infra/http/routes/index'

class App {
  public app: Application;

  constructor() {
    this.app = express()
    this.setup()
  }
  
  private setup(): void {
    this.app.use(express.json())
    this.app.use(routes)
  }

  public start(): void {
    this.app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`)
    })
  }
}

export const app = new App()