const settingsService = require("./settings.service");

async function get(request, response, next) {
  try {
    const settings = await settingsService.getSettings();
    response.json({
      settings,
    });
  } catch (error) {
    next(error);
  }
}

async function update(request, response, next) {
  try {
    const settings = await settingsService.updateSettings(request.body);
    response.json({
      settings,
    });
  } catch (error) {
    next(error);
  }
}

async function uploadSchoolMap(request, response, next) {
  try {
    const settings = await settingsService.updateSchoolMap(request.file);
    response.json({
      settings,
    });
  } catch (error) {
    next(error);
  }
}

async function teacherQrCode(request, response, next) {
  try {
    const qrCode = await settingsService.generateTeacherQrCode();
    response.json({
      qrCode,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  get,
  update,
  uploadSchoolMap,
  teacherQrCode,
};
