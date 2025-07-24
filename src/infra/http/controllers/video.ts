import type { Request, Response } from 'express'
import crypto from 'node:crypto';
import * as queue from '../../messaging/RabbitMQAdapter'

export class VideoController {
  async upload(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).send({ error: 'No file uploaded.' });
      return;
    }

    console.log('File uploaded:', req.file);

    const videoData = {
      videoId: crypto.randomUUID(),
      buffer: req.file.buffer.toString('base64'),
      metadata: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        fileType: req.file.originalname.split('.').pop() || 'unknown',
        size: req.file.size,  
      },
    };

    const queueName = 'video:upload_queue';

    try {
      await queue.sendToQueue(queueName, JSON.stringify(videoData));
      
      res.status(202).json({
        message: 'Video upload request received.',
        videoId: videoData.videoId,
        metadata: videoData.metadata,
      });

    } catch (error) {
      console.error('Error sending to queue:', error);
      res.status(500).send({ error: 'Failed to send video upload request.' });
    }
  }
}