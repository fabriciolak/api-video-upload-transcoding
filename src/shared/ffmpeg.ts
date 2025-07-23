import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'stream';
import crypto from 'node:crypto';
import * as dotenv from 'dotenv';
import { r2 } from './cloudflare-r2';

dotenv.config();

const sizes = [
  { width: 160, height: 90, videoCodec: 'libx264', audioCodec: 'aac' },
  { width: 320, height: 240, videoCodec: 'libx264', audioCodec: 'aac' },
  { width: 640, height: 360, videoCodec: 'libx264', audioCodec: 'aac' },
  { width: 1280, height: 720, videoCodec: 'libx264', audioCodec: 'aac' },
  { width: 1920, height: 1080, videoCodec: 'libx264', audioCodec: 'aac' },
];

export async function convertVideo(
  inputBuffer: Buffer,
  onProgress: (progresso: number) => void,
  onComplete: (manifestoUrl: string, videos: { resolution: string, url: string }[]) => void
): Promise<void> {
  if (!inputBuffer || inputBuffer.length === 0) {
    throw new Error('InputBuffer inválido ou vazio');
  }

  const videoId = crypto.randomBytes(16).toString('hex');
  const resultados: { resolution: string, url: string }[] = [];

  const processarResolucao = async (size: typeof sizes[0]): Promise<{ resolution: string, url: string }> => {
    return new Promise((resolve, reject) => {
      const passThrough = new PassThrough();
      const chunks: Buffer[] = [];
      const chave = `videos/${videoId}_${size.width}x${size.height}.mp4`;

      passThrough.on('data', (chunk) => chunks.push(chunk));
      passThrough.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length === 0) {
          return reject(new Error(`Buffer vazio para resolução ${size.width}x${size.height}`));
        }

        const uploadParams = {
          Bucket: process.env.CLOUDFLARE_R2_BUCKET,
          Key: chave,
          Body: buffer,
          ContentType: 'video/mp4',
          
      };

      try {
        await r2.send(new PutObjectCommand(uploadParams));
        // const url = getSignedUrl(
        //   r2,
        //   new PutObjectCommand({
        //     Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        //     Key: chave,
        //     Body: buffer,
        //     ContentType: 'video/mp4',
        //   }),
        //   {
        //     expiresIn: 60 * 60 * 24 * 7, // 7d
        //   },
        // );

        // console.log(`Video uploaded to R2: ${url}`);

        resolve({
          resolution: `${size.width}x${size.height}`,
          url: `https://${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${chave}`,
        });
      } catch (erro) {
        reject(new Error(`Erro no upload para ${size.width}x${size.height}: ${(erro as Error).message}`));
      }
    });
    passThrough.on('error', (erro) => reject(new Error(`Erro no stream: ${erro.message}`)));

    const ffmpegProcess = ffmpeg()
      .input(Readable.from(inputBuffer))
      .inputFormat('mp4')
      .videoCodec(size.videoCodec)
      .audioCodec(size.audioCodec)
      .size(`${size.width}x${size.height}`)
      .format('mp4')
      .outputOptions([
        '-preset fast',
        '-crf 23',
        '-maxrate', `${size.width >= 1280 ? '5M' : '2M'}`,
        '-bufsize', `${size.width >= 1280 ? '10M' : '4M'}`,
        '-movflags frag_keyframe+empty_moov',
        '-threads 1',
      ])
      .on('progress', (progresso) => {
        onProgress(progresso.percent || 0);
      })
      .on('stderr', (stderrLine) => console.log(`FFmpeg stderr [${size.width}x${size.height}]: ${stderrLine}`))
      .on('error', (erro) => {
        reject(new Error(`Erro na conversão ${size.width}x${size.height}: ${erro.message}`));
      })
      .on('end', () => passThrough.end());

    ffmpegProcess.pipe(passThrough, { end: false });
  });
};

try {
  for (const size of sizes) {
    const resultado = await processarResolucao(size);
    resultados.push(resultado);
  }

  const manifesto = `#EXTM3U
#EXT-X-VERSION:3
${resultados
      .map(
        (r) => `#EXT-X-STREAM-INF:BANDWIDTH=${calcularBanda(r.resolution)},RESOLUTION=${r.resolution}
${r.url}`
      )
      .join('\n')}`;

  const manifestoChave = `videos/${videoId}_playlist.m3u8`;
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET,
      Key: manifestoChave,
      Body: manifesto,
      ContentType: 'application/vnd.apple.mpegurl',
    })
  );

  onComplete(`https://${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${manifestoChave}`, resultados);
} catch (erro) {
  throw new Error(`Erro no processamento: ${(erro as Error).message}`);
}
}

function calcularBanda(resolucao: string): number {
  const [width] = resolucao.split('x').map(Number);
  const bandas = {
    160: 400000,
    320: 800000,
    640: 1500000,
    1280: 3000000,
    1920: 6000000,
  };
  return bandas[width as keyof typeof bandas] || 1500000;
}

function getSignedUrl(r2: S3Client, arg1: PutObjectCommand, arg2: { expiresIn: number; }) {
  throw new Error('Function not implemented.');
}
