import type { Request, Response } from "express";
import { convertVideoToMP3 } from "../../../shared/ffmpeg";

export async function video(req: Request, res: Response): Promise<void> {
  try {
    const { videoId } = req.params

    if (!req.file) {
      res.status(400).json({ error: 'No video file uploaded' });
      return;
    }

    const file = await convertVideoToMP3(req.file, (progress: number) => {
      const progressPercentage = Math.round(progress);
      console.log(`Conversion progress: ${progressPercentage}%`);
    });

    res.status(200).json({
      videoId,
      message: 'Video status retrieved successfully',
      status: 'Processing',
      file
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar o vídeo' });
    console.error('Error processing video:', error);
  }
}