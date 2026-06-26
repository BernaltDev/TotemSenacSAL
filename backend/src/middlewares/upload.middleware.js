const path = require("path");
const multer = require("multer");
const { generateId } = require("../utils/generateId");

function createUploadMiddleware(folder, allowedExtensions) {
  const storage = multer.diskStorage({
    destination: (request, file, callback) => {
      callback(null, path.resolve(__dirname, `../../uploads/${folder}`));
    },
    filename: (request, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${generateId(folder)}${extension}`);
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: 250 * 1024 * 1024,
    },
    fileFilter: (request, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();

      if (!allowedExtensions.includes(extension)) {
        return callback(
          new Error(`Formato inválido. Formatos aceitos: ${allowedExtensions.join(", ")}`)
        );
      }

      callback(null, true);
    },
  });
}

const spreadsheetUpload = createUploadMiddleware("media", [".xlsx", ".xls", ".csv"]);
const mediaUpload = createUploadMiddleware("media", [".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm", ".ogg"]);
const schoolMapUpload = createUploadMiddleware("settings", [".png", ".jpg", ".jpeg", ".webp", ".svg"]);

module.exports = {
  spreadsheetUpload,
  mediaUpload,
  schoolMapUpload,
};
