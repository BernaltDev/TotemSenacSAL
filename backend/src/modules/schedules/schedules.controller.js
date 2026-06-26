const schedulesService = require("./schedules.service");

async function list(request, response, next) {
  try {
    const schedules = await schedulesService.listSchedules(request.query);
    response.json({
      schedules,
    });
  } catch (error) {
    next(error);
  }
}

async function importSpreadsheet(request, response, next) {
  try {
    if (!request.file) {
      return response.status(400).json({
        message: "Envie uma planilha nos formatos .xlsx, .xls ou .csv.",
      });
    }

    const result = await schedulesService.importSpreadsheet({
      filePath: request.file.path,
      date: request.body.date,
      mode: request.body.mode || "replace",
    });

    response.json(result);
  } catch (error) {
    next(error);
  }
}

async function update(request, response, next) {
  try {
    const schedule = await schedulesService.updateSchedule(request.params.id, request.body);
    response.json({
      schedule,
    });
  } catch (error) {
    next(error);
  }
}

async function remove(request, response, next) {
  try {
    await schedulesService.deleteSchedule(request.params.id);
    response.json({
      message: "Aula removida com sucesso.",
    });
  } catch (error) {
    next(error);
  }
}

async function resetStatuses(request, response, next) {
  try {
    const result = await schedulesService.resetStatuses(request.body.date || request.query.date);
    response.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  importSpreadsheet,
  update,
  remove,
  resetStatuses,
};
