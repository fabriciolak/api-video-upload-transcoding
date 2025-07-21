import type { Request, Response } from "express";

import ffmpeg from "fluent-ffmpeg";

export async function video(req: Request, res: Response): Promise<void> {
  try {
    const { videoId } = req.params

    const inputPath = req.file?.path;
    const outputPath = `./uploads/converted-${Date.now()}.mp4`;

    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .on('end', () => {
        res.download(outputPath, (err) => {
          if (err) {
            console.error('Error downloading file:', err);
            res.status(500).json({ error: 'Error downloading file' });
          } else {
            console.log('File downloaded successfully');
          }
        })
      })
      .on('error', (err) => {
        console.error('Error processing video:', err);
        res.status(500).json({ error: 'Error processing video' });
      })
      .run();

    res.status(200).json({
      videoId,
      message: 'Video status retrieved successfully',
      status: 'Processing',
      file: req.file
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar o vídeo' });
    console.error('Error processing video:', error);
  }
}