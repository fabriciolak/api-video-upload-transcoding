import { Router } from "express";
import { video } from "./video";
import { multer } from "../../../shared/utils";

const app = Router()


app.post('/videos/upload', multer.upload.single('video'), video)

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