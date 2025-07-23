import mult from 'multer';
import fs from 'fs';
import path from 'path';

// const storage = mult.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = path.resolve('uploads');


//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
//   },
// });

const storage = mult.memoryStorage();

export const multer = {
  storage,
  upload: mult({
    storage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100 MB
    },
    fileFilter: (req, file, cb) => {
      // TODO: Change this to a more robust validation
      // Change it to environment variable later
      const filetypes = /\.(mp4|mov|avi|mkv)$/i; // Regex para extensões
      const mimetypes = /video\/mp4|video\/quicktime|video\/x-msvideo|video\/x-matroska/; // MIME types válidos
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = mimetypes.test(file.mimetype);

      if (extname && mimetype) {
        return cb(null, true); // Aceita o arquivo
      }
      cb(new Error('Only video files (mp4, mov, avi, mkv) are allowed!')); // Rejeita o arquivo
    },
  }),
};