import { convertVideo } from "../../../shared/ffmpeg";
import fs from 'node:fs';
import * as RabbitMQAdapter from "../RabbitMQAdapter";

export class VideoProcessor {
  constructor() { }

  async start(): Promise<void> {
    console.log('Starting Video Processor...');
    const queueName = 'video:upload_queue';

    await RabbitMQAdapter.consume(queueName, async (message: string) => {
      try {
        const videoData = JSON.parse(message);
        const { videoId, buffer, metadata } = videoData;

        const videoBuffer = Buffer.from(buffer, 'base64');

        console.log('Processing video:', { videoId, metadata });
        console.log('Buffer Length:', videoBuffer.length);

        const onProgress = (progress: number) => {
          console.log(`Processing progress for video ${videoId}: ${progress}%`);
        };

        const onComplete = (manifestUrl: string, videos: { resolution: string, url: string }[]) => {
          console.log(`Video processing complete for ${videoId}. Manifest URL: ${manifestUrl}`);
          console.log('Generated videos:', videos);
        };

        const audioFile = await convertVideo(videoBuffer, onProgress, onComplete);

        // save the audio buffer file to R2


      } catch (error) {
        console.error('Error processing message:', error);
        return;

      }
    })
  }
}