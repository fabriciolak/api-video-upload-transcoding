import ffmpeg from 'fluent-ffmpeg'
import crypto from 'node:crypto'
import path from 'node:path'

export async function convertVideoToMP3(
  inputFile: Express.Multer.File,
  onProgress: (progress: number) => void
): Promise<File> {
  return new Promise(async (resolve, reject) => {
    const outputId = crypto.randomBytes(16).toString('hex')
    const outputPath = path.join('./uploads', `${outputId}.mp3`)

    ffmpeg(inputFile.path)
      .noVideo()
      .audioBitrate('32k')
      .audioCodec('libmp3lame')
      .on('progress', (progress) => {
        const progressPercentage = Math.round(progress.percent! * 100)

        onProgress(progressPercentage)
      })
      .on('error', (error) => {
        reject(new Error(`Error converting video: ${error.message}`))
      })
      .on('end', () => {
        const audioFile: File = new File([outputPath], `${outputId}.mp3`, {
          type: 'audio/mpeg',
          lastModified: Date.now()
        })

        resolve(audioFile)
      })
      .save(outputPath)
  })
}