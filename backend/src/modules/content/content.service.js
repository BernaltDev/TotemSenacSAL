const { readDatabase, updateDatabase } = require("../../database/storage");
const { generateId } = require("../../utils/generateId");
const { notifyTotem } = require("../../utils/totemEvents");

const allowedTypes = ["notices", "news", "events"];

function validateType(type) {
  if (!allowedTypes.includes(type)) {
    const error = new Error("Tipo de conteúdo inválido.");
    error.statusCode = 400;
    throw error;
  }
}

async function listContent(type) {
  validateType(type);

  const database = await readDatabase();

  return [...database.contents[type]].sort((first, second) => {
    const firstDate = new Date(first.createdAt).getTime();
    const secondDate = new Date(second.createdAt).getTime();

    return secondDate - firstDate;
  });
}

async function createContent(type, payload) {
  validateType(type);

  if (!payload.title) {
    const error = new Error("Informe o título.");
    error.statusCode = 400;
    throw error;
  }

  const item = {
    id: generateId(type),
    title: String(payload.title || "").trim(),
    description: String(payload.description || "").trim(),
    imageUrl: String(payload.imageUrl || "").trim(),
    isActive: Boolean(payload.isActive ?? true),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (type === "notices") {
    item.priority = payload.priority || "normal";
  }

  if (type === "events") {
    item.eventDate = payload.eventDate || "";
  }

  await updateDatabase((database) => {
    database.contents[type].push(item);
  });

  notifyTotem("content-created", { type });

  return item;
}

async function updateContent(type, id, payload) {
  validateType(type);

  const updatedItem = await updateDatabase((database) => {
    const item = database.contents[type].find((currentItem) => currentItem.id === id);

    if (!item) {
      const error = new Error("Conteúdo não encontrado.");
      error.statusCode = 404;
      throw error;
    }

    item.title = String(payload.title ?? item.title).trim();
    item.description = String(payload.description ?? item.description).trim();
    item.imageUrl = String(payload.imageUrl ?? item.imageUrl).trim();
    item.isActive = Boolean(payload.isActive);
    item.updatedAt = new Date().toISOString();

    if (type === "notices") {
      item.priority = payload.priority || item.priority || "normal";
    }

    if (type === "events") {
      item.eventDate = payload.eventDate ?? item.eventDate ?? "";
    }

    return item;
  });

  notifyTotem("content-updated", { type, id });

  return updatedItem;
}

async function deleteContent(type, id) {
  validateType(type);

  await updateDatabase((database) => {
    const exists = database.contents[type].some((item) => item.id === id);

    if (!exists) {
      const error = new Error("Conteúdo não encontrado.");
      error.statusCode = 404;
      throw error;
    }

    database.contents[type] = database.contents[type].filter((item) => item.id !== id);
  });

  notifyTotem("content-deleted", { type, id });
}

module.exports = {
  listContent,
  createContent,
  updateContent,
  deleteContent,
};
