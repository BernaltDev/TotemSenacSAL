const QRCode = require("qrcode");
const env = require("../../config/env");
const { readDatabase, updateDatabase } = require("../../database/storage");
const { notifyTotem } = require("../../utils/totemEvents");

async function getSettings() {
  const database = await readDatabase();

  return database.settings;
}

async function updateSettings(payload) {
  const settings = await updateDatabase((database) => {
    const current = database.settings;

    current.unitName = String(payload.unitName ?? current.unitName).trim();
    current.publicTitle = String(payload.publicTitle ?? current.publicTitle).trim();
    current.carouselIntervalMs = Number(payload.carouselIntervalMs ?? current.carouselIntervalMs);
    current.secretaryTitle = String(payload.secretaryTitle ?? current.secretaryTitle).trim();
    current.secretaryHours = String(payload.secretaryHours ?? current.secretaryHours).trim();
    current.libraryTitle = String(payload.libraryTitle ?? current.libraryTitle).trim();
    current.libraryHours = String(payload.libraryHours ?? current.libraryHours).trim();

    if (payload.periods && typeof payload.periods === "object") {
      current.periods = {
        ...current.periods,
        ...payload.periods,
      };
    }

    return current;
  });

  notifyTotem("settings-updated");

  return settings;
}

async function updateSchoolMap(file) {
  if (!file) {
    const error = new Error("Envie uma imagem do mapa da escola.");
    error.statusCode = 400;
    throw error;
  }

  const url = `/uploads/settings/${file.filename}`;

  const settings = await updateDatabase((database) => {
    database.settings.schoolMapUrl = url;
    return database.settings;
  });

  notifyTotem("school-map-updated");

  return settings;
}

async function generateTeacherQrCode() {
  const url = `${env.publicBaseUrl}/retirada-chave.html`;
  const dataUrl = await QRCode.toDataURL(url, {
    width: 520,
    margin: 1,
  });

  return {
    url,
    dataUrl,
  };
}

module.exports = {
  getSettings,
  updateSettings,
  updateSchoolMap,
  generateTeacherQrCode,
};
