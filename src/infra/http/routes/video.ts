import { Router } from "express";
import { multer } from "../../../shared/utils";
import { VideoController } from "../controllers/video";

const app = Router();

const videoController = new VideoController();

app.post('/videos/upload', multer.upload.single('video'), videoController.upload.bind(videoController));

export default app