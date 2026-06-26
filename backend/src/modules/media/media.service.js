const fs = require("fs/promises");
const path = require("path");
const { readDatabase, updateDatabase } = require("../../database/storage");
const { generateId } = require("../../utils/generateId");
const { notifyTotem } = require("../../utils/totemEvents");

function getMediaType(file) {
  const mimeType = file.mimetype || "";
  const extension = path.extname(file.originalname).toLowerCase();

  if (mimeType.startsWith("video/") || [".mp4", ".webm", ".ogg"].includes(extension)) {
    return "video";
  }

  return "image";
}

async function listMedia() {
  const database = await readDatabase();

  return [...database.media].sort((first, second) => {
    const byOrder = Number(first.displayOrder || 0) - Number(second.displayOrder || 0);

    if (byOrder !== 0) return byOrder;

    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  });
}

async function createMedia({ file, payload }) {
  if (!file && !payload.description) {
    const error = new Error("Envie uma imagem/vídeo ou informe um texto.");
    error.statusCode = 400;
    throw error;
  }

  const item = {
    id: generateId("media"),
    title: String(payload.title || "Mídia institucional").trim(),
    description: String(payload.description || "").trim(),
    type: file ? getMediaType(file) : "text",
    url: file ? `/uploads/media/${file.filename}` : "",
    durationSeconds: Number(payload.durationSeconds || 8),
    displayOrder: Number(payload.displayOrder || 1),
    isActive: Boolean(payload.isActive ?? true),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await updateDatabase((database) => {
    database.media.push(item);
  });

  notifyTotem("media-created", { id: item.id });

  return item;
}

async function updateMedia(id, payload) {
  const item = await updateDatabase((database) => {
    const currentItem = database.media.find((mediaItem) => mediaItem.id === id);

    if (!currentItem) {
      const error = new Error("Mídia não encontrada.");
      error.statusCode = 404;
      throw error;
    }

    currentItem.title = String(payload.title ?? currentItem.title).trim();
    currentItem.description = String(payload.description ?? currentItem.description).trim();
    currentItem.durationSeconds = Number(payload.durationSeconds ?? currentItem.durationSeconds);
    currentItem.displayOrder = Number(payload.displayOrder ?? currentItem.displayOrder);
    currentItem.isActive = Boolean(payload.isActive);
    currentItem.updatedAt = new Date().toISOString();

    return currentItem;
  });

  notifyTotem("media-updated", { id });

  return item;
}

async function deleteMedia(id) {
  const deleted = await updateDatabase((database) => {
    const item = database.media.find((mediaItem) => mediaItem.id === id);

    if (!item) {
      const error = new Error("Mídia não encontrada.");
      error.statusCode = 404;
      throw error;
    }

    database.media = database.media.filter((mediaItem) => mediaItem.id !== id);

    return item;
  });

  if (deleted.url && deleted.url.startsWith("/uploads/")) {
    const filePath = path.resolve(__dirname, "../../..", deleted.url.replace(/^\//, ""));
    await fs.unlink(filePath).catch(() => {});
  }

  notifyTotem("media-deleted", { id });
}

module.exports = {
  listMedia,
  createMedia,
  updateMedia,
  deleteMedia,
};
