import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as queue from '../messaging/RabbitMQAdapter';
import { logger } from '../../shared/utils';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT as string,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.CLOUDFLARE_R2_ACCESS_KEY as string,
  },
});

interface UploadParams {
  bucket: string;
  key: string;
  body: Buffer | string;
  contentType?: string
  metadata?: Record<string, string>
}

interface UploadConfig {
  maxRetries: number
  retryQueueName: string
  deadLetterQueueName: string
  retryableStatusCodes: number[]
}

interface RetryPayload {
  bucket: string
  key: string
  body: Buffer | string
  retryCount: number
  contentType?: string
  metadata?: Record<string, string>
  originalError?: string
}

const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  maxRetries: 3,
  retryQueueName: 'video:retry_upload',
  deadLetterQueueName: 'video:dead_letter_queue',
  retryableStatusCodes: [500, 502, 503, 504, 408] // status code that justifies retry
}

export class CloudflareUpload {
  constructor() { }

  private config: UploadConfig = DEFAULT_UPLOAD_CONFIG

  async upload(params: UploadParams, retryCount: number = 0): Promise<void> {
    // validate params with zod

    try {
      const command = new PutObjectCommand({
        Bucket: params.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType || this.inferContentType(params.body, params.key),
        Metadata: params.metadata
      })

      const response = await r2.send(command)

      if (!response.$metadata.httpStatusCode || response.$metadata.httpStatusCode >= 400) {
        throw new Error(`Upload failed with status: ${response.$metadata.httpStatusCode}`)
      }

      logger.info('Upload successful', {
        bucket: params.bucket,
        key: params.key,
        retryCount
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      logger.error('Upload failed', {
        bucket: params.bucket,
        key: params.key,
        retryCount,
        error: errorMessage
      })

      // send to queue and retry
      if (this.shouldRetry(error, retryCount)) {
        await this.sendToRetryQueue(params, retryCount, errorMessage)
      }
    }
  }



  private shouldRetry(error: unknown, retryCount: number): boolean {
    if (retryCount >= this.config.maxRetries) {
      return false
    }

    if (error instanceof Error) {
      const statusMatch = error.message.match(/status: (\d+)/)

      if (statusMatch) {
        const statusCode = parseInt(statusMatch[1]!)
        return this.config.retryableStatusCodes.includes(statusCode)
      }
    }

    return true
  }

  private async sendToRetryQueue(
    params: UploadParams,
    retryCount: number,
    errorMessage: string
  ): Promise<void> {
    try {
      const payload: Omit<RetryPayload, 'body'> = {
        bucket: params.bucket,
        key: params.key,
        retryCount: retryCount + 1,
        contentType: params.contentType,
        metadata: params.metadata,
        originalError: errorMessage
      }

      await queue.sendToQueue(this.config.retryQueueName, JSON.stringify(payload))

      logger.info('Message sent to retry queue', {
        bucket: params.bucket,
        key: params.key,
        nextRetryCount: retryCount + 1
      })
    } catch (error) {
      logger.error('Failed to sent to retry queue', error)

      const payload = {
        bucket: params.bucket,
        key: params.key,
        retryCount,
        finalError: errorMessage,
        timestamp: new Date().toISOString(),
      };

      await queue.sendToQueue(this.config.deadLetterQueueName, JSON.stringify(payload))

      logger.error('Message sent to dead letter queue', {
        bucket: params.bucket,
        key: params.key,
        retryCount
      });
    }
  }

  private inferContentType(body: Buffer | string, key: string): string {
    if (typeof body === 'string') {
      return 'text/plain'
    }

    const extension = key.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'avi': 'video/avi',

      // just for tests. remove later
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
    }

    return mimeTypes[extension || ''] || 'application/octet-stream'
  }
}
