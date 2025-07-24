import { Router } from "express";
import videoRoutes from './video'

const app = Router()

app.use(videoRoutes)

app.get('/video/:videoId/status', (req, res) => {
  const { videoId } = req.params
  // Logic to get video status by videoId
  res.json({ videoId, status: "Processing" })
})

app.get('/video/:videoId/stream', (req, res) => {
  const { videoId } = req.params
  // Logic to get video status by videoId
  res.json({ videoId, status: "Streaming..." })
})

export default app