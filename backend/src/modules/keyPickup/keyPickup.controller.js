const keyPickupService = require("./keyPickup.service");

async function currentClasses(request, response, next) {
  try {
    const result = await keyPickupService.getCurrentClasses(request.query);

    response.json(result);
  } catch (error) {
    next(error);
  }
}

async function confirm(request, response, next) {
  try {
    const schedule = await keyPickupService.confirmPickup(request.params.id);

    response.json({
      message: "Retirada de chave registrada com sucesso.",
      schedule,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  currentClasses,
  confirm,
};
